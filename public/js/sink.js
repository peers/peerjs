function SinkPeer(options) {
  this._config = options.config || {};
  this._source = options.source || null;
  this._stream = options.stream || 'd';
  this._pc = null;
  this._id = null;
  this._dc = null;
  this._socket = io.connect('http://localhost');
  this.socketInit();
};


SinkPeer.prototype.socketInit = function() {
  self = this;
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

      if (!!self._readyHandler) {
        self._readyHandler(self._id);
      }

      self._socket.on('sink-connected', function(data) {
        target = data.sink;
        self._pc = new RTCPeerConnection(self._config);
        self.handleStream(true, target, function() {
          self.maybeBrowserisms(true, target);
        });
      });

      self._socket.on('answer', function(data) {
        self._pc.setRemoteDescription(data.sdp, function() {
          // Firefoxism
          if (browserisms == 'Firefox') {
            self._pc.connectDataConnection(5000, 5001);
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
      self._socket.emit('answer',
          { 'sink': self._id,
            'sdp': answer,
            'source': target });
      // Firefoxism
      if (browserisms && browserisms == 'Firefox') {
        self._pc.connectDataConnection(5001, 5000);
      }
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


SinkPeer.prototype.handleStream = function(originator, target, cb) {
  this.setupDataChannel(originator, target, cb);
}


SinkPeer.prototype.setupDataChannel = function(originator, target, cb) {
  self = this;
  if (browserisms != 'Webkit') {
    if (originator) {
      /** ORIGINATOR SETUP */
      this._pc.onconnection = function() {
        console.log('ORIGINATOR: onconnection triggered');

        self._dc = self._pc.createDataChannel('StreamAPI', {}, target);
        self._dc.binaryType = 'arraybuffer';

        if (!!self._connectionHandler) {
          self._connectionHandler(target);
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
        self._dc.binaryType = 'arraybuffer';

        if (!!self._connectionHandler) {
          self._connectionHandler(target);
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
  data = BinaryPack.unpack(e.data);

  if (!!this._dataHandler) {
    this._dataHandler(data);
  }
}


SinkPeer.prototype.on = function(code, cb) {
  if (code === 'stream') {
    this._streamHandler = cb;
  } else if (code === 'disconnect') {
    this._disconnectHandler = cb;
  } else if (code === 'data') {
    this._dataHandler = cb;
  } else if (code === 'ready') {
    this._readyHandler = cb;
  } else if (code === 'connection') {
    this._connectionHandler = cb;
  }
}
