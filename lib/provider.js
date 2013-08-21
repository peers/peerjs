/**
 * Manages all negotiations between Peers.
 */
var Negotiator = {
  pcs: {}, // pc id => pc.
  providers: {} // peer id => provider.
};

Negotiator._idPrefix = 'pc_'

Negotiator.startConnection = function(peer, connection, provider, options) {
  // TODO
  if (!Negotiator.providers[peer]) {
    Negotiator.providers[peer] = provider;
  }

  var pc;
  if (!options || !options._pc) {
    Negotiator._startPeerConnection(provider);
  }

  if (options) {
    pc = 
    if (options._stream) {
      if (options.sdp) { // Is a MC receiver.
        Negotiator.handleSDP(peer, connection, options);
      } else { // Is a MC originator.

      }
    } else { // Is a DC receiver.

    }
  } else { // Is a DC originator.
    
  }


  // Return the PeerConnection.

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
  
  // Listen for remote streams.
  this._setupStreamListener();

}


/** Start a PC. */
Negotiator._startPeerConnection = function(provider) {
  util.log('Creating RTCPeerConnection.');

  var id = Negotiator._idPrefix + util.randomToken();
  Negotiator.pcs[id] = new RTCPeerConnection(provider.options.config, { optional: [ { RtpDataChannels: true } ]});
};

/** Add DataChannels to all queued DataConnections. */
ConnectionManager.prototype._processQueue = function() {
  for (var i = 0; i < this._queued.length; i++) {
    var conn = this._queued[i];
    if (conn.constructor == MediaConnection) {
      console.log('adding', conn.localStream);
      this.pc.addStream(conn.localStream);
    } else if (conn.constructor == DataConnection) {
      // reliable: true not yet implemented in Chrome
      var reliable = util.browserisms === 'Firefox' ? conn.reliable : false;
      conn.addDC(this.pc.createDataChannel(conn.label, { reliable: reliable }));
    }
  }
  // onnegotiationneeded not yet implemented in Firefox, must manually create offer
  if (util.browserisms === 'Firefox' && this._queued.length > 0) {
    this._makeOffer();
  }
  this._queued = [];
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
        dst: self.peer,
        manager: self._managerId
      });
    }
  };
  this.pc.oniceconnectionstatechange = function() {
    if (!!self.pc) {
      switch (self.pc.iceConnectionState) {
        case 'failed':
          util.log('iceConnectionState is disconnected, closing connections to ' + self.peer);
          self.close();
          break;
        case 'completed':
          self.pc.onicecandidate = null;
          break;
      }
    }
  };
  // Fallback for older Chrome impls.
  this.pc.onicechange = this.pc.oniceconnectionstatechange;
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

/** Set up remote stream listener. */
ConnectionManager.prototype._setupStreamListener = function() {
  var self = this;
  util.log('Listening for remote stream');
  this.pc.onaddstream = function(evt) {
    util.log('Received remote stream');
    var stream = evt.stream;
    if (!!self._call) {
      self._call.receiveStream(stream);
      
    }
  };
};


/** Send an offer. */
ConnectionManager.prototype._makeOffer = function() {
  var self = this;
  this.pc.createOffer(function(offer) {
    util.log('Created offer.');
    // Firefox currently does not support multiplexing once an offer is made.
    self.firefoxSingular = true;

    if (util.browserisms === 'Webkit') {
      //offer.sdp = Reliable.higherBandwidthSDP(offer.sdp);
    }

    self.pc.setLocalDescription(offer, function() {
      util.log('Set localDescription to offer');
      self._socket.send({
        type: 'OFFER',
        payload: {
          sdp: offer,
          config: self._options.config,
          labels: self.labels,
          call: !!self._call
        },
        dst: self.peer,
        manager: self._managerId
      });
      // We can now reset labels because all info has been communicated.
      self.labels = {};
    }, function(err) {
      self.emit('error', err);
      util.log('Failed to setLocalDescription, ', err);
    });
  }, function(err) {
    self.emit('error', err);
    util.log('Failed to createOffer, ', err);
  });
};

/** Create an answer for PC. */
ConnectionManager.prototype._makeAnswer = function() {
  var self = this;
  this.pc.createAnswer(function(answer) {
    util.log('Created answer.');

    if (util.browserisms === 'Webkit') {
      //answer.sdp = Reliable.higherBandwidthSDP(answer.sdp);
    }

    self.pc.setLocalDescription(answer, function() {
      util.log('Set localDescription to answer.');
      self._socket.send({
        type: 'ANSWER',
        payload: {
          sdp: answer
        },
        dst: self.peer,
        manager: self._managerId
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

  this.destroyed = true;
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
ConnectionManager.prototype.handleSDP = function(sdp, type, call) {
  sdp = new RTCSessionDescription(sdp);

  var self = this;
  this.pc.setRemoteDescription(sdp, function() {
    util.log('Set remoteDescription: ' + type);
    if (type === 'OFFER') {
      if (call && !self._call) {
        self._call = new MediaConnection(self.peer);
        self._call.on('answer', function(stream){
          if (stream) {
            self.pc.addStream(stream);
          }
          self._makeAnswer();
          util.setZeroTimeout(function(){
            // Add remote streams
            self._call.receiveStream(self.pc.getRemoteStreams()[0]);
          });
        });
        self.emit('call', self._call);
      } else {
        self._makeAnswer();
      }
    } else {
      // Got answer from remote
      self._lock = false;
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

/** Updates label:[serialization, reliable, metadata] pairs from offer. */
ConnectionManager.prototype.handleUpdate = function(updates) {
  var labels = Object.keys(updates);
  for (var i = 0, ii = labels.length; i < ii; i += 1) {
    var label = labels[i];
    this.labels[label] = updates[label];
  }
};

/** Handle peer leaving. */
ConnectionManager.prototype.handleLeave = function() {
  util.log('Peer ' + this.peer + ' disconnected.');
  this.close();
};

/** Closes manager and all related connections. */
ConnectionManager.prototype.close = function() {
  if (this.destroyed) {
    this.emit('error', new Error('Connections to ' + this.peer + 'are already closed.'));
    return;
  }

  var labels = Object.keys(this.connections);
  for (var i = 0, ii = labels.length; i < ii; i += 1) {
    var label = labels[i];
    var connection = this.connections[label];
    connection.close();
  }
  
  // TODO: close the call
  
  this.connections = null;
  this._cleanup();
};

/** Create and returns a DataConnection with the peer with the given label. */
ConnectionManager.prototype.connect = function(options) {
  if (this.destroyed) {
    return;
  }
console.log('trying to connect');
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
    console.log('qing', this._lock);
    this._queued.push(connection);
  }

  this._lock = true
  return connection;
};

ConnectionManager.prototype.call = function(stream, options) {
  if (this.destroyed) {
    return;
  }

  options = util.extend({
    
  }, options);

  if (!!this.pc && !this._lock) {
    this.pc.addStream(stream);
    if (util.browserisms === 'Firefox') {
      this._makeOffer();
    }
  }
  
  var connection = new MediaConnection(this.peer, stream, options);
  this._call = connection;
  
  if (!this.pc || this._lock) {
    this._queued.push(connection);
  }

  this._lock = true;
  
  
  return connection;
};


