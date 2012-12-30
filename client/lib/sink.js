function SinkPeer(options) {
  this._config = options.config || { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }]};
  this._peer = options.source || null;
  this._video = options.video;
  this._data = options.data != undefined ? options.data : true;
  this._audio = options.audio;
  this._pc = null;
  this._id = null;
  this._dc = null;
  this._socket = new WebSocket(options.ws || 'ws://localhost');
  var self = this;
  this._socket.onopen = function() {
    self.socketInit();
  };
  this._handlers = {};

  // Testing firefox.
  // MULTICONNECTION doesn't work still.
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


function randomPort() {
  return Math.round(Math.random() * 60535) + 5000;
};


/** Start up websocket communications. */
SinkPeer.prototype.socketInit = function() {
  var self = this;
  // Multiple sinks to one source.
  if (!!this._peer) {
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
            console.log('Firefox');
          }
          self._pc.setRemoteDescription(sdp, function() {

            // If we also have to set up a stream on the sink end, do so.
            self.handleStream(false, function() {
              self.maybeBrowserisms(false);
            });
          }, function(err) {
            console.log('failed to setRemoteDescription with offer, ', err);
          });
          break;
        case 'CANDIDATE':
          var candidate = new RTCIceCandidate({ sdpMLineIndex: message.label,
                                                candidate: message.candidate });
          self._pc.addIceCandidate(candidate);
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
          console.log('SINK: unrecognized message ', message.type);
          break;
      }
    };

  } else {
    // Otherwise, this sink is the originator to another sink and should wait
    // for an alert.
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
            console.log('Firefox');
          }
          self._pc.setRemoteDescription(sdp, function() {
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
            console.log('ORIGINATOR: PeerConnection success');
          }, function(err) {
            console.log('failed to setRemoteDescription, ', err);
          });
          break;
        case 'CANDIDATE':
          var candidate = new RTCIceCandidate({ sdpMLineIndex: message.label,
                                                candidate: message.candidate });
          self._pc.addIceCandidate(candidate);
          break;
        case 'DEFAULT':
          console.log('ORIGINATOR: message not recognized ', message.type);
      }
    };
  }
  // Makes sure things clean up neatly.
  window.onbeforeunload = function() {
    if (!!this._socket) {
      this._socket.send(JSON.stringify({ type: 'LEAVE' }));
    }
  }
};


/** Takes care of ice handlers. */
SinkPeer.prototype.setupIce = function() {
  this._pc.onicecandidate = function(event) {
    if (event.candidate) {
      this._socket.send(JSON.stringify({
        type: 'CANDIDATE',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      }));
    } else {
      console.log("End of candidates.");
    }
  };
};


/** Starts a PeerConnection and sets up handlers. */
SinkPeer.prototype.startPeerConnection = function() {
  this._pc = new RTCPeerConnection(this._config);
  this.setupIce();
  this.setupAudioVideo();
};


/** Decide whether to handle Firefoxisms. */
SinkPeer.prototype.maybeBrowserisms = function(originator) {
  var self = this;
  if (browserisms == 'Firefox' && !this._video && !this._audio && !this._stream) {
    getUserMedia({ audio: true, fake: true }, function(s) {
      self._pc.addStream(s);

      if (originator) {
        self.makeOffer();
      } else {
        self.makeAnswer();
      }

    }, function(err) { console.log('crap'); });
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
    self._pc.setLocalDescription(answer, function() {
      self._socket.send(JSON.stringify({
        type: 'ANSWER',
        src: self._id,
        sdp: answer,
        dst: self._peer
      }));
    }, function(err) {
      console.log('failed to setLocalDescription, ', err)
    });
  }, function(err) {
    console.log('failed to create answer, ', err)
  });
};


/** Create an offer for PC. */
SinkPeer.prototype.makeOffer = function() {
  var self = this;

  this._pc.createOffer(function(offer) {
    self._pc.setLocalDescription(offer, function() {
      self._socket.send(JSON.stringify({
        type: 'OFFER',
        sdp: offer,
        dst: self._peer,
        src: self._id
      }));
    }, function(err) {
      console.log('failed to setLocalDescription, ', err);
    });
  });
};


/** Sets up A/V stream handler. */
SinkPeer.prototype.setupAudioVideo = function() {
  var self = this;
  this._pc.onaddstream = function(obj) {
    this._stream = true;
    if (!!self._handlers['remotestream']) {
      self._handlers['remotestream'](obj.type, obj.stream);
    }
  };
};


/** Handle the different types of streams requested by user. */
SinkPeer.prototype.handleStream = function(originator, cb) {
  if (this._data) {
    this.setupDataChannel(originator);
  } else {
    cb();
  }
  this.getAudioVideo(originator, cb);
};


/** Get A/V streams. */
SinkPeer.prototype.getAudioVideo = function(originator, cb) {
  var self = this;
  if (this._video) {
    getUserMedia({ video: true }, function(vstream) {
      self._pc.addStream(vstream);

      if (originator && !!self._handlers['localstream']) {
        self._handlers['localstream']('video', vstream);
      } else if (!originator && !self._handlers['remotestream']) {
        self._handlers['remotestream']('video', vstream);
      }

      if (self._audio) {
        getUserMedia({ audio: true }, function(astream) {
          self._pc.addStream(astream);

          if (originator && !!self._handlers['localstream']) {
            self._handlers['localstream']('audio', astream);
          } else if (!originator && !self._handlers['remotestream']) {
            self._handlers['remotestream']('audio', astream);
          }

          cb();
        }, function(err) { console.log('Audio cannot start'); });
      } else {
        cb();
      }
    }, function(err) { console.log('Video cannot start'); });
  } else if (this._audio) {
    getUserMedia({ audio: true }, function(astream) {
      self._pc.addStream(astream);

      if (!!self._handlers['localstream']) {
        self._handlers['localstream']('audio', astream);
      } else if (!originator && !self.handlers['remotestream']) {
        self.handlers['remotestream']('audio', astream);
      }

      cb();
    }, function(err) { console.log('Audio cannot start'); });
  } else {
    cb();
  }

};


/** Sets up DataChannel handlers. */
SinkPeer.prototype.setupDataChannel = function(originator, cb) {
  var self = this;
  if (browserisms != 'Webkit') {
    if (originator) {
      /** ORIGINATOR SETUP */
      this._pc.onconnection = function() {
        console.log('ORIGINATOR: onconnection triggered');

        self._dc = self._pc.createDataChannel('StreamAPI', {}, self._peer);
        self._dc.binaryType = 'blob';

        if (!!self._handlers['connection']) {
          self._handlers['connection'](self._peer);
        }

        self._dc.onmessage = function(e) {
          self.handleDataMessage(e);
        };
      };
    } else {
      /** TARGET SETUP */
      this._pc.ondatachannel = function(dc) {
        console.log('SINK: ondatachannel triggered');
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
        console.log('SINK: onconnection triggered');
      };
    }
  }

  this._pc.onclosedconnection = function() {
    // Remove socket handlers perhaps.
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
