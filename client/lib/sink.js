function SinkPeer(options) {
  var options = options || {};

  debug = options.debug;
  this._config = options.config || { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] };
  this._id = null;
  // User handlers.
  this._handlers = {};

  // Source to connect to; null if waiting for a connection.
  this._peer = options.source || null;

  // Booleans to determine what streams to allow.
  this._video = options.video;
  this._data = options.data != undefined ? options.data : true;
  this._audio = options.audio;

  // Connections
  this._pc = null;
  this._dc = null;
  this._socket = new WebSocket(options.ws || 'ws://localhost');

  // Local streams for multiple use.
  this._localVideo = options.localVideo || null;
  this._localAudio = options.localAudio || null;

  // Init socket msg handlers
  var self = this;
  this._socket.onopen = function() {
    self.socketInit();
  };

  // Firefoxism: connectDataConnection ports.
  if (browserisms == 'Firefox' && !options.source) {
    if (!SinkPeer.usedPorts) {
      SinkPeer.usedPorts = [];
    }
    this.localPort = randomPort();
    while (SinkPeer.usedPorts.indexOf(this.localPort) != -1) {
      this.localPort = randomPort();
    }
    this.remotePort = randomPort();
    while (this.remotePort == this.localPort ||
        SinkPeer.usedPorts.indexOf(this.localPort) != -1) {
      this.remotePort = randomPort();
    }
    SinkPeer.usedPorts.push(this.remotePort);
    SinkPeer.usedPorts.push(this.localPort);
  }

};


/** Generates random port number. */
function randomPort() {
  return Math.round(Math.random() * 60535) + 5000;
};


/** Start up websocket communications. */
SinkPeer.prototype.socketInit = function() {
  var self = this;
  if (!!this._peer) {
    // Announce as a sink if initiated with a source.
    this._socket.send(JSON.stringify({
      type: 'SINK',
      source: this._peer,
      isms: browserisms
    }));

    this._socket.onmessage = function(event) {
      var message = JSON.parse(event.data);

      switch (message.type) {
        case 'SINK-ID':
          self._id = message.id;
          if (!!self._handlers['ready']) {
            self._handlers['ready'](self._id);
          }
          self.startPeerConnection();
          break;
        case 'OFFER':
          var sdp = message.sdp;
          try {
            sdp = new RTCSessionDescription(message.sdp);
          } catch(e) {
            log('Firefox');
          }
          self._pc.setRemoteDescription(sdp, function() {
            log('setRemoteDescription: offer');

            // If we also have to set up a stream on the sink end, do so.
            self.handleStream(false, function() {
              self.maybeBrowserisms(false);
            });
          }, function(err) {
            log('failed to setRemoteDescription with offer, ', err);
          });
          break;
        case 'CANDIDATE':
          log(message.candidate);
          var candidate = new RTCIceCandidate(message.candidate);
          self._pc.addIceCandidate(candidate);
          break;
        case 'LEAVE':
          log('counterpart disconnected');
          if (!!self._pc && self._pc.readyState != 'closed') {
            self._pc.close();
            self._pc = null;
            self._peer = null;
          }
          if (!!self._dc && self._dc.readyState != 'closed') {
            self._dc.close();
            self._dc = null;
          }
          break;
        case 'PORT':
          if (browserisms && browserisms == 'Firefox') {
            if (!SinkPeer.usedPorts) {
              SinkPeer.usedPorts = [];
            }
            SinkPeer.usedPorts.push(message.local);
            SinkPeer.usedPorts.push(message.remote);
            self._pc.connectDataConnection(message.local, message.remote);
            break;
          }
        case 'DEFAULT':
          log('SINK: unrecognized message ', message.type);
          break;
      }
    };

  } else {
    // Otherwise, this sink is the originator to another sink and should wait
    // for an alert to begin the PC process.
    this._socket.send(JSON.stringify({
      type: 'SOURCE',
      isms: browserisms
    }));

    this._socket.onmessage = function(event) {
      var message = JSON.parse(event.data);

      switch (message.type) {
        case 'SOURCE-ID':
          self._id = message.id;
          if (!!self._handlers['ready']) {
            self._handlers['ready'](self._id);
          }
          break;
        case 'SINK-CONNECTED':
          self._peer = message.sink;
          self.startPeerConnection();
          self.handleStream(true, function() {
            self.maybeBrowserisms(true);
          });
          break;
        case 'ANSWER':
          var sdp = message.sdp;
          try {
            sdp = new RTCSessionDescription(message.sdp);
          } catch(e) {
            log('Firefox');
          }
          self._pc.setRemoteDescription(sdp, function() {
            log('setRemoteDescription: answer');
            // Firefoxism
            if (browserisms == 'Firefox') {
              self._pc.connectDataConnection(self.localPort, self.remotePort);
              self._socket.send(JSON.stringify({
                type: 'PORT',
                dst: self._peer,
                remote: self.localPort,
                local: self.remotePort
              }));
            }
            log('ORIGINATOR: PeerConnection success');
          }, function(err) {
            log('failed to setRemoteDescription, ', err);
          });
          break;
        case 'CANDIDATE':
          log(message.candidate);
          var candidate = new RTCIceCandidate(message.candidate);
          self._pc.addIceCandidate(candidate);
          break;
        case 'LEAVE':
          log('counterpart disconnected');
          if (!!self._pc && self._pc.readyState != 'closed') {
            self._pc.close();
            self._pc = null;
            self._peer = null;
          }
          if (!!self._dc && self._dc.readyState != 'closed') {
            self._dc.close();
            self._dc = null;
          }
          break;
        case 'DEFAULT':
          log('ORIGINATOR: message not recognized ', message.type);
      }
    };
  }

  // Makes sure things clean up neatly when window is closed.
  window.onbeforeunload = function() {
    if (!!self._pc && self._pc.readyState != 'closed') {
      self._pc.close();
    }
    if (!!self._socket && !!self._peer) {
      self._socket.send(JSON.stringify({ type: 'LEAVE', dst: self._peer }));
      if (!!self._dc && self._dc.readyState != 'closed') {
        self._dc.close();
      }
    }
  }
};


