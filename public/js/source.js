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
  this._handlers = {};

  // Firefox
  if (browserisms == 'Firefox') {
    if (!SourcePeer.usedPorts) {
      SourcePeer.usedPorts = [];
    }
    this.localPort = randomPort();
    while (SourcePeer.usedPorts.indexOf(this.localPort) != -1) {
      this.localPort = randomPort();
    }
    this.remotePort = randomPort();
    while (this.remotePort == this.localPort ||
        SourcePeer.usedPorts.indexOf(this.remotePort) != -1) {
      this.remotePort = randomPort();
    }
    SourcePeer.usedPorts.push(this.remotePort);
    SourcePeer.usedPorts.push(this.localPort);
  }
};

function randomPort() {
  return Math.round(Math.random() * 60535) + 5000;
};


SourcePeer.prototype.socketInit = function() {
  var self = this;
  this._socket.emit('source', function(data) {
    self._id = data.id;

    if (!!self._handlers['ready']) {
      self._handlers['ready'](self._id);
    }

    self._socket.on('sink-connected', function(data) {
      target = data.sink;
      var pc = new RTCPeerConnection(self._config);
      self._pcs[target] = pc;
      self.handleStream(pc, target, function(pc, target) {
        self.maybeBrowserisms(pc, target);
      });
    });

    self._socket.on('answer', function(data) {
      self._pcs[data.sink].setRemoteDescription(data.sdp, function() {
        // Firefoxism
        if (browserisms == 'Firefox') {
          self._pcs[data.sink].connectDataConnection(self.localPort, self.remotePort);
          self._socket.emit('port', { sink: data.sink, local: self.remotePort, remote: self.localPort });
        }
        console.log('SOURCE: PeerConnection success');
      }, function(err) {
        console.log('failed to setRemoteDescription, ', err)
      });
    });
  });
};


// Stream Firefoxism... can be removed when DataChannel no longer requires
// a stream.
SourcePeer.prototype.maybeBrowserisms = function(pc, target) {
  var self = this;
  if (browserisms == 'Firefox') {
    getUserMedia({ audio: true, fake: true }, function(s) {
      pc.addStream(s);
      self.makeOffer(target);
    }, function(err) { console.log('crap'); });
  } else {
    this.makeOffer(target);
  }
};


// Make an offer.
SourcePeer.prototype.makeOffer = function(target) {
  var pc = this._pcs[target];
  var self = this;
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
  var self = this;
  pc.onconnection = function() {
    console.log('SOURCE: onconnection triggered.');
    var dc = pc.createDataChannel(self._name, {}, target);
    self._dcs[target] = dc;
    dc.binaryType = 'blob';

    // User handler
    if (!!self._handlers['sink']) {
      self._handlers['sink'](target);
    }

    dc.onmessage = function(e) {
      self.handleDataMessage(e);
    };
  };

  pc.ondatachannel = function() {
    console.log('SOURCE: data channeled');
  };

  pc.onclosedconnection = function() {
    // ??
  };
  cb(pc, target);
};


SourcePeer.prototype.send = function(data, sink) {
  // TODO: try/catch
  var ab = BinaryPack.pack(data);

  if (!!sink) {
    this._dcs[sink].send(ab);
    return;
  }

  for (var key in this._dcs) {
    if (this._dcs.hasOwnProperty(key)) {
      this._dcs[key].send(ab);
    }
  }
}


// Handles a DataChannel message.
SourcePeer.prototype.handleDataMessage = function(e) {
  BinaryPack.unpack(e.data, function(msg) {
    if (!!this._handlers['data']) {
      this._handlers['data'](msg);
    }
  });

}


SourcePeer.prototype.on = function(code, cb) {
  // For enduser.
  // MAKE A HASH
  this._handlers[code] = cb;
};

