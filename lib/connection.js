function DataConnection(options, socket, cb) {
  if (!(this instanceof DataConnection)) return new DataConnection(options);
  EventEmitter.call(this);

  // Is this the originator?
  this._originator = options.originator || false;
  this._cb = cb;
  this._peer = options.peer;
  this._id = options.id;

  var sdp = options.sdp;
  this.metadata = options.metadata;

  // Set up socket handlers.
  this._socket = socket;

  // Firefoxism: connectDataConnection ports.
  if (browserisms == 'Firefox') {
    if (!DataConnection.usedPorts) {
      DataConnection.usedPorts = [];
    }
    this.localPort = util.randomPort();
    while (DataConnection.usedPorts.indexOf(this.localPort) != -1) {
      this.localPort = util.randomPort();
    }
    this.remotePort = util.randomPort();
    while (this.remotePort == this.localPort ||
        DataConnection.usedPorts.indexOf(this.localPort) != -1) {
      this.remotePort = util.randomPort();
    }
    DataConnection.usedPorts.push(this.remotePort);
    DataConnection.usedPorts.push(this.localPort);
  }

  // Set up PeerConnection.
  this._startPeerConnection();
  var self = this;
  if (this._originator) {
    this._setupDataChannel();
    this._maybeBrowserisms();
  } else if (sdp) {
    try {
      sdp = new RTCSessionDescription(sdp);
    } catch(e) {
      util.log('Firefox');
    }
    this._pc.setRemoteDescription(sdp, function() {
      util.log('setRemoteDescription: offer');
      self._setupDataChannel();
      self._maybeBrowserisms();

    }, function(err) {
      this._cb('failed to setRemoteDescription');
      util.log('failed to setRemoteDescription with offer, ', err);
    });
  }
};

util.inherits(DataConnection, EventEmitter);

DataConnection.prototype.handleAnswer = function(message) {
  var sdp = message.sdp;
  try {
    sdp = new RTCSessionDescription(message.sdp);
  } catch(e) {
    util.log('Firefox');
  }
  var self = this;
  this._pc.setRemoteDescription(sdp, function() {
    util.log('setRemoteDescription: answer');
    // Firefoxism
    if (browserisms == 'Firefox') {
      self._pc.connectDataConnection(self.localPort, self.remotePort);
      self._socket.send(JSON.stringify({
        type: 'PORT',
        dst: self._peer,
        src: self._id,
        remote: self.localPort,
        local: self.remotePort
      }));
    }
    util.log('ORIGINATOR: PeerConnection success');
  }, function(err) {
    this._cb('failed to setRemoteDescription');
    util.log('failed to setRemoteDescription, ', err);
  });
};


DataConnection.prototype.handleCandidate = function(message) {
  util.log(message.candidate);
  var candidate = new RTCIceCandidate(message.candidate);
  this._pc.addIceCandidate(candidate);
};


DataConnection.prototype.handleLeave = function(message) {
  util.log('counterpart disconnected');
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

DataConnection.prototype.handlePort = function(message) {
  if (!DataConnection.usedPorts) {
    DataConnection.usedPorts = [];
  }
  DataConnection.usedPorts.push(message.local);
  DataConnection.usedPorts.push(message.remote);
  this._pc.connectDataConnection(message.local, message.remote);
};


/** Starts a PeerConnection and sets up handlers. */
DataConnection.prototype._startPeerConnection = function() {
  this._pc = new RTCPeerConnection(this._config, { optional:[ { RtpDataChannels: true } ]});
  this._setupIce();
};


/** Takes care of ice handlers. */
DataConnection.prototype._setupIce = function() {
  var self = this;
  this._pc.onicecandidate = function(event) {
    util.log('candidates received');
    if (event.candidate) {
      self._socket.send(JSON.stringify({
        type: 'CANDIDATE',
        candidate: event.candidate,
        dst: self._peer,
        src: self._id
      }));
    } else {
      util.log("End of candidates.");
    }
  };
};


/** Sets up DataChannel handlers. */
DataConnection.prototype._setupDataChannel = function() {
  var self = this;
  if (this._originator) {
    /** ORIGINATOR SETUP */
    if (browserisms == 'Webkit') {

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
    /** TARGET SETUP */
    this._pc.ondatachannel = function(dc) {
      util.log('SINK: ondatachannel triggered');
      self._dc = dc;
      self._dc.binaryType = 'blob';
      self._dc.onmessage = function(e) {
        self._handleDataMessage(e);
      };

      self._cb(null, self);
    };

    this._pc.onconnection = function() {
      util.log('SINK: onconnection triggered');
    };
  }

  this._pc.onclosedconnection = function() {
    // Remove socket handlers perhaps.
    self.emit('close', self._peer);
  };
};


DataConnection.prototype._startDataChannel = function() {
  var self = this;
  this._dc = this._pc.createDataChannel(this._peer, { reliable: false });
  this._dc.binaryType = 'blob';
  this._dc.onmessage = function(e) {
    self._handleDataMessage(e);
  };

  this._cb(null, self);
};


/** Decide whether to handle Firefoxisms. */
DataConnection.prototype._maybeBrowserisms = function() {
  var self = this;
  if (browserisms == 'Firefox') {
    getUserMedia({ audio: true, fake: true }, function(s) {
      self._pc.addStream(s);

      if (self._originator) {
        self._makeOffer();
      } else {
        self._makeAnswer();
      }

    }, function(err) { util.log('crap'); });
  } else {
    if (self._originator) {
      this._makeOffer();
    } else {
      this._makeAnswer();
    }
  }
}


/** Create an answer for PC. */
DataConnection.prototype._makeAnswer = function() {
  var self = this;

  this._pc.createAnswer(function(answer) {
    self._pc.setLocalDescription(answer, function() {
      util.log('setLocalDescription: answer');
      self._socket.send(JSON.stringify({
        type: 'ANSWER',
        src: self._id,
        sdp: answer,
        dst: self._peer
      }));
    }, function(err) {
      self._cb('failed to setLocalDescription');
      util.log('failed to setLocalDescription, ', err)
    });
  }, function(err) {
    self._cb('failed to create answer');
    util.log('failed to create answer, ', err)
  });
};


/** Create an offer for PC. */
DataConnection.prototype._makeOffer = function() {
  var self = this;

  this._pc.createOffer(function(offer) {
    self._pc.setLocalDescription(offer, function() {
      util.log('setLocalDescription: offer');
      self._socket.send(JSON.stringify({
        type: 'OFFER',
        sdp: offer,
        dst: self._peer,
        src: self._id,
        metadata: self._metadata
      }));
    }, function(err) {
      self._cb('failed to setLocalDescription');
      util.log('failed to setLocalDescription, ', err);
    });
  });
};


/** Allows user to send data. */
DataConnection.prototype.send = function(data) {
  var ab = BinaryPack.pack(data);
  this._dc.send(ab);
};


// Handles a DataChannel message.
DataConnection.prototype._handleDataMessage = function(e) {
  var self = this;
  var fr = new FileReader();
  fr.onload = function(evt) {
    var ab = evt.target.result;
    var data = BinaryPack.unpack(ab);

    self.emit('data', data);
  };
  fr.readAsArrayBuffer(e.data);
};
