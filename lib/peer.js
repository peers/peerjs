/**
 * A peer who can initiate connections with other peers.
 */
function Peer(id, options) {
  if (!(this instanceof Peer)) return new Peer(id, options);
  EventEmitter.call(this);

  // Deal with overloading
  if (id && id.constructor == Object) {
    options = id;
    id = undefined;
  } else {
    // Ensure id is a string
    id = id.toString();
  }
  //
  
  // Configurize options
  options = util.extend({
    debug: 0, // 1: Errors, 2: Warnings, 3: All logs
    host: '0.peerjs.com',
    port: 9000,
    key: 'peerjs',
    config: { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] }
  }, options);
  this.options = options;
  // Detect relative URL host.
  if (options.host === '/') {
    options.host = window.location.hostname;
  }
  // Set whether we use SSL to same as current host
  if (options.secure === undefined) {
    options.secure = util.isSecure();  
  }
  // TODO: document this feature
  // Set a custom log function if present
  if (options.logFunction) {
    util.setLogFunction(options.logFunction):
  }
  util.setLogLevel(options.debug);
  //
  
  // Sanity checks
  // Ensure WebRTC supported
  if (!util.supports.audioVideo && !util.supports.data ) {
    this._delayedAbort('browser-incompatible', 'The current browser does not support WebRTC');
    return;
  }
  // Ensure alphanumeric id
  if (!util.validateId(id)) {
    this._delayedAbort('invalid-id', 'ID "' + id + '" is invalid');
    return;
  }
  // Ensure valid key
  if (!util.validateKey(options.key)) {
    this._delayedAbort('invalid-key', 'API KEY "' + options.key + '" is invalid');
    return;
  }
  // Ensure not using unsecure cloud server on SSL page
  if (options.secure && options.host === '0.peerjs.com') {
    this._delayedAbort('ssl-unavailable',
      'The cloud server currently does not support HTTPS. Please run your own PeerServer to use HTTPS.');
    return;
  }
  //

  // States.
  this.destroyed = false; // Connections have been killed
  this.disconnected = false; // Connection to PeerServer killed but P2P connections still active
  //

  // References
  this.connections = {}; // DataConnections for this peer.
  this.calls = {}; // MediaConnections for this peer
  //

  // Start the connections
  if (id) {
    this._initialize(id);
  } else {
    this._retrieveId();
  }
  //
};

util.inherits(Peer, EventEmitter);

Peer.prototype._retrieveId = function(cb) {
  var self = this;
  var http = new XMLHttpRequest();
  var protocol = this.options.secure ? 'https://' : 'http://';
  var url = protocol + this.options.host + ':' + this.options.port + '/' + this.options.key + '/id';
  var queryString = '?ts=' + new Date().getTime() + '' + Math.random();
  url += queryString;
  // If there's no ID we need to wait for one before trying to init socket.
  http.open('get', url, true);
  http.onerror = function(e) { 
    util.error('Error retrieving ID', e);
    self._abort('server-error', 'Could not get an ID from the server');
  }
  http.onreadystatechange = function() {
    if (http.readyState !== 4) {
      return;
    }
    if (http.status !== 200) {
      http.onerror();
      return;
    }
    self._initialize(http.responseText);
  };
  http.send(null);
};


Peer.prototype._initialize = function(id) {
  var self = this;
  this.id = id;
  this.socket = new Socket(this.options.secure, this.options.host, this.options.port, this.options.key, this.id);
  this.socket.on('server-message', function(data) {
    self._handleMessage(data);
  });
  this.socket.on('error', function(error) {
    self._abort('socket-error', error);
  });
  this.socket.on('close', function() {
    // TODO: What if we disconnected on purpose?
    self._abort('socket-closed', 'Underlying socket has closed');
  });
  this.socket.start();
}

