/**
 * Manages DataConnections between its peer and one other peer.
 * Internally, manages PeerConnection.
 */
function ConnectionManager(id, peer, socket, options) {
  if (!(this instanceof ConnectionManager)) return new ConnectionManager(id, peer, socket, options);
  EventEmitter.call(this);

  options = util.extend({
    config: { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] }
  }, options);
  this._options = options;

  // PeerConnection is not yet dead.
  this.open = true;

  this.id = id;
  this.peer = peer;
  this.pc = null;

  // Mapping labels to metadata and serialization.
  // label => { metadata: ..., serialization: ..., reliable: ...}
  this.labels = {};
  // A default label in the event that none are passed in.
  this._default = 0;

  // DataConnections on this PC.
  this.connections = {};
  this._queued = [];

  this._socket = socket;

  if (!!this.id) {
    this.initialize();
  }
};

util.inherits(ConnectionManager, EventEmitter);

ConnectionManager.prototype.initialize = function(id, socket) {
  if (!!id) {
    this.id = id;
  }
  if (!!socket) {
    this._socket = socket;
  }

  // Set up PeerConnection.
  this._startPeerConnection();

  // Process queued DCs.
  this._processQueue();

  // Listen for ICE candidates.
  this._setupIce();

  // Listen for negotiation needed.
  // Chrome only **
  this._setupNegotiationHandler();

  // Listen for data channel.
  this._setupDataChannel();

  this.initialize = function() { };
};

/** Start a PC. */
ConnectionManager.prototype._startPeerConnection = function() {
  util.log('Creating RTCPeerConnection');
  this.pc = new RTCPeerConnection(this._options.config, { optional: [ { RtpDataChannels: true } ]});
};

/** Add DataChannels to all queued DataConnections. */
ConnectionManager.prototype._processQueue = function() {
  var conn = this._queued.pop();
  if (!!conn) {
    var reliable = util.browserisms === 'Firefox' ? conn.reliable : false;
    conn.addDC(this.pc.createDataChannel(conn.label, { reliable: reliable }));
  }
};

/** Set up ICE candidate handlers. */
ConnectionManager.prototype._setupIce = function() {
  util.log('Listening for ICE candidates.');
  var self = this;
  this.pc.onicecandidate = function(evt) {
    if (evt.candidate) {
      util.log('Received ICE candidates.');
      self._socket.send({
        type: 'CANDIDATE',
        payload: {
          candidate: evt.candidate
        },
        dst: self.peer
      });
    }
  };
  this.pc.oniceconnectionstatechange = function() {
    if (!!self.pc && self.pc.iceConnectionState === 'disconnected') {
      util.log('iceConnectionState is disconnected, closing connections to ' + this.peer);
      self.close();
    }
  };
  // Fallback for older Chrome impls.
  this.pc.onicechange = function() {
    if (!!self.pc && self.pc.iceConnectionState === 'disconnected') {
      util.log('iceConnectionState is disconnected, closing connections to ' + this.peer);
      self.close();
    }
  };
};

/** Set up onnegotiationneeded. */
ConnectionManager.prototype._setupNegotiationHandler = function() {
  var self = this;
  util.log('Listening for `negotiationneeded`');
  this.pc.onnegotiationneeded = function() {
    util.log('`negotiationneeded` triggered');
    self._makeOffer();
  };
};

/** Set up Data Channel listener. */
ConnectionManager.prototype._setupDataChannel = function() {
  var self = this;
  util.log('Listening for data channel');
  this.pc.ondatachannel = function(evt) {
    util.log('Received data channel');
    var dc = evt.channel;
    var label = dc.label;
    // This should not be empty.
    var options = self.labels[label] || {};
    var connection  = new DataConnection(self.peer, dc, options);
    self._attachConnectionListeners(connection);
    self.connections[label] = connection;
    self.emit('connection', connection);
  };
};

/** Send an offer. */
ConnectionManager.prototype._makeOffer = function() {
  var self = this;
  this.pc.createOffer(function(offer) {
    util.log('Created offer.');
    // Firefox currently does not support multiplexing once an offer is made.
    self.firefoxSingular = true;

    self.pc.setLocalDescription(offer, function() {
      util.log('Set localDescription to offer');
      self._socket.send({
        type: 'OFFER',
        payload: {
          sdp: offer,
          config: self._options.config,
          labels: self.labels
        },
        dst: self.peer
      });
      // We can now reset labels because all info has been communicated.
      self.labels = {};
    }, function(err) {
      self.emit('error', err);
      util.log('Failed to setLocalDescription, ', err);
    });
  });
};

