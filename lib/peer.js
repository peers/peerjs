/**
 * A peer who can initiate connections with other peers.
 */
function Peer(options) {
  if (!(this instanceof Peer)) return new Peer(options);
  EventEmitter.call(this);

  options = util.extend({
    debug: false,
    host: '0.peerjs.com',
    config: { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] },
    port: 80
  }, options);
  this._options = options;
  util.debug = options.debug;

  this._server = options.host + ':' + options.port;

  // Ensure alphanumeric_-
  if (options.id && !/^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(options.id)) {
    throw new Error('Peer ID can only contain alphanumerics, "_", and "-".');
  }
  if (options.key && !/^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(options.key)) {
    throw new Error('API key can only contain alphanumerics, "_", and "-".');
  }
  
  this._id = options.id;
  // Not used unless using cloud server.
  this._key = options.key;

  this._startSocket();

  // Connections for this peer.
  this.connections = {};

  // Queued connections to make.
  this._queued = [];
};

util.inherits(Peer, EventEmitter);

Peer.prototype._startSocket = function() {
  var self = this;
  this._socket = new Socket(this._server, this._id, this._key);
  this._socket.on('message', function(data) {
    self._handleServerJSONMessage(data);
  });
  this._socket.on('open', function() {
    self._processQueue();
  });
  this._socket.on('unavailable', function(peer) {
    util.log('Destination peer not available.', peer);
    if (self.connections[peer]) {
      self.connections[peer].close();
    }
  });
  this._socket.on('error', function(error) {
    util.log(error);
  });
  this._socket.start();
}


Peer.prototype._handleServerJSONMessage = function(message) {
  var peer = message.src;
  var connection = this.connections[peer];
  switch (message.type) {
    case 'ID':
      if (!this._id) {
        // If we're just now getting an ID then we may have a queue.
        this._id = message.id;
        this.emit('ready', this._id);
        this._processQueue();
      }
      break;
    case 'ERROR':
      this.emit('error', message.msg);
      util.log(message.msg);
      break;
    case 'OFFER':
      var options = {
        metadata: message.metadata,
        sdp: message.sdp,
        config: this._options.config,
      };
      var self = this;
      var connection = new DataConnection(this._id, peer, this._socket, function(err, connection) {
        if (!err) {
          self.emit('connection', connection, message.metadata);
        }
      }, options);
      this._attachConnectionListeners(connection);
      this.connections[peer] = connection;
      break;
    case 'ANSWER':
      if (connection) {
        connection.handleSDP(message);
      }
      break;
    case 'CANDIDATE':
      if (connection) {
        connection.handleCandidate(message);
      }
      break;
    case 'LEAVE':
      if (connection) {
        connection.handleLeave();
      }
      break;
    case 'PORT':
      //if (util.browserisms === 'Firefox') {
      //  connection.handlePort(message);
      //  break;
      //}
    case 'DEFAULT':
      util.log('Unrecognized message type:', message.type);
      break;
  }
};

/** Process queued calls to connect. */
Peer.prototype._processQueue = function() {
  while (this._queued.length > 0) {
    var cdata = this._queued.pop();
    this.connect.apply(this, cdata);
  }
};


Peer.prototype._cleanup = function() {
  var self = this;
  var peers = Object.keys(this.connections);
  for (var i = 0, ii = peers.length; i < ii; i++) {
    this.connections[peers[i]].close();
  }
  util.setZeroTimeout(function(){
    self._socket.close();
  });
};

/** Listeners for DataConnection events. */
Peer.prototype._attachConnectionListeners = function(connection) {
  var self = this;
  connection.on('close', function(peer) {
    if (self.connections[peer]) { 
      delete self.connections[peer]; 
    }
  });
};



/** Exposed connect function for users. Will try to connect later if user
 * is waiting for an ID. */
// TODO: pause XHR streaming when not in use and start again when this is
// called.
Peer.prototype.connect = function(peer, metadata, cb) {
  if (typeof metadata === 'function' && !cb) cb = metadata; metadata = false;

  if (!this._id) {
    this._queued.push(Array.prototype.slice.apply(arguments));
    return;
  }

  var options = {
    metadata: metadata,
    config: this._options.config,
  };
  var connection = new DataConnection(this._id, peer, this._socket, cb, options);
  this._attachConnectionListeners(connection);

  this.connections[peer] = connection;
};

Peer.prototype.destroy = function() {
  this._cleanup();
};


exports.Peer = Peer;
