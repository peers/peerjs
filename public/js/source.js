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
  var self = this;
  this._socket.emit('source', function(data) {
    self._id = data.id;

    if (!!self._readyHandler) {
      self._readyHandler(self._id);
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
          self._pcs[data.sink].connectDataConnection(5000, 5001);
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
    if (!!self._sinkHandler) {
      self._sinkHandler(target);
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
    if (!!this._dataHandler) {
      this._dataHandler(msg);
    }
  });

}


SourcePeer.prototype.on = function(code, cb) {
  // For enduser.
  // MAKE A HASH
  if (code === 'data') {
    this._dataHandler = cb;
  } else if (code === 'sink') {
    // SUCCESSFUL sink connection.
    this._sinkHandler = cb;
  } else if (code === 'stream') {
    this._streamHandler = cb;
  } else if (code === 'ready') {
    // Source has set up socket.
    this._readyHandler = cb;
  } else if (code == 'disconnect') {
    // A sink has disconnected.
    this._disconnectHandler = cb;
  }
};

