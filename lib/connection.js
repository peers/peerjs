/**
 * A DataChannel PeerConnection between two Peers.
 */
function DataConnection(id, peer, socket, options) {
  if (!(this instanceof DataConnection)) return new DataConnection(options);
  EventEmitter.call(this);

  options = util.extend({
    config: { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] },
    reliable: false
  }, options);
  this._options = options;
  
  // Connection is not open yet
  this.open = false;
  
  this.id = id;
  this.peer = peer;
  this.metadata = options.metadata;

  this._originator = (options.sdp === undefined);
  this._socket = socket;
  this._sdp = options.sdp;

  // TODO: consider no-oping this method:
  if (!!this.id) {
    this.initialize();
  }
};

util.inherits(DataConnection, EventEmitter);

DataConnection.prototype.initialize = function(id) {
  if (!!id) {
    this.id = id;
  }
  // Firefoxism: connectDataConnection ports.
  /*if (util.browserisms === 'Firefox') {
    this._firefoxPortSetup();
  }*/
  
  // Set up PeerConnection.
  this._startPeerConnection();
  
  // Listen for ICE candidates
  this._setupIce();
  
  // Listen for negotiation needed
  // ** Chrome only.
  if (util.browserisms !== 'Firefox' && !!this.id) {
    this._setupOffer();
  }
  
  // Listen or create a data channel
  this._setupDataChannel();
  
  var self = this;
  if (this._sdp) {
    this.handleSDP({ type: 'OFFER', sdp: this._sdp });
  }
  
  // Makes offer if Firefox
  /*if (util.browserisms === 'Firefox') {
    this._firefoxAdditional();
  }*/

  // No-op this.
  this.initialize = function() {};
}

DataConnection.prototype._setupOffer = function() {
  var self = this;
  util.log('Listening for `negotiationneeded`');
  this._pc.onnegotiationneeded = function() {
    util.log('`negotiationneeded` triggered');
    self._makeOffer();
  };
}

DataConnection.prototype._setupDataChannel = function() {
  var self = this;
  if (this._originator) {
    util.log('Creating data channel');
    this._dc = this._pc.createDataChannel(this.peer, { reliable: this._options.reliable });
    this._configureDataChannel();
  } else {
    util.log('Listening for data channel');
    this._pc.ondatachannel = function(evt) {
      util.log('Received data channel');
      self._dc = evt.channel;
      self._configureDataChannel();
    };
  }
};


/** Starts a PeerConnection and sets up handlers. */
DataConnection.prototype._startPeerConnection = function() {
  util.log('Creating RTCPeerConnection');
  this._pc = new RTCPeerConnection(this._options.config, { optional:[ { RtpDataChannels: true } ]});
};


/** Takes care of ice handlers. */
DataConnection.prototype._setupIce = function() {
  util.log('Listening for ICE candidates');
  var self = this;
  this._pc.onicecandidate = function(evt) {
    if (evt.candidate) {
      util.log('Received ICE candidates');
      self._socket.send({
        type: 'CANDIDATE',
        candidate: evt.candidate,
        dst: self.peer,
        src: self.id
      });
    }
  };
};


/*DataConnection.prototype._firefoxPortSetup = function() {
  if (!DataConnection.usedPorts) {
    DataConnection.usedPorts = [];
  }
  this.localPort = util.randomPort();
  while (DataConnection.usedPorts.indexOf(this.localPort) != -1) {
    this.localPort = util.randomPort();
  }
  this.remotePort = util.randomPort();
  while (this.remotePort === this.localPort ||
      DataConnection.usedPorts.indexOf(this.localPort) != -1) {
    this.remotePort = util.randomPort();
  }
  DataConnection.usedPorts.push(this.remotePort);
  DataConnection.usedPorts.push(this.localPort);
}*/

DataConnection.prototype._configureDataChannel = function() {
  var self = this;
  
  if (util.browserisms !== 'Webkit') {
    this._dc.binaryType = 'arraybuffer';
  }
  this._dc.onopen = function() {
    util.log('Data channel connection success');
    self.open = true;
    self.emit('open');
  };
  this._dc.onmessage = function(e) {
    self._handleDataMessage(e);
  };
  this._dc.onclose = function(e) {
    self.emit('close');
  };
};


/** Decide whether to handle Firefoxisms. */
/*DataConnection.prototype._firefoxAdditional = function() {
  var self = this;
  getUserMedia({ audio: true, fake: true }, function(s) {
    self._pc.addStream(s);
    if (self._originator) {
      self._makeOffer();
    }
  }, function(err) { util.log('Could not getUserMedia'); });
};*/

