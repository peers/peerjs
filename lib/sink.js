function Peer(options) {
  if (!(this instanceof Peer)) return new Peer(options);
  
  EventEmitter.call(this);
  
  this._config = options.config || { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] };
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
  

  // Testing firefox.
  // MULTICONNECTION doesn't work still.
  if (browserisms == 'Firefox' && !options.source) {
    if (!Peer.usedPorts) {
      Peer.usedPorts = [];
    }
    this.localPort = util.randomPort();
    while (Peer.usedPorts.indexOf(this.localPort) != -1) {
      this.localPort = util.randomPort();
    }
    this.remotePort = util.randomPort();
    while (this.remotePort == this.localPort ||
        Peer.usedPorts.indexOf(this.localPort) != -1) {
      this.remotePort = util.randomPort();
    }
    Peer.usedPorts.push(this.remotePort);
    Peer.usedPorts.push(this.localPort);
  }

};

util.inherits(Peer, EventEmitter);

/** Start up websocket communications. */
Peer.prototype.socketInit = function() {
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
          self.emit('ready', self._id);          
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
            console.log('setRemoteDescription: offer');

            // If we also have to set up a stream on the sink end, do so.
            self.handleStream(false, function() {
              self.maybeBrowserisms(false);
            });
          }, function(err) {
            console.log('failed to setRemoteDescription with offer, ', err);
          });
          break;
        case 'CANDIDATE':
          console.log(message.candidate);
          var candidate = new RTCIceCandidate(message.candidate);
          self._pc.addIceCandidate(candidate);
          break;
        case 'PORT':
          if (browserisms && browserisms == 'Firefox') {
            if (!Peer.usedPorts) {
              Peer.usedPorts = [];
            }
            Peer.usedPorts.push(message.local);
            Peer.usedPorts.push(message.remote);
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
          self.emit('ready', self._id);
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
            console.log('setRemoteDescription: answer');
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
          console.log(message.candidate);
          var candidate = new RTCIceCandidate(message.candidate);
          self._pc.addIceCandidate(candidate);
          break;
        case 'DEFAULT':
          console.log('ORIGINATOR: message not recognized ', message.type);
      }
    };
  }
  // Makes sure things clean up neatly.
  window.onbeforeunload = function() {
    if (!!self._pc) {
      self._pc.close();
    }
    if (!!self._socket && !!self._peer) {
      self._socket.send(JSON.stringify({ type: 'LEAVE', dst: self._peer }));
      if (!!self._dc) {
        self._dc.close();
      }
    }
  }
};


/** Takes care of ice handlers. */
Peer.prototype.setupIce = function() {
  var self = this;
  this._pc.onicecandidate = function(event) {
    console.log('candidates received');
    if (event.candidate) {
      self._socket.send(JSON.stringify({
        type: 'CANDIDATE',
        candidate: event.candidate,
        dst: self._peer
      }));
    } else {
      console.log("End of candidates.");
    }
  };
};


/** Starts a PeerConnection and sets up handlers. */
Peer.prototype.startPeerConnection = function() {
  this._pc = new RTCPeerConnection(this._config, { optional:[ { RtpDataChannels: true } ]});
  this.setupIce();
  this.setupAudioVideo();
};


/** Decide whether to handle Firefoxisms. */
Peer.prototype.maybeBrowserisms = function(originator) {
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
Peer.prototype.makeAnswer = function() {
  var self = this;

  this._pc.createAnswer(function(answer) {
    console.log('createAnswer');
    self._pc.setLocalDescription(answer, function() {
      console.log('setLocalDescription: answer');
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
Peer.prototype.makeOffer = function() {
  var self = this;

  this._pc.createOffer(function(offer) {
    console.log('createOffer')
    self._pc.setLocalDescription(offer, function() {
      console.log('setLocalDescription: offer');
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
Peer.prototype.setupAudioVideo = function() {
  var self = this;
  console.log('onaddstream handler added');
  this._pc.onaddstream = function(obj) {
    console.log('Remote stream added');
    this._stream = true;
    self.emit('remotestream', obj.type, obj.stream);
  };
};


/** Handle the different types of streams requested by user. */
Peer.prototype.handleStream = function(originator, cb) {
  if (this._data) {
    this.setupDataChannel(originator);
  }
  this.getAudioVideo(originator, cb);
};


/** Get A/V streams. */
Peer.prototype.getAudioVideo = function(originator, cb) {
  var self = this;
  if (this._video) {
    getUserMedia({ video: true }, function(vstream) {
      self._pc.addStream(vstream);
      console.log('Local video stream added');

      self.emit('localstream', 'video', vstream);
      
      if (self._audio) {
        getUserMedia({ audio: true }, function(astream) {
          self._pc.addStream(astream);
          console.log('Local audio stream added');

          self.emit('localstream', 'audio', astream);

          cb();
        }, function(err) { console.log('Audio cannot start'); cb(); });
      } else {
        cb();
      }
    }, function(err) { console.log('Video cannot start', err); cb(); });
  } else if (this._audio) {
    getUserMedia({ audio: true }, function(astream) {
      self._pc.addStream(astream);

      self.emit('localstream', 'audio', astream);
      
      cb();
    }, function(err) { console.log('Audio cannot start'); cb(); });
  } else {
    cb();
  }

};


/** Sets up DataChannel handlers. */
Peer.prototype.setupDataChannel = function(originator, cb) {
  var self = this;
  if (originator) {
    /** ORIGINATOR SETUP */
    if (browserisms == 'Webkit') {

      this._pc.onstatechange = function() {
        console.log('State Change: ', self._pc.readyState);
        /*if (self._pc.readyState == 'active') {
          console.log('ORIGINATOR: active state detected');

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
        console.log('ORIGINATOR: onconnection triggered');

        self.startDataChannel();
      };
    }
  } else {
    /** TARGET SETUP */
    this._pc.ondatachannel = function(dc) {
      console.log('SINK: ondatachannel triggered');
      self._dc = dc;
      self._dc.binaryType = 'blob';

      self.emit('connection', self._peer);
      
      self._dc.onmessage = function(e) {
        self.handleDataMessage(e);
      };
    };

    this._pc.onconnection = function() {
      console.log('SINK: onconnection triggered');
    };
  }


  this._pc.onclosedconnection = function() {
    // Remove socket handlers perhaps.
  };
};


Peer.prototype.startDataChannel = function() {
  var self = this;
  this._dc = this._pc.createDataChannel(this._peer, { reliable: false });
  this._dc.binaryType = 'blob';

  this.emit('connection', this._peer);
  
  this._dc.onmessage = function(e) {
    self.handleDataMessage(e);
  };
};


/** Allows user to send data. */
Peer.prototype.send = function(data) {
  var ab = BinaryPack.pack(data);
  this._dc.send(ab);
}


// Handles a DataChannel message.
// TODO: have these extend Peer, which will impl these generic handlers.
Peer.prototype.handleDataMessage = function(e) {
  var self = this;
  var fr = new FileReader();
  fr.onload = function(evt) {
    var ab = evt.target.result;
    var data = BinaryPack.unpack(ab);
    
    self.emit('data', data);
    
  };
  fr.readAsArrayBuffer(e.data);
}

exports.Peer = Peer;
