/**
 * A peer who can initiate connections with other peers.
 */
function Peer(id, options) {
  if (id.constructor == Object) {
    options = id;
    id = undefined;
  }
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
  if (id && !/^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(id)) {
    throw new Error('Peer ID can only contain alphanumerics, "_", and "-".');
  }
  if (options.key && !/^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(options.key)) {
    throw new Error('API key can only contain alphanumerics, "_", and "-".');
  }
  
  this.id = id;
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
  this._socket = new Socket(this._server, this.id, this._key);
  this._socket.on('message', function(data) {
    self._handleServerJSONMessage(data);
  });
  this._socket.on('open', function() {
    if (self.id) {
      self.emit('open', self.id);
      self._processQueue();
    }
  });
  this._socket.on('error', function(error) {
    util.log(error);
    self.emit('error', error);
    self.emit('close');
  });
  this._socket.on('close', function() {
    var msg = 'Underlying socket has closed';
    util.log('error', msg);
    self.emit('error', msg);
    self.emit('close');
  });
  this._socket.start();
}


Peer.prototype._handleServerJSONMessage = function(message) {
  var peer = message.src;
  var connection = this.connections[peer];
  switch (message.type) {
    case 'ID':
      if (!this.id) {
        // If we're just now getting an ID then we may have a queue.
        this.id = message.id;
        this.emit('open', this.id);
        this._processQueue();
      }
      break;
    case 'ERROR':
      this.emit('error', message.msg);
      util.log(message.msg);
      break;
    case 'ID-TAKEN':
      this.emit('error', 'ID `'+this.id+'` is taken');
      this.destroy();
      this.emit('close');
      break;
    case 'OFFER':
      var options = {
        metadata: message.metadata,
        sdp: message.sdp,
        config: this._options.config,
      };
      var connection = new DataConnection(this.id, peer, this._socket, options);
      this._attachConnectionListeners(connection);
      this.connections[peer] = connection;
      this.emit('connection', connection, message.metadata);
      break;
    case 'EXPIRE':
      connection = this.connections[message.expired];
      if (connection) {
        connection.close();
        connection.emit('Could not connect to peer ' + connection.peer);
      }
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
    case 'INVALID-KEY':
      this.emit('error', 'API KEY "' + this._key + '" is invalid');
      this.destroy();
      this.emit('close');
      break;
    case 'PORT':
      //if (util.browserisms === 'Firefox') {
      //  connection.handlePort(message);
      //  break;
      //}
    default:
      util.log('Unrecognized message type:', message.type);
      break;
  }
};

/** Process queued calls to connect. */
Peer.prototype._processQueue = function() {
  while (this._queued.length > 0) {
    var conn = this._queued.pop();
    conn.initialize(this.id);
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
Peer.prototype.connect = function(peer, metadata, options) {
  options = util.extend({
    metadata: metadata,
    config: this._options.config,
  }, options);

  var connection = new DataConnection(this.id, peer, this._socket, options);
  this._attachConnectionListeners(connection);

  this.connections[peer] = connection;
  if (!this.id) {
    this._queued.push(connection);
  }
  return connection;
};

Peer.prototype.destroy = function() {
  this._cleanup();
};


exports.Peer = Peer;
