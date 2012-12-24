function SinkPeer(options, readyfn) {
  if (!browserisms) {
    readyfn({ error: 'RTC-incompatible browser' });
  }
  this._config = options.config || {};
  this._source = options.source || 'StreamAPI';
  this._pc = null;
  this._id = null;
  this._dc = null;
  this._socket = io.connect('http://localhost');
  this.socketInit(readyfn);
};


SinkPeer.prototype.socketInit = function(cb) {
  self = this;
  this._socket.emit('sink', { source: this._source, isms: browserisms },
      function(data) {
    self._id = data.id;
    self._pc = new RTCPeerConnection(self._config);

    //FIREFOX
    self._pc.onaddstream = function(obj) {
      console.log('SINK: data stream get');
    };

    self.setupDataChannel();

    self._socket.on('offer', function(offer) {
      self._pc.setRemoteDescription(offer.sdp, function() {
        //Firefox
        getUserMedia({ audio: true, fake: true }, function(s) {
          self._pc.addStream(s);

          self._pc.createAnswer(function(answer) {
            self._pc.setLocalDescription(answer, function() {
              self._socket.emit('answer',
                  { 'sink': self._id,
                    'sdp': answer,
                    'source': offer.source });
              // Firefoxism
              if (browserisms && browserisms == 'Firefox') {
                self._pc.connectDataConnection(5001, 5000);
              }
              if (cb) {
                cb({ response: 'done' });
              }
            }, function(err) {
              console.log('failed to setLocalDescription, ', err)
            });
          }, function(err) {
            console.log('failed to create answer, ', err)
          });
        }, function(err) { console.log('crap'); });
      }, function(err) {
        console.log('failed to setRemoteDescription with offer, ', err);
      });
    });
  });

};


SinkPeer.prototype.setupDataChannel = function() {
  self = this;
  if (browserisms != 'Webkit') {
    this._pc.ondatachannel = function(dc) {
      console.log('SINK: ondatachannel triggered');
      dc.binaryType = 'arraybuffer';
      dc.onmessage = function(e) {
        self.handleDataMessage(e);
      };
      self._dc = dc;
    };

    this._pc.onconnection = function() {
      console.log('SINK: onconnection triggered');
    }
  }

  this._pc.onclosedconnection = function() {
    // Remove socket handlers perhaps.
  };
};

SinkPeer.prototype.send = function(data) {
  var ab = MsgPack.encode(data);
  this._dc.send(ab);
}


// Handles a DataChannel message.
// TODO: have these extend Peer, which will impl these generic handlers.
SinkPeer.prototype.handleDataMessage = function(e) {
  data = MsgPack.decode(e.data);
  console.log(data);

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
  }
}
