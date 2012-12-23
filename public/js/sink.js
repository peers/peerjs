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
    self._pc = new mozRTCPeerConnection(self._config);

    this.setupDataChannel();

    self._socket.on('offer', function(data) {
      self._pc.setRemoteDescription(data.sdp, function() {
        self._pc.createAnswer(function(answer) {
          self._pc.setLocalDescription(answer, function() {
            self._socket.emit('answer',
                { 'sink' = this._id,'sdp': answer, 'source': data.source });
            // Firefoxism
            self._pc.connectDataConnection(5001,5000);
          });
        });
      });
    });
    cb(self._id);
  });
});

SinkPeer.prototype.setupDataChannel = function() {
  this._pc.ondatachannel = function(dc) {
    dc.binaryType = "blob";
    dc.onmessage = function(e) {

    };
    this._dc = dc;
  };

  this._pc.onclosedconnection = function() {
    // ??
  };
};
