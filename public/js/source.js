function SourcePeer(options) {
  // TODO: Allow passing in own ID.
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
      console.log('SINK CONNECTED');
      // TODO: not just moz.
      target = data.sink;
      var pc = new window.mozRTCPeerConnection(self._config);
      self._pcs[target] = pc;
      // Setups will create streams--then the callback sets up the offers.
      self.handleStream(pc, target, function() {
        // Firefoxisms, or just dumb?
        navigator.mozGetUserMedia({ audio: true, fake: true }, function(s) {
          pc.addStream(s);
          pc.createOffer(function(offer) {
            pc.setLocalDescription(offer, function() {
              self._socket.emit('offer',
                  { 'sdp': offer,
                    'sink': target,
                    'source': self._id });
            }, function(err) {
              console.log('failed to setLocalDescription, ', err);
            });
          });
        }, function(err) { console.log('crap'); });
      });
    });

    self._socket.on('answer', function(data) {
      self._pcs[data.sink].setRemoteDescription(data.sdp, function() {
        // Firefoxism
        console.log('FIREFOX', new Date());
        self._pcs[data.sink].connectDataConnection(5000, 5001);
        console.log('FIREFOX-2');
        console.log('SOURCE: PeerConnection success');
      }, function(err) {
        console.log('failed to setRemoteDescription, ', err)
      });
    });
  });
};

// Based on stream type requested, sets up the stream for PC.
SourcePeer.prototype.handleStream = function(pc, target, cb) {
  pc.onaddstream = function(obj) {
    console.log('SOURCE: data stream get');
  };
  /*if (this._streams === 'v') {
  } else if (this._streams === 'a') {
  } else if (this._streams === 'av') {
  } else if (this._streams === 'd') {*/
    this.setupDataChannel(pc, target, cb);
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

SourcePeer.prototype.setupDataChannel = function(pc, target, cb) {
  self = this;
  pc.onconnection = function() {
    console.log('SOURCE: onconnection triggered.');
    var dc = pc.createDataChannel(self._name, {}, target);
    self._dcs[target] = dc;
    dc.binaryType = 'blob';
    dc.onmessage = function(e) {
      self.handleDataMessage(dc, e);
      // process e.data
    };
  };

  pc.ondatachannel = function() {
    console.log('SOURCE: data channeled');
  };

  pc.onclosedconnection = function() {
    // ??
  };
  cb();
};

// Handles a Datachannel message.
SourcePeer.prototype.handleDataMessage = function(dc, e) {
  console.log(e.data);

}

SourcePeer.prototype.on = function(code, cb) {
  // For enduser.
};

