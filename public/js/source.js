function SourcePeer(options) {
  this._config = options.config || {};
  this._streams = options.streamType || 'd';
  this._name = options.name || 'StreamAPI';
  // PeerConnections open for this source. Client name => PC.
  this._pcs = {};
  this._id = null;
  // Same for DCs.
  this._dcs = {};
  this._socket = io.connect('http://localhost');
  this.socketInit();
};

SourcePeer.prototype.socketInit = function() {
  self = this;
  this._socket.emit('source', function(data) {
    self._id = data.id;

    self._socket.on('sink-connected', function(data) {
      // TODO: not just moz.
      target = data.sink;
      var pc = new mozRTCPeerConnection(self._config);
      self._pcs[target] = pc;

      // Setups will create streams--then the callback sets up the offers.
      self.handleStream(pc, target, function() {
        pc.createOffer(function(offer) {
          pc.setLocalDescription(offer);
          self._socket.emit('offer',
              { 'sdp': offer, 'sink': target, 'source': this._id });
        });
      });
    });

    self._socket.on('answer', function(data, fn) {
      self._pcs[data.sink].setRemoteDescription(data.sdp);
      fn();
      // Firefoxism
      self._pcs[data.sink].connectDataConnection(5000,5001);
    });
  });
};

// Based on stream type requested, sets up the stream for PC.
SourcePeer.prototype.handleStream(pc, target, cb) {
  /*if (this._streams === 'v') {
  } else if (this._streams === 'a') {
  } else if (this._streams === 'av') {
  } else if (this._streams === 'd') {*/
    this.setupDataChannel(pc, target);
  /*} else if (this._streams === 'dav') {
    this.setupDataChannel(pc, target);
  } else if (this._streams === 'da') {
    this.setupDataChannel(pc, target);
  } else if (this._streams === 'dv') {
    this.setupDataChannel(pc, target);
  } else {
    //error
  }*/
};

SourcePeer.prototype.setupDataChannel = function(pc, target) {
  pc.onconnection = function() {
    var dc = pc.createDataChannel(this._name, {}, target);
    this._dc[target] = dc;
    dc.binaryType = 'blob';
    dc.onmessage = function(e) {
      this.handleDataMessage(pc, e);
      // process e.data
    };
  };

  pc.onclosedconnection = function() {
    // ??
  };
};

SourcePeer.prototype.on = function(code, cb) {
  // For enduser.
};

SourcePeer.prototype.gotDescription = function(desc) {
  this._pc
};
