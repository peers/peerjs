/**
 * Manages all negotiations between Peers.
 */
// TODO: LOCKS.
// TODO: FIREFOX new PC after offer made for DC.
var Negotiator = {
  pcs: {}, // pc id => pc.
  providers: {}, // provider's id => providers (there may be multiple providers/client.
  options: {},
  queue: [] // connections that are delayed due to a PC being in use.
}

Negotiator._idPrefix = 'pc_'

Negotiator.startConnection = function(type, peer, connection, provider, options) {
  Negotiator._addProvider(peer, provider);

  var pc;
  // options.pc is the PC's ID.
  pc = Negotiator.pcs[options.pc]
  if (!pc || pc.signalingState !== 'stable') {
    pc = Negotiator._startPeerConnection(peer, provider);
  }

  if (type === 'media' && options._stream) {
    // Add the stream.
    pc.addStream(options._stream);
  }

  // What do we need to do now?
  if (options.originator) {
    if (type === 'data') {
      // Create the datachannel.
      dc = pc.createDataChannel(options.label, {reliable: reliable});
      connection = provider.getConnection(peer, connection);
      connection.initialize(dc);
      Negotiator._attachConnectionListeners(dc);
    }

    if (!util.supports.onnegotiationneeded) {
      Negotiator._makeOffer(peer, connection, options);
    }
  } else {
    Negotiator._handleSDP(peer, connection, options);
  }

  return pc;
}

Negotiator._addProvider = function(peer, provider) {
  if ((!provider.id && !provider.disconnected) || !provider.socket.open) {
    // Wait for provider to obtain an ID.
    provider.on('open', function(id) {
      Negotiator._addProvider(peer, provider);
    });
  } else {
    Negotiator.providers[provider.id] = provider;
  }
}


/** Start a PC. */
Negotiator._startPeerConnection = function(peer, provider) {
  util.log('Creating RTCPeerConnection.');

  var id = Negotiator._idPrefix + util.randomToken();
  pc = new RTCPeerConnection(provider.options.config, {optional: [{RtpDataChannels: true}]});
  Negotiator.pcs[id] = pc;

  Negotiator._startListeners(peer, provider, pc, id);

  return pc;
}

/** Set up various WebRTC listeners. */
Negotiator._setupListeners = function(peer, provider, pc, id) {
  // ICE CANDIDATES.
  util.log('Listening for ICE candidates.');
  pc.onicecandidate = function(evt) {
    if (evt.candidate) {
      util.log('Received ICE candidates.');
      provider.socket.send({
        type: 'CANDIDATE',
        payload: {
          candidate: evt.candidate,
          pc: id  // Send along this PC's ID.
        },
        dst: peer,
      });
    }
  };

  pc.oniceconnectionstatechange = function() {
    switch (pc.iceConnectionState) {
      case 'failed':
        util.log('iceConnectionState is disconnected, closing connections to ' + self.peer);
        Negotiator._cleanup();
        break;
      case 'completed':
        pc.onicecandidate = null;
        break;
    }
  };

  // Fallback for older Chrome impls.
  pc.onicechange = pc.oniceconnectionstatechange;

  // ONNEGOTIATIONNEEDED (Chrome)
  util.log('Listening for `negotiationneeded`');
  pc.onnegotiationneeded = function() {
    util.log('`negotiationneeded` triggered');
    Negotiator._makeOffer();
  };

  // DATACONNECTION.
  util.log('Listening for data channel');
  // Fired between offer and answer, so options should already be saved
  // in the options hash.
  pc.ondatachannel = function(evt) {
    util.log('Received data channel');
    var dc = evt.channel;
    connection = provider.getConnection(peer, connection);
    connection.initialize(dc);
    Negotiator._attachConnectionListeners(dc);
  };

  // MEDIACONNECTION.
  util.log('Listening for remote stream');
  pc.onaddstream = function(evt) {
    util.log('Received remote stream');
    var stream = evt.stream;
    provider.getConnection(peer, id).receiveStream(stream);
  };
}

Negotiator._cleanup = function() {
  // TODO
}

Negotiator._makeOffer = function() {
  // TODO
  pc.createOffer(function(offer) {
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
}

Negotiator._makeAnswer = function() {
  // TODO
}

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
}

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
}

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
}

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
}

/** Handle a candidate. */
ConnectionManager.prototype.handleCandidate = function(message) {
  var candidate = new RTCIceCandidate(message.candidate);
  this.pc.addIceCandidate(candidate);
  util.log('Added ICE candidate.');
}

/** Updates label:[serialization, reliable, metadata] pairs from offer. */
ConnectionManager.prototype.handleUpdate = function(updates) {
  var labels = Object.keys(updates);
  for (var i = 0, ii = labels.length; i < ii; i += 1) {
    var label = labels[i];
    this.labels[label] = updates[label];
  }
}

/** Handle peer leaving. */
ConnectionManager.prototype.handleLeave = function() {
  util.log('Peer ' + this.peer + ' disconnected.');
  this.close();
}

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

  // TODO: close the call.
  this.connections = null;
  this._cleanup();
}