/** Create an answer for PC. */
ConnectionManager.prototype._makeAnswer = function() {
  var self = this;
  this.pc.createAnswer(function(answer) {
    util.log('Created answer.');
    self.pc.setLocalDescription(answer, function() {
      util.log('Set localDescription to answer.');
      self._socket.send({
        type: 'ANSWER',
        payload: {
          sdp: answer
        },
        dst: self.peer
      });
    }, function(err) {
      self.emit('error', err);
      util.log('Failed to setLocalDescription, ', err);
    });
  }, function(err) {
    self.emit('error', err);
    util.log('Failed to create answer, ', err);
  });
};

/** Clean up PC, close related DCs. */
ConnectionManager.prototype._cleanup = function() {
  util.log('Cleanup ConnectionManager for ' + this.peer);
  if (!!this.pc && (this.pc.readyState !== 'closed' || this.pc.signalingState !== 'closed')) {
    this.pc.close();
    this.pc = null;
  }

  var self = this;
  this._socket.send({
    type: 'LEAVE',
    dst: self.peer
  });

  this.open = false;
  this.emit('close');
};

/** Attach connection listeners. */
ConnectionManager.prototype._attachConnectionListeners = function(connection) {
  var self = this;
  connection.on('close', function() {
    if (!!self.connections[connection.label]) {
      delete self.connections[connection.label];
    }

    if (!Object.keys(self.connections).length) {
      self._cleanup();
    }
  });
  connection.on('open', function() {
    self._lock = false;
    self._processQueue();
  });
};

/** Handle an SDP. */
ConnectionManager.prototype.handleSDP = function(sdp, type) {
  sdp = new RTCSessionDescription(sdp);

  var self = this;
  this.pc.setRemoteDescription(sdp, function() {
    util.log('Set remoteDescription: ' + type);
    if (type === 'OFFER') {
      self._makeAnswer();
    }
  }, function(err) {
    self.emit('error', err);
    util.log('Failed to setRemoteDescription, ', err);
  });
};

/** Handle a candidate. */
ConnectionManager.prototype.handleCandidate = function(message) {
  var candidate = new RTCIceCandidate(message.candidate);
  this.pc.addIceCandidate(candidate);
  util.log('Added ICE candidate.');
};

/** Handle peer leaving. */
ConnectionManager.prototype.handleLeave = function() {
  util.log('Peer ' + this.peer + ' disconnected.');
  this.close();
};

/** Closes manager and all related connections. */
ConnectionManager.prototype.close = function() {
  if (!this.open) {
    this.emit('error', new Error('Connections to ' + this.peer + 'are already closed.'));
    return;
  }

  var labels = Object.keys(this.connections);
  for (var i = 0, ii = labels.length; i < ii; i += 1) {
    var label = labels[i];
    var connection = this.connections[label];
    connection.close();
  }
  this.connections = null;
  this._cleanup();
};

/** Create and returns a DataConnection with the peer with the given label. */
ConnectionManager.prototype.connect = function(options) {
  if (!this.open) {
    return;
  }

  options = util.extend({
    label: 'peerjs',
    reliable: (util.browserisms === 'Firefox')
  }, options);

  // Check if label is taken...if so, generate a new label randomly.
  while (!!this.connections[options.label]) {
    options.label = 'peerjs' + this._default;
    this._default += 1;
  }

  this.labels[options.label] = options;

  var dc;
  if (!!this.pc && !this._lock) {
    var reliable = util.browserisms === 'Firefox' ? options.reliable : false;
    dc = this.pc.createDataChannel(options.label, { reliable: reliable });
    if (util.browserisms === 'Firefox') {
      this._makeOffer();
    }
  }
  var connection = new DataConnection(this.peer, dc, options);
  this._attachConnectionListeners(connection);
  this.connections[options.label] = connection;

  if (!this.pc || this._lock) {
    this._queued.push(connection);
  }

  this._lock = true
  return connection;
};

/** Updates label:[serialization, reliable, metadata] pairs from offer. */
ConnectionManager.prototype.update = function(updates) {
  var labels = Object.keys(updates);
  for (var i = 0, ii = labels.length; i < ii; i += 1) {
    var label = labels[i];
    this.labels[label] = updates[label];
  }
};
