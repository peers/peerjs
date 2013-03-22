/**
 * Wraps a DataChannel between two Peers.
 */
function DataConnection(id, peer, socket, options) {
  if (!(this instanceof DataConnection)) return new DataConnection(id, peer, socket, options);
  EventEmitter.call(this);

  options = util.extend({
    config: { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] },
    reliable: false,
    serialization: 'binary'
  }, options);
  this._options = options;

  // Connection is not open yet.
  this.open = false;

  this.id = id;
  this.peer = peer;
  this.metadata = options.metadata;
  this.serialization = options.serialization;

  this._originator = (options.sdp === undefined);
  this._socket = socket;
  this._sdp = options.sdp;

  if (!!this.id) {
    this.initialize();
  }
};

util.inherits(DataConnection, EventEmitter);

DataConnection.prototype.initialize = function(id, socket) {
  if (!!id) {
    this.id = id;
  }
  if (!!socket) {
    this._socket = socket;
  }

  // Set up PeerConnection.
  this._startPeerConnection();

  // Listen for ICE candidates
  this._setupIce();

  // Listen for negotiation needed
  // ** Chrome only.
  if (util.browserisms !== 'Firefox' && !!this.id) {
    this._setupOffer();
  }

  // Listen for or create a data channel
  this._setupDataChannel();

  var self = this;
  if (!!this._sdp) {
    this.handleSDP(this._sdp, 'OFFER');
  }

  // No-op this.
  this.initialize = function() {};
};


DataConnection.prototype._setupOffer = function() {
  var self = this;
  util.log('Listening for `negotiationneeded`');
  this._pc.onnegotiationneeded = function() {
    util.log('`negotiationneeded` triggered');
    self._makeOffer();
  };
};


DataConnection.prototype._setupDataChannel = function() {
  var self = this;
  if (this._originator) {
    util.log('Creating data channel');
    // FOR NOW: reliable DC is not supported.
    this._dc = this._pc.createDataChannel(this.peer, { reliable: false });
    // Experimental reliable wrapper.
    if (this._options.reliable) {
      this._reliable = new Reliable(this._dc, util.debug);
    }
    this._configureDataChannel();
  } else {
    util.log('Listening for data channel');
    this._pc.ondatachannel = function(evt) {
      util.log('Received data channel');
      self._dc = evt.channel;
      // Experimental reliable wrapper.
      if (self._options.reliable) {
        self._reliable = new Reliable(self._dc, util.debug);
      }
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
        payload: {
          candidate: evt.candidate
        },
        dst: self.peer
      });
    }
  };
};

DataConnection.prototype._configureDataChannel = function() {
  var self = this;
  
  if (util.browserisms !== 'Webkit') {
    this._dc.binaryType = 'arraybuffer';
  }
  this._dc.onopen = function() {
    util.log('Data channel connection success');
    self.open = true;
    self.emit('open');
    self._pc.onicecandidate = null;
  };
  if (this._reliable) {
    this._reliable.onmessage = function(msg) {
      self.emit('data', msg);
    };
  } else {
    this._dc.onmessage = function(e) {
      self._handleDataMessage(e);
    };
  }
  this._dc.onclose = function(e) {
    self.emit('close');
  };
};

DataConnection.prototype._makeOffer = function() {
  var self = this;
  this._pc.createOffer(function(offer) {
    util.log('Created offer');
    // Reliable hack.
    if (self._options.reliable) {
      offer.sdp = Reliable.higherBandwidthSDP(offer.sdp);
    }
    self._pc.setLocalDescription(offer, function() {
      util.log('Set localDescription to offer');
      self._socket.send({
        type: 'OFFER',
        payload: {
          sdp: offer,
          serialization: self.serialization,
          metadata: self.metadata,
          reliable: self._options.reliable
        },
        dst: self.peer
      });
    }, function(err) {
      self.emit('error', err);
      util.log('Failed to setLocalDescription, ', err);
    });
  });
};

/** Create an answer for PC. */
DataConnection.prototype._makeAnswer = function() {
  var self = this;
  this._pc.createAnswer(function(answer) {
    util.log('Created answer');
    // Reliable hack.
    if (self._options.reliable) {
      answer.sdp = Reliable.higherBandwidthSDP(answer.sdp);
    }
    self._pc.setLocalDescription(answer, function() {
      util.log('Set localDescription to answer');
      self._socket.send({
        type: 'ANSWER',
        payload: {
          sdp: answer
        },
        dst: self.peer
      });
    }, function(err) {
      self.emit('error', err);
      util.log('Failed to setLocalDescription, ', err)
    });
  }, function(err) {
    self.emit('error', err);
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
  var data = e.data;
  var datatype = data.constructor;
  if (this.serialization === 'binary' || this.serialization === 'binary-utf8') {
    if (datatype === Blob) {
      util.blobToArrayBuffer(data, function(ab) {
        data = util.unpack(ab);
        self.emit('data', data);
      });
      return;
    } else if (datatype === ArrayBuffer) {
      data = util.unpack(data);
    } else if (datatype === String) {
      var ab = util.binaryStringToArrayBuffer(data);
      data = util.unpack(ab);
    }
  } else if (this.serialization === 'json') {
    data = JSON.parse(data);
  }
  this.emit('data', data);
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
      dst: self.peer
    });
  }
  this.open = false;
  this.emit('close', this.peer);
};


/** Allows user to send data. */
DataConnection.prototype.send = function(data) {
  if (this._reliable) {
    // Note: reliable sending will make it so that you cannot customize
    // serialization.
    this._reliable.send(data);
    return;
  }
  var self = this;
  if (this.serialization === 'none') {
    this._dc.send(data);
  } else if (this.serialization === 'json') {
    this._dc.send(JSON.stringify(data));
  } else {
    var utf8 = (this.serialization === 'binary-utf8');
    var blob = util.pack(data, utf8);
    // DataChannel currently only supports strings.
    if (util.browserisms === 'Webkit') {
      util.blobToBinaryString(blob, function(str){
        self._dc.send(str);
      });
    } else {
      this._dc.send(blob);
    }
  }
};

DataConnection.prototype.handleSDP = function(sdp, type) {
  if (util.browserisms != 'Firefox') {
    sdp = new RTCSessionDescription(sdp);
  }
  var self = this;
  this._pc.setRemoteDescription(sdp, function() {
    util.log('Set remoteDescription: ' + type);
    if (type === 'OFFER') {
      self._makeAnswer();
    }
  }, function(err) {
    self.emit('error', err);
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
