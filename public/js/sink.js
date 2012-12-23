function SinkPeer(options, readyfn) {
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
  this._socket.emit('sink', { source: this._source }, function(data) {
    self._id = data.id;
    self._pc = new window.mozRTCPeerConnection(self._config);

    //FIREFOX
    self._pc.onaddstream = function(obj) {
      console.log('SINK: data stream get');
    };

    self.setupDataChannel();

    self._socket.on('offer', function(offer) {
      self._pc.setRemoteDescription(offer.sdp, function() {

        //Firefox
        navigator.mozGetUserMedia({ audio: true, fake: true }, function(s) {
          self._pc.addStream(s);

          self._pc.createAnswer(function(answer) {
            self._pc.setLocalDescription(answer, function() {
              self._socket.emit('answer',
                  { 'sink': self._id,
                    'sdp': answer,
                    'source': offer.source });
              // Firefoxism
              console.log('FIREFOX');
              self._pc.connectDataConnection(5001, 5000);
              console.log('FIREFOX-2');
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
  this._pc.ondatachannel = function(dc) {
    console.log('SINK: ondatachannel triggered');
    dc.binaryType = "blob";
    dc.onmessage = function(e) {
      console.log(e.data);
    };
    self._dc = dc;
  };

  this._pc.onconnection = function() {
    console.log('SINK: onconnection triggered');
  }

  this._pc.onclosedconnection = function() {
    // ??
  };
};
