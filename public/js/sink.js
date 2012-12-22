function SinkPeer(options, readyfn) {
  this._config = options.config || {};
  this._name = options.name || 'StreamAPI';
  this._pc = null;
  this._id = null;
  this._dc = null;
  this._socket = io.connect('http://localhost');
  this.socketInit(readyfn);
};

SinkPeer.prototype.socketInit = function(cb) {
  self = this;
  this._socket.emit('sink', function(data) {
    self._id = data.id;
    self._pc = new mozRTCPeerConnection(self._config);
    self._socket.on('offer', function(data) {
      self._pc.setRemoteDescription(data.sdp, function() {
        self._pc.createAnswer(function(answer) {
          self._pc.setLocalDescription(answer, function() {
            self._socket.emit('answer', { 'sdp': answer, 'source': data.source });
          });
        });
      });
    });
    cb(self._id);
  });
});