/** Takes care of ice handlers. */
SinkPeer.prototype.setupIce = function() {
  var self = this;
  this._pc.onicecandidate = function(event) {
    log('candidates received');
    if (event.candidate) {
      self._socket.send(JSON.stringify({
        type: 'CANDIDATE',
        candidate: event.candidate,
        dst: self._peer
      }));
    } else {
      log("End of candidates.");
    }
  };
};


/** Starts a PeerConnection and sets up handlers. */
SinkPeer.prototype.startPeerConnection = function() {
  this._pc = new RTCPeerConnection(this._config, { optional:[ { RtpDataChannels: true } ]});
  this.setupIce();
  this.setupAudioVideo();
};


/** Decide whether to handle Firefoxisms. */
SinkPeer.prototype.maybeBrowserisms = function(originator) {
  var self = this;
  if (browserisms == 'Firefox' && !this._video && !this._audio/* && !this._stream*/) {
    getUserMedia({ audio: true, fake: true }, function(s) {
      self._pc.addStream(s);

      if (originator) {
        self.makeOffer();
      } else {
        self.makeAnswer();
      }

    }, function(err) { log('crap'); });
  } else {
    if (originator) {
      this.makeOffer();
    } else {
      this.makeAnswer();
    }
  }
}


/** Create an answer for PC. */
SinkPeer.prototype.makeAnswer = function() {
  var self = this;

  this._pc.createAnswer(function(answer) {
    log('createAnswer');
    self._pc.setLocalDescription(answer, function() {
      log('setLocalDescription: answer');
      self._socket.send(JSON.stringify({
        type: 'ANSWER',
        src: self._id,
        sdp: answer,
        dst: self._peer
      }));
    }, function(err) {
      log('failed to setLocalDescription, ', err)
    });
  }, function(err) {
    log('failed to create answer, ', err)
  });
};


/** Create an offer for PC. */
SinkPeer.prototype.makeOffer = function() {
  var self = this;

  this._pc.createOffer(function(offer) {
    log('createOffer')
    self._pc.setLocalDescription(offer, function() {
      log('setLocalDescription: offer');
      self._socket.send(JSON.stringify({
        type: 'OFFER',
        sdp: offer,
        dst: self._peer,
        src: self._id
      }));
    }, function(err) {
      log('failed to setLocalDescription, ', err);
    });
  });
};


/** Sets up A/V stream handler. */
SinkPeer.prototype.setupAudioVideo = function() {
  var self = this;
  log('onaddstream handler added');
  this._pc.onaddstream = function(obj) {
    log('Remote stream added');
    //this._stream = true;
    if (!!self._handlers['remotestream']) {
      self._handlers['remotestream'](obj.type, obj.stream);
    }
  };
};


