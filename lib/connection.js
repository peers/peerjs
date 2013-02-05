function DataConnection(id, peer, socket, httpUrl, cb, options) {
  if (!(this instanceof DataConnection)) return new DataConnection(options);
  EventEmitter.call(this);

  options = util.extend({
    config: { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] },
    socketOpen: false,
    reliable: false
  }, options);
  this._options = options;
  
  this._id = id;
  this._peer = peer;
  this._originator = (options.sdp === undefined);
  this._cb = cb;
  this._httpUrl = httpUrl;
  this.metadata = options.metadata;
  this._socketOpen = options.socketOpen;
  

  // Set up socket handlers.
  this._socket = socket;

  // Firefoxism: connectDataConnection ports.
  if (util.browserisms === 'Firefox') {
    this._firefoxPortSetup();
  }
  
  // Set up PeerConnection.
  this._startPeerConnection();
  
  // Listen for ICE candidates
  this._setupIce();
  
  // Listen for negotiation needed
  // ** Chrome only.
  if (util.browserisms === 'Webkit') {
    this._setupOffer();
  }
  
  // Listen or create a data channel
  this._setupDataChannel();
  
  var self = this;
  if (options.sdp) {
    this.handleSDP({ type: 'OFFER', sdp: options.sdp });
    if (util.browserisms !== 'Firefox') { 
      this._makeAnswer();
    }
  }
  
  if (util.browserisms === 'Firefox') {
    this._firefoxAdditional();
  }
};

util.inherits(DataConnection, EventEmitter);

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
    this._dc = this._pc.createDataChannel(this._peer, { reliable: this._options.reliable });
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
      self._handleBroker('ice', JSON.stringify({
        type: 'CANDIDATE',
        candidate: evt.candidate,
        dst: self._peer,
        src: self._id
      }));
    }
  };
};

DataConnection.prototype._handleBroker = function(type, data) {
  if (this._socketOpen) {
    this._socket.send(data);
  } else {
    var self = this;
    var http = new XMLHttpRequest();
    http.open('post', this._httpUrl + '/' + type, true);
    http.setRequestHeader('Content-Type', 'application/json');
    http.onload = function() {
      // If destination peer is not available...
      if (http.responseText != 'OK') {
        util.log('Destination peer not available. Connection closing...');
        self.close();
      }
    }
    http.send(data);
  }
};

// Awaiting update in Firefox spec ***
/** Sets up DataChannel handlers. 
DataConnection.prototype._setupDataChannel = function() {
  var self = this;
  if (this._originator) {
    
    if (util.browserisms === 'Webkit') {

      // TODO: figure out the right thing to do with this.
      this._pc.onstatechange = function() {
        util.log('State Change: ', self._pc.readyState);
      }
      
    } else {
      this._pc.onconnection = function() {
        util.log('ORIGINATOR: onconnection triggered');

        self._startDataChannel();
      };
    }
  } else {
    

    this._pc.onconnection = function() {
      util.log('SINK: onconnection triggered');
    };
  }

  this._pc.onclosedconnection = function() {
    // Remove socket handlers perhaps.
    self.emit('close', self._peer);
  };
};
*/

DataConnection.prototype._firefoxPortSetup = function() {
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
}

DataConnection.prototype._configureDataChannel = function() {
  var self = this;
  
  if (util.browserisms === 'Firefox') {
    this._dc.binaryType = 'blob';
  }
  this._dc.onopen = function() {
    util.log('Data channel connection success');
    self._cb(null, self);
  };
  this._dc.onmessage = function(e) {
    self._handleDataMessage(e);
  };
};


/** Decide whether to handle Firefoxisms. */
DataConnection.prototype._firefoxAdditional = function() {
  var self = this;
  getUserMedia({ audio: true, fake: true }, function(s) {
    self._pc.addStream(s);
    if (self._originator) {
      self._makeOffer();
    } else {
      self._makeAnswer();
    }
  }, function(err) { util.log('Could not getUserMedia'); });
}

DataConnection.prototype._makeOffer = function() {
  var self = this;
  this._pc.createOffer(function(offer) {
    util.log('Created offer');
    self._pc.setLocalDescription(offer, function() {
      util.log('Set localDescription to offer');
      //self._peerReady = false;
      self._handleBroker('offer', JSON.stringify({
        type: 'OFFER',
        sdp: offer,
        dst: self._peer,
        src: self._id,
        metadata: self.metadata
      }));
    }, function(err) {
      self._cb('Failed to setLocalDescription');
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
      self._handleBroker('answer', JSON.stringify({
        type: 'ANSWER',
        src: self._id,
        sdp: answer,
        dst: self._peer
      }));
    }, function(err) {
      self._cb('Failed to setLocalDescription');
      util.log('Failed to setLocalDescription, ', err)
    });
  }, function(err) {
    self._cb('Failed to create answer');
    util.log('Failed to create answer, ', err)
  });
};


DataConnection.prototype._cleanup = function() {
  if (!!this._pc && this._pc.readyState != 'closed') {
    this._pc.close();
    this._pc = null;
  }
  if (!!this._dc && this._dc.readyState != 'closed') {
    this._dc.close();
    this._dc = null;
  }
  this.emit('close', this._peer);
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
  this._handleBroker('leave', JSON.stringify({
    type: 'LEAVE',
    dst: self._peer,
    src: self._id,
  }));
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


/**
 * Exposed functions for Peer.
 */

DataConnection.prototype.setSocketOpen = function() {
  this._socketOpen = true;
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
      self._handleBroker('port', JSON.stringify({
        type: 'PORT',
        dst: self._peer,
        src: self._id,
        remote: self.localPort,
        local: self.remotePort
      }));
    }
  }, function(err) {
    this._cb('Failed to setRemoteDescription');
    util.log('Failed to setRemoteDescription, ', err);
  });
};


DataConnection.prototype.handleCandidate = function(message) {
  var candidate = new RTCIceCandidate(message.candidate);
  this._pc.addIceCandidate(candidate);
  util.log('Added ice candidate');
};


DataConnection.prototype.handleLeave = function() {
  util.log('Peer ' + this._peer + ' disconnected');
  this._cleanup();
};

DataConnection.prototype.handlePort = function(message) {
  if (!DataConnection.usedPorts) {
    DataConnection.usedPorts = [];
  }
  DataConnection.usedPorts.push(message.local);
  DataConnection.usedPorts.push(message.remote);
  this._pc.connectDataConnection(message.local, message.remote);
};


