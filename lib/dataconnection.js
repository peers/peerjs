/**
 * Wraps a DataChannel between two Peers.
 */
function DataConnection(peer, options) {
  if (!(this instanceof DataConnection)) return new DataConnection(peer, options);
  EventEmitter.call(this);

  // TODO: perhaps default serialization should be binary-utf8?
  options = util.extend({
    serialization: 'binary'
  }, options);

  // Connection is not open yet.
  this.open = false;

  this.label = options.label;
  this.metadata = options.metadata;
  this.serialization = options.serialization;
  this.peer = peer;
  this.reliable = options.reliable;

  /*this._dc = dc;
  if (this._dc) {
    this._configureDataChannel();
  }*/
};

util.inherits(DataConnection, EventEmitter);

DataConnection.prototype._configureDataChannel = function() {
  var self = this;
  // TODO: util.supports.binary
  if (util.supports.binary) {
    // Webkit doesn't support binary yet
    this._dc.binaryType = 'arraybuffer';
  }
  this._dc.onopen = function() {
    util.log('Data channel connection success');
    self.open = true;
    self.emit('open');
  };

  // Use the Reliable shim for non Firefox browsers
  // TODO: util.supports.reliable
  if (!util.supports.reliable) {
    this._reliable = new Reliable(this._dc, util.debug);
  }

  if (this._reliable) {
    this._reliable.onmessage = function(msg) {
      self.emit('data', msg);
    };
  } else {
    this._dc.onmessage = function(e) {
      self._handleDataMessage(e);
    };
  }
  this._dc.onclose = function(e) {
    util.log('DataChannel closed.');
    self.close();
  };

};

DataConnection.prototype._cleanup = function() {
  if (this._dc && this._dc.readyState !== 'closed') {
    this._dc.close();
    this._dc = null;
  }
  this.open = false;
  this.emit('close');
};

// Handles a DataChannel message.
DataConnection.prototype._handleDataMessage = function(e) {
  var self = this;
  var data = e.data;
  var datatype = data.constructor;
  if (this.serialization === 'binary' || this.serialization === 'binary-utf8') {
    if (datatype === Blob) {
      // Datatype should never be blob
      util.blobToArrayBuffer(data, function(ab) {
        data = util.unpack(ab);
        self.emit('data', data);
      });
      return;
    } else if (datatype === ArrayBuffer) {
      data = util.unpack(data);
    } else if (datatype === String) {
      // String fallback for binary data for browsers that don't support binary yet
      var ab = util.binaryStringToArrayBuffer(data);
      data = util.unpack(ab);
    }
  } else if (this.serialization === 'json') {
    data = JSON.parse(data);
  }
  this.emit('data', data);
};

DataConnection.prototype.addDC = function(dc) {
  this._dc = dc;
  this._configureDataChannel();
};


/**
 * Exposed functionality for users.
 */

/** Allows user to close connection. */
DataConnection.prototype.close = function() {
  if (!this.open) {
    return;
  }
  this._cleanup();
};

/** Allows user to send data. */
DataConnection.prototype.send = function(data) {
  if (!this.open) {
    this.emit('error', new Error('Connection no longer open.'));
  }
  if (this._reliable) {
    // Note: reliable sending will make it so that you cannot customize
    // serialization.
    this._reliable.send(data);
    return;
  }
  var self = this;
  if (this.serialization === 'none') {
    this._dc.send(data);
  } else if (this.serialization === 'json') {
    this._dc.send(JSON.stringify(data));
  } else {
    var utf8 = (this.serialization === 'binary-utf8');
    var blob = util.pack(data, utf8);
    // DataChannel currently only supports strings.
    if (!util.supports.binary) {
      util.blobToBinaryString(blob, function(str){
        self._dc.send(str);
      });
    } else {
      this._dc.send(blob);
    }
  }
};

DataConnection.prototype.handleMessage = function(message) {
  var payload = message.payload;

  switch (message.type) {
    case 'EXPIRE':
      peer.emit('error', new Error('Could not connect to peer ' + manager.peer));
      break;
    case 'ANSWER':
      // Forward to specific manager
      if (manager) {
        manager.handleSDP(payload.sdp, message.type);
      }
      break;
    case 'CANDIDATE':
      // Forward to specific manager
      if (manager) {
        manager.handleCandidate(payload);
      }
      break;
    case 'LEAVE':
      // Leave on all managers for a user
      if (this._managers[peer]) {
        var ids = Object.keys(this._managers[peer].managers);
        for (var i = 0; i < ids.length; i++) {
          this._managers[peer].managers[ids[i]].handleLeave();
        }
      }
      break;
    default:
      util.warn('Unrecognized message type:', message.type, 'from peer:', this.peer);
      break;
  }
}
