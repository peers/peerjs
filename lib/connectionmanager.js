/**
 * Manages DataConnections between its peer and one other peer.
 * Internally, manages PeerConnection.
 */
function ConnectionManager(id, peer, socket, options) {
  if (!(this instanceof ConnectionManager)) return new ConnectionManager(id, peer, socket, options);
  EventEmitter.call(this);

  options = util.extend({
    config: { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] },
    reliable: false,
    serialization: 'binary'
  }, options);
  this._options = options;

  // PeerConnection is not yet open.
  this.open = false;

  this.id = id;
  this.peer = peer;
  this.pc = null;

  // Mapping labels to metadata and serialization.
  // label => { metadata: ..., serialization: ..., reliable: ...}
  this.labels = {}

  // DataConnections on this PC.
  this.connections = {};

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
  this.pc = new RTCPeerConnection(this._options.config, { optional: [ { rtpDataChannels: true } ]});
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
  this.pc.ondatachannel = function(evt) {
    util.log('Received data channel');
    var dc = evt.channel;
    var label = dc.label;
    var options = self.labels[label] || {};
    var connection  = new DataConnection(dc, options);
    self.connections[label] = connection;
    self.emit('connection', connection);
  };
};

/** Send an offer. */
ConnectionManager.prototype._makeOffer = function() {
  var self = this;
  this.pc.createOffer(function(offer) {
    util.log('Created offer.');
    self.pc.setLocalDescription(offer, function() {
      util.log('Set localDescription to offer');
      self._socket.send({
        type: 'OFFER',
        payload: {
          sdp: offer,
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
  this._cleanup();
  var self = this;
  if (this.open) {
    this._socket.send({
      type: 'LEAVE',
      dst: self.peer
    });
  }
  this.open = false;
  this.emit('close', this.peer);
};

/** Create and returns a DataConnection with the peer with the given label. */
// TODO: queue in case no ID/PC.
ConnectionManager.prototype.connect = function(label, options) {
  options = util.extend({
    reliable: false,
    serialization: 'binary'
  }, options);

  this.labels[label] = {
    reliable: options.reliable,
    serialization: options.serialization,
    metadata: options.metadata
  };

  var connection  = new DataConnection(this.pc.createDataChannel(this.peer, { reliable: false }), options);
  this.connections[label] = connection;
  return connection;
};

/** Updates label:[serialization, reliable, metadata] pairs from offer. */
// TODO: queue in case no ID/PC.
ConnectionManager.prototype.update = function(updates) {
  var labels = Object.keys(updates);
  for (var i = 0, ii = labels.length; i < ii; i += 1) {
    var label = labels[i];
    this.labels[label] = updates[label];
  }
};
