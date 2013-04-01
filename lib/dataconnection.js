/**
 * Wraps a DataChannel between two Peers.
 */
function DataConnection(peer, dc, options) {
  if (!(this instanceof DataConnection)) return new DataConnection(peer, dc, options);
  EventEmitter.call(this);

  options = util.extend({
    reliable: false,
    serialization: 'binary'
  }, options);

  // Connection is not open yet.
  this.open = false;

  this.label = options.label;
  // Firefox is not this finely configurable.
  this.metadata = options.metadata;
  this.serialization = util.browserisms !== 'Firefox' ? options.serialization : 'binary';
  this._isReliable = util.browserisms !== 'Firefox' ? options.reliable : false;

  this.peer = peer;

  this._dc = dc;
  if (!!this._dc) {
    this._configureDataChannel();
  }
};

util.inherits(DataConnection, EventEmitter);

DataConnection.prototype._configureDataChannel = function() {
  util.log('Configuring DataChannel with peer ' + this.peer);
  var self = this;
  if (util.browserisms !== 'Webkit') {
    this._dc.binaryType = 'arraybuffer';
  }
  this._dc.onopen = function() {
    util.log('Data channel connection success');
    self.open = true;
    self.emit('open');
  };

  // Reliable.
  if (this._isReliable) {
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
  if (!!this._dc && this._dc.readyState !== 'closed') {
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
      util.blobToArrayBuffer(data, function(ab) {
        data = util.unpack(ab);
        self.emit('data', data);
      });
      return;
    } else if (datatype === ArrayBuffer) {
      data = util.unpack(data);
    } else if (datatype === String) {
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
    if (util.browserisms === 'Webkit') {
      util.blobToBinaryString(blob, function(str){
        self._dc.send(str);
      });
    } else {
      this._dc.send(blob);
    }
  }
};