/** Handles messages from the server. */
Peer.prototype._handleMessage = function(message) {
  var type = message.type;
  var payload = message.payload
  switch (type) {
    case 'OPEN':
      this._processQueue();
      this.emit('open', this.id);
      break;
    case 'ERROR':
      this._abort('server-error', payload.msg);
      break;
    case 'ID-TAKEN':
      this._abort('unavailable-id', 'ID `' + this.id + '` is taken');
      break;
    case 'INVALID-KEY':
      this._abort('invalid-key', 'API KEY "' + this._key + '" is invalid');
      break;
    case 'OFFER': // we should consider switching this to CALL/CONNECT, but this is the least breaking option.
      var peer = message.src;
      var id = message.id;
      var connection = this._getConnection(peer, id);

      if (connection) {
        // Pass it on
        connection.handleMessage(message);
      } else {
        // Create a new connection.
        if (payload.type === 'call') {
          var call = new MediaConnection(peer, {
            id: id,
            offer: offer,
            sdp: payload.sdp
          });
          this._addConnection(peer, call);
          this.emit('call', call);
        } else if (payload.type === 'connect') {
          var connection = new DataConnection(peer, {
            id: id,
            offer: offer,
            sdp: payload.sdp
          });
          this._addConnection(peer, connection);
          this.emit('connection', connection);
        } else {
          util.warn('Received malformed connection type.');
        }
      }
      break;
    default:
      var peer = message.src;
      var id = message.id;
      var connection = this._getConnection(peer, id);

      if (connection) {
        connection.handleMessage(message);
      } else {
        util.warn('You aborted your connection to ' + peer + ' before it opened.');
      }
      break;
  }
}

Peer.prototype.connect = function(peer, options) {
  var connection = new DataConnection(peer, options);
  this._addConnection(peer, connection);
  return connection;
}

Peer.prototype.call = function(peer, stream, options) {
  if (!stream) {
    util.error('To call a peer, you must provide a stream from your browser\'s `getUserMedia`.');
    return;
  }
  options.stream = stream;
  var call = new MediaConnection(peer, options);
  this._addConnection(peer, call);
  return call;
}

Peer.prototype._addConnection = function(peer, connection) {
  if (!this.connections[peer]) {
    this.connections[peer] = [];
  }
  this.connections[peer].push(connection);
}

Peer.prototype._getConnection = function(peer, id) {
  var connections = this.connections[peer];
  if (!connections) {
    return null;
  }
  for (var i = 0, ii = connections.length; i < ii; i++) {
    if (connections[i].id === id) {
      return connections[i];
    }
  }
  return null;
}

Peer.prototype._delayedAbort = function(type, message) {
  var self = this;
  util.setZeroTimeout(function(){
    self._abort(type, message);
  });
}

/** Destroys the Peer and emits an error message. */
Peer.prototype._abort = function(type, message) {
  util.error('Aborting. Error:', message);
  var err = new Error(message);
  err.type = type;
  this.destroy();
  this.emit('error', err);
};

/**
 * Destroys the Peer: closes all active connections as well as the connection
 *  to the server.
 * Warning: The peer can no longer create or accept connections after being
 *  destroyed.
 */
Peer.prototype.destroy = function() {
  if (!this.destroyed) {
    this._cleanup();
    this.disconnect();
    this.destroyed = true;
  }
}


/* Disconnects every connection on this peer. */
Peer.prototype._cleanup = function() {
  var peers = Object.keys(this.connections);
  for (var i = 0, ii = peers.length; i < ii; i++) {
    var connections = this.connections[peers[i]];
    for (var j = 0, jj = connections; j < jj; j++) {
      connections[j].close();
    }
  }
  this.emit('close');
}

/**
 * Disconnects the Peer's connection to the PeerServer. Does not close any
 *  active connections.
 * Warning: The peer can no longer create or accept connections after being
 *  disconnected. It also cannot reconnect to the server.
 */
Peer.prototype.disconnect = function() {
  var self = this;
  util.setZeroTimeout(function(){
    if (!self.disconnected) {
      if (self.socket) {
        self.socket.close();
      }
      self.id = null;
      self.disconnected = true;
    }
  });
}

/** The current browser. */
// TODO: maybe expose util.supports
Peer.browser = util.browserisms;

exports.Peer = Peer;