/** Handle the different types of streams requested by user. */
SinkPeer.prototype.handleStream = function(originator, cb) {
  if (this._data) {
    this.setupDataChannel(originator);
  }
  this.getAudioVideo(originator, cb);
};


/** Get A/V streams. */
SinkPeer.prototype.getAudioVideo = function(originator, cb) {
  var self = this;
  if (this._video && !this._localVideo) {
    getUserMedia({ video: true }, function(vstream) {
      self._pc.addStream(vstream);
      self._localVideo = vstream;
      log('Local video stream added');

      if (!!self._handlers['localstream']) {
        self._handlers['localstream']('video', vstream);
      }

      if (self._audio && !self._localAudio) {
        getUserMedia({ audio: true }, function(astream) {
          self._pc.addStream(astream);
          self._localAudio = astream;
          log('Local audio stream added');

          if (!!self._handlers['localstream']) {
            self._handlers['localstream']('audio', astream);
          }

          cb();
        }, function(err) { log('Audio cannot start'); cb(); });
      } else {
        if (self._audio) {
          self._pc.addStream(self._localAudio);
        }
        cb();
      }
    }, function(err) { log('Video cannot start', err); cb(); });
  } else if (this._audio && !this._localAudio) {
    getUserMedia({ audio: true }, function(astream) {
      self._pc.addStream(astream);
      self._localAudio = astream;
      log('Local audio stream added');

      if (!!self._handlers['localstream']) {
        self._handlers['localstream']('audio', astream);
      }

      cb();
    }, function(err) { log('Audio cannot start'); cb(); });
  } else {
    if (this._audio) {
      this._pc.addStream(this._localAudio);
    }
    if (this._video) {
      this._pc.addStream(this._localVideo);
    }
    log('no audio/video streams initiated');
    cb();
  }

};


/** Sets up DataChannel handlers. */
SinkPeer.prototype.setupDataChannel = function(originator, cb) {
  var self = this;
  if (originator) {
    /** ORIGINATOR SETUP */
    if (browserisms == 'Webkit') {

      this._pc.onstatechange = function() {
        log('State Change: ', self._pc.readyState);
        /*if (self._pc.readyState == 'active') {
          log('ORIGINATOR: active state detected');

          self._dc = self._pc.createDataChannel('StreamAPI', { reliable: false });
          self._dc.binaryType = 'blob';

          if (!!self._handlers['connection']) {
            self._handlers['connection'](self._peer);
          }

          self._dc.onmessage = function(e) {
            self.handleDataMessage(e);
          };
        }*/
      }

    } else {
      this._pc.onconnection = function() {
        log('ORIGINATOR: onconnection triggered');

        self.startDataChannel();
      };
    }
  } else {
    /** TARGET SETUP */
    this._pc.ondatachannel = function(dc) {
      log('SINK: ondatachannel triggered');
      self._dc = dc;
      self._dc.binaryType = 'blob';

      if (!!self._handlers['connection']) {
        self._handlers['connection'](self._peer);
      }

      self._dc.onmessage = function(e) {
        self.handleDataMessage(e);
      };
    };

    this._pc.onconnection = function() {
      log('SINK: onconnection triggered');
    };
  }


  this._pc.onclosedconnection = function() {
    // Remove socket handlers perhaps.
  };
};


SinkPeer.prototype.startDataChannel = function() {
  var self = this;
  this._dc = this._pc.createDataChannel(this._peer, { reliable: false });
  this._dc.binaryType = 'blob';

  if (!!this._handlers['connection']) {
    this._handlers['connection'](this._peer);
  }

  this._dc.onmessage = function(e) {
    self.handleDataMessage(e);
  };
};


/** Allows user to send data. */
SinkPeer.prototype.send = function(data) {
  var ab = BinaryPack.pack(data);
  this._dc.send(ab);
}


// Handles a DataChannel message.
// TODO: have these extend Peer, which will impl these generic handlers.
SinkPeer.prototype.handleDataMessage = function(e) {
  var self = this;
  var fr = new FileReader();
  fr.onload = function(evt) {
    var ab = evt.target.result;
    var data = BinaryPack.unpack(ab);
    if (!!self._handlers['data']) {
      self._handlers['data'](data);
    }
  };
  fr.readAsArrayBuffer(e.data);
}


SinkPeer.prototype.on = function(code, cb) {
  this._handlers[code] = cb;
}

function log() {
  if (debug) {
    for (var i = 0; i < arguments.length; i++) {
      console.log('*', i, '-- ', arguments[i]);
    }
  }
}

exports.Peer = SinkPeer;
