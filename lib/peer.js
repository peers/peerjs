/**
 * A peer who can initiate connections with other peers.
 */
function Peer(id, options) {
  if (id && id.constructor == Object) {
    options = id;
    id = undefined;
  }
  if (!(this instanceof Peer)) return new Peer(id, options);
  EventEmitter.call(this);

  // Detect relative URL host.
  if (options.host === '/') {
    options.host = window.location.hostname;
  }

  options = util.extend({
    debug: false,
    host: '0.peerjs.com',
    port: 9000,
    key: 'peerjs',
    config: { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] }
  }, options);
  this._options = options;
  util.debug = options.debug;

  // Ensure alphanumeric_-
  var self = this;
  if (id && !/^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(id)) {
    util.setZeroTimeout(function() {
      self._abort('invalid-id', 'ID "' + id + '" is invalid');
    });
    return
  }
  if (options.key && !/^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(options.key)) {
    util.setZeroTimeout(function() {
      self._abort('invalid-key', 'API KEY "' + options.key + '" is invalid');
    });
    return
  }

  // Connections for this peer.
  this.connections = {};

  // Queued connections to make.
  this._queued = [];

  // Init immediately if ID is given, otherwise ask server for ID
  if (id) {
    this.id = id;
    this._init();
  } else {
    this._getId();
  }
};

util.inherits(Peer, EventEmitter);

Peer.prototype._getId = function(cb) {  
  var self = this;
  try {
    var http = new XMLHttpRequest();
    var url = 'http://' + this._options.host + ':' + this._options.port + '/' + this._options.key + '/id';
    // If there's no ID we need to wait for one before trying to init socket.
    http.open('get', url, true);
    http.onreadystatechange = function() {
      if (http.readyState === 4) {
        self.id = http.responseText;
        self._init();
      }
    };
    http.send(null);
  } catch(e) {
    this._abort('server-error', 'Could not get an ID from the server');
  }
};


Peer.prototype._init = function() {
  var self = this;
  this._socket = new Socket(this._options.host, this._options.port, this._options.key, this.id);
  this._socket.on('message', function(data) {
    self._handleServerJSONMessage(data);
  });
  this._socket.on('error', function(error) {
    util.log(error);
    self._abort('socket-error', error);
  });
  this._socket.on('close', function() {
    var msg = 'Underlying socket has closed';
    util.log('error', msg);
    self._abort('socket-closed', msg);
  });
  this._socket.start();
}


Peer.prototype._handleServerJSONMessage = function(message) {
  var peer = message.src;
  var connection = this.connections[peer];
  var payload = message.payload;
  switch (message.type) {
    case 'OPEN':
      this._processQueue();
      this.emit('open', this.id);
      break;
    case 'ERROR':
      util.log(payload.msg);
      this._abort('server-error', payload.msg);
      break;
    case 'ID-TAKEN':
      this._abort('unavailable-id', 'ID `'+this.id+'` is taken');
      break;
    case 'OFFER':
      var options = {
        metadata: payload.metadata,
        serialization: payload.serialization,
        sdp: payload.sdp,
        reliable: payload.reliable,
        config: this._options.config
      };
      var connection = new DataConnection(this.id, peer, this._socket, options);
      this._attachConnectionListeners(connection);
      this.connections[peer] = connection;
      this.emit('connection', connection, payload.metadata);
      break;
    case 'EXPIRE':
      connection = this.connections[peer];
      if (connection) {
        connection.close();
        connection.emit('error', new Error('Could not connect to peer ' + connection.peer));
      }
      break;
    case 'ANSWER':
      if (connection) {
        connection.handleSDP(payload.sdp, message.type);
      }
      break;
    case 'CANDIDATE':
      if (connection) {
        connection.handleCandidate(payload);
      }
      break;
    case 'LEAVE':
      if (connection) {
        connection.handleLeave();
      }
      break;
    case 'INVALID-KEY':
      this._abort('invalid-key', 'API KEY "' + this._key + '" is invalid');
      break;
    case 'PORT':
      //if (util.browserisms === 'Firefox') {
      //  connection.handlePort(payload);
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
    conn.initialize(this.id, this._socket);
  }
};

/** Destroys the Peer and emits an error message. */
Peer.prototype._abort = function(type, message) {
  var err = new Error(message);
  err.type = type;
  this.destroy();
  this.emit('error', err);
};

Peer.prototype._cleanup = function() {
  var self = this;
  if (!!this.connections) {
    var peers = Object.keys(this.connections);
    for (var i = 0, ii = peers.length; i < ii; i++) {
      this.connections[peers[i]].close();
    }
    util.setZeroTimeout(function(){
      self._socket.close();
    });
  }
  this.emit('close');
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
Peer.prototype.connect = function(peer, options) {
  if (this.destroyed) {
    this._abort('peer-destroyed', 'This Peer has been destroyed and is no longer able to make connections.');
    return;
  }

  options = util.extend({
    config: this._options.config
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
  if (!this.destroyed) {
    this._cleanup();
    this.destroyed = true;
  }
};


exports.Peer = Peer;
