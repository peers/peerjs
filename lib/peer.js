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
    port: 9000,
    key: 'peerjs',
    config: { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] }
  }, options);
  this._options = options;
  util.debug = options.debug;

  // Ensure alphanumeric_-
  if (id && !/^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(id)) {
    throw new Error('Peer ID can only contain alphanumerics, "_", and "-".');
  }
  if (options.key && !/^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(options.key)) {
    throw new Error('API key can only contain alphanumerics, "_", and "-".');
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
    this.emit('error', 'Could not get an ID from the server');
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
    self.emit('error', error);
    self.destroy();
  });
  this._socket.on('close', function() {
    var msg = 'Underlying socket has closed';
    util.log('error', msg);
    self.emit('error', msg);
    self.destroy();
  });
  this._socket.start();
}


Peer.prototype._handleServerJSONMessage = function(message) {
  var peer = message.src;
  var connection = this.connections[peer];
  payload = message.payload;
  switch (message.type) {
    case 'OPEN':
      this._processQueue();
      this.emit('open', this.id);
      break;
    case 'ERROR':
      this.emit('error', payload.msg);
      util.log(payload.msg);
      break;
    case 'ID-TAKEN':
      this.emit('error', 'ID `'+this.id+'` is taken');
      this.destroy();
      break;
    case 'OFFER':
      var options = {
        metadata: payload.metadata,
        sdp: payload.sdp,
        config: this._options.config,
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
        connection.emit('error', 'Could not connect to peer ' + connection.peer);
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
      this.emit('error', 'API KEY "' + this._key + '" is invalid');
      this.destroy();
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


Peer.prototype._cleanup = function() {
  var self = this;
  var peers = Object.keys(this.connections);
  for (var i = 0, ii = peers.length; i < ii; i++) {
    this.connections[peers[i]].close();
  }
  util.setZeroTimeout(function(){
    self._socket.close();
  });
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
