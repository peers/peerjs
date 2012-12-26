function SinkPeer(options) {
  this._config = options.config || {};
  this._source = options.source || null;
  this._video = options.video;
  this._data = options.data != undefined ? options.data : true;
  this._audio = options.audio;
  this._pc = null;
  this._id = null;
  this._dc = null;
  this._socket = io.connect('http://localhost');
  this.socketInit();
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


SinkPeer.prototype.socketInit = function() {
  var self = this;
  // Multiple sinks to one source.
  if (!!this._source) {
    this._socket.emit('sink', { source: this._source, isms: browserisms },
        function(data) {
      self._id = data.id;
      self._pc = new RTCPeerConnection(self._config);

      //FIREFOX
      self._pc.onaddstream = function(obj) {
        console.log('SINK: data stream get');
      };

      self.setupAudioVideo();

      self._socket.on('offer', function(offer) {
        self._pc.setRemoteDescription(offer.sdp, function() {

          // If we also have to set up a stream on the sink end, do so.
          self.handleStream(false, offer.source, function() {
            self.maybeBrowserisms(false, offer.source);
          });
        }, function(err) {
          console.log('failed to setRemoteDescription with offer, ', err);
        });
      });
    });
  } else {
    // Otherwise, this sink is the originator to another sink and should wait
    // for an alert.
    this._socket.emit('source', function(data) {
      self._id = data.id;

      if (!!self._handlers['ready']) {
        self._handlers['ready'](self._id);
      }

      self._socket.on('sink-connected', function(data) {
        target = data.sink;
        self._pc = new RTCPeerConnection(self._config);
        self.setupAudioVideo();
        self.handleStream(true, target, function() {
          self.maybeBrowserisms(true, target);
        });
      });

      self._socket.on('answer', function(data) {
        self._pc.setRemoteDescription(data.sdp, function() {
          // Firefoxism
          if (browserisms == 'Firefox') {
            self._pc.connectDataConnection(self.localPort, self.remotePort);
            //self._pc.connectDataConnection(5000, 5001);
            self._socket.emit('port', { sink: data.sink, remote: self.localPort, local: self.remotePort });
          }
          console.log('ORIGINATOR: PeerConnection success');
        }, function(err) {
          console.log('failed to setRemoteDescription, ', err);
        });
      });
    });
  }
};


SinkPeer.prototype.maybeBrowserisms = function(originator, target) {
  var self = this;
  if (browserisms == 'Firefox') {
    getUserMedia({ audio: true, fake: true }, function(s) {
      self._pc.addStream(s);

      if (originator) {
        self.makeOffer(target);
      } else {
        self.makeAnswer(target);
      }

    }, function(err) { console.log('crap'); });
  } else {
    if (originator) {
      this.makeOffer(target);
    } else {
      this.makeAnswer(target);
    }
  }
}


SinkPeer.prototype.makeAnswer = function(target) {
  var self = this;

  this._pc.createAnswer(function(answer) {
    self._pc.setLocalDescription(answer, function() {
      if (browserisms && browserisms == 'Firefox') {
        self._socket.on('port', function(data) {
          self._pc.connectDataConnection(data.local, data.remote);
        });
      }
      self._socket.emit('answer',
          { 'sink': self._id,
            'sdp': answer,
            'source': target });
      // Firefoxism
      //if (browserisms && browserisms == 'Firefox') {
        //self._pc.connectDataConnection(5001, 5000);
      //}
    }, function(err) {
      console.log('failed to setLocalDescription, ', err)
    });
  }, function(err) {
    console.log('failed to create answer, ', err)
  });
};


SinkPeer.prototype.makeOffer = function(target) {
  var self = this;

  this._pc.createOffer(function(offer) {
    self._pc.setLocalDescription(offer, function() {
      self._socket.emit('offer',
        { 'sdp': offer,
          'sink': target,
          'source': self._id });
    }, function(err) {
      console.log('failed to setLocalDescription, ', err);
    });
  });
};


SinkPeer.prototype.setupAudioVideo = function() {
  this._pc.onaddstream = function(obj) {
    if (!!self._handlers['remotestream']) {
      self._handlers['remotestream'](obj.type, obj.stream);
    }
  };
};


SinkPeer.prototype.handleStream = function(originator, target, cb) {
  if (this._data) {
    this.setupDataChannel(originator, target, cb);
  }
  this.getAudioVideo(cb);
};


SinkPeer.prototype.getAudioVideo = function(cb) {
  if (this._audio) {
    getUserMedia({ video: true }, function(stream) {
      self._pc.addStream(stream);
      cb();
    });
  }

};


SinkPeer.prototype.setupDataChannel = function(originator, target, cb) {
  var self = this;
  if (browserisms != 'Webkit') {
    if (originator) {
      /** ORIGINATOR SETUP */
      this._pc.onconnection = function() {
        console.log('ORIGINATOR: onconnection triggered');

        self._dc = self._pc.createDataChannel('StreamAPI', {}, target);
        self._dc.binaryType = 'blob';

        if (!!self._handlers['connection']) {
          self._handlers['connection'](target);
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
          self._handlers['connection'](target);
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
  cb();
};

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