DataConnection.prototype._makeOffer = function() {
  var self = this;
  this._pc.createOffer(function(offer) {
    util.log('Created offer');
    self._pc.setLocalDescription(offer, function() {
      util.log('Set localDescription to offer');
      self._socket.send({
        type: 'OFFER',
        sdp: offer,
        dst: self.peer,
        src: self.id,
        metadata: self.metadata
      });
    }, function(err) {
      self.emit('error', 'Failed to setLocalDescription');
      util.log('Failed to setLocalDescription, ', err);
    });
  });
};

/** Create an answer for PC. */
DataConnection.prototype._makeAnswer = function() {
  var self = this;
  this._pc.createAnswer(function(answer) {
    util.log('Created answer');
    self._pc.setLocalDescription(answer, function() {
      util.log('Set localDescription to answer');
      self._socket.send({
        type: 'ANSWER',
        src: self.id,
        sdp: answer,
        dst: self.peer
      });
    }, function(err) {
      self.emit('error', 'Failed to setLocalDescription');
      util.log('Failed to setLocalDescription, ', err)
    });
  }, function(err) {
    self.emit('error', 'Failed to create answer');
    util.log('Failed to create answer, ', err)
  });
};


DataConnection.prototype._cleanup = function() {
  if (!!this._dc && this._dc.readyState != 'closed') {
    this._dc.close();
    this._dc = null;
  }
  if (!!this._pc && this._pc.readyState != 'closed') {
    this._pc.close();
    this._pc = null;
  }
};


// Handles a DataChannel message.
DataConnection.prototype._handleDataMessage = function(e) {
  var self = this;
  if (e.data.constructor === Blob) {
    util.blobToArrayBuffer(e.data, function(ab) {
      var data = BinaryPack.unpack(ab);
      self.emit('data', data);
    });
  } else if (e.data.constructor === ArrayBuffer) {
      var data = BinaryPack.unpack(e.data);
      self.emit('data', data);
  } else if (e.data.constructor === String) {
      var ab = util.binaryStringToArrayBuffer(e.data);
      var data = BinaryPack.unpack(ab);
      self.emit('data', data);
  }
};


/**
 * Exposed functionality for users.
 */

/** Allows user to close connection. */
DataConnection.prototype.close = function() {
  this._cleanup();
  var self = this;
  if (this.open) {
    this._socket.send({
      type: 'LEAVE',
      dst: self.peer,
      src: self.id,
    });
  }
  this.open = false;
  this.emit('close', this.peer);
};


/** Allows user to send data. */
DataConnection.prototype.send = function(data) {
  var self = this;
  var blob = BinaryPack.pack(data);
  if (util.browserisms === 'Webkit') {
    util.blobToBinaryString(blob, function(str){
      self._dc.send(str);
    });
  } else {
    this._dc.send(blob);
  }
};

DataConnection.prototype.handleSDP = function(message) {
  var sdp = message.sdp;
  if (util.browserisms != 'Firefox') {
    sdp = new RTCSessionDescription(sdp);
  }
  var self = this;
  this._pc.setRemoteDescription(sdp, function() {
    util.log('Set remoteDescription: ' + message.type);
    // Firefoxism
    if (message.type === 'ANSWER' && util.browserisms === 'Firefox') {
      self._pc.connectDataConnection(self.localPort, self.remotePort);
      self._socket.send({
        type: 'PORT',
        dst: self.peer,
        src: self.id,
        remote: self.localPort,
        local: self.remotePort
      });
    } else if (message.type === 'OFFER') {
      self._makeAnswer();
    }
  }, function(err) {
    self.emit('error', 'Failed to setRemoteDescription');
    util.log('Failed to setRemoteDescription, ', err);
  });
};


DataConnection.prototype.handleCandidate = function(message) {
  var candidate = new RTCIceCandidate(message.candidate);
  this._pc.addIceCandidate(candidate);
  util.log('Added ice candidate');
};


DataConnection.prototype.handleLeave = function() {
  util.log('Peer ' + this.peer + ' disconnected');
  this.close();
};

/*
DataConnection.prototype.handlePort = function(message) {
  if (!DataConnection.usedPorts) {
    DataConnection.usedPorts = [];
  }
  DataConnection.usedPorts.push(message.local);
  DataConnection.usedPorts.push(message.remote);
  this._pc.connectDataConnection(message.local, message.remote);
};
*/

