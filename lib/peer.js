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
  
  // Internal references
  this._managers = {}; // Managers for peer connections
  this._queued = []; // Queued connections to make.
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
  this.socket.on('message', function(data) {
    self._dispatchMessage(data);
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


Peer.prototype._dispatchMessage = function(message) {
  var type = message.type;
  // Message types that don't involve a peer
  switch (type) {
    case 'OPEN':
      this._processQueue();
      this.emit('open', this.id);
      return;
    case 'ERROR':
      this._abort('server-error', payload.msg);
      return;
    case 'ID-TAKEN':
      this._abort('unavailable-id', 'ID `'+this.id+'` is taken');
      return;
    case 'INVALID-KEY':
      this._abort('invalid-key', 'API KEY "' + this._key + '" is invalid');
      return;
  }
  
  var peer = message.src;
  var managerId = message.manager;
  var manager = this._getManager(peer, managerId);
  var payload = message.payload;
  switch (message.type) {
   
    case 'OFFER':
      var options = {
        sdp: payload.sdp,
        labels: payload.labels,
        config: this.options.config
      };
      // Either forward to or create new manager
      
      if (!manager) {
        manager = this._createManager(managerId, peer, options);
      }
      manager.handleUpdate(options.labels);
      manager.handleSDP(payload.sdp, message.type, payload.call);
      break;
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
      util.warn('Unrecognized message type:', message.type);
      break;
  }
};

/** Process queued calls to connect. */
Peer.prototype._processQueue = function() {
  while (this._queued.length > 0) {
    var manager = this._queued.pop();
    manager.initialize(this.id, this.socket);
  }
};

/** Listeners for manager. */
Peer.prototype._attachManagerListeners = function(manager) {
  var self = this;
  // Handle receiving a connection.
  manager.on('connection', function(connection) {
    self._managers[manager.peer].dataManager = manager;
    self.connections[connection.label] = connection;
    self.emit('connection', connection);
  });
  // Handle receiving a call
  manager.on('call', function(call) {
    self.calls[call.label] = call;
    self.emit('call', call);
  });
  // Handle a connection closing.
  manager.on('close', function() {
    if (!!self._managers[manager.peer]) {
      delete self._managers[manager.peer];
      // TODO: delete relevant calls and connections
    }
  });
  manager.on('error', function(err) {
    self.emit('error', err);
  });
};


Peer.prototype._getManager = function(peer, managerId) {
  if (this._managers[peer]) {
    return this._managers[peer].managers[managerId];
  }
}

Peer.prototype._getDataManager = function(peer) {
  if (this._managers[peer]) {
    return this._managers[peer].dataManager;
  }
}

/** Exposed connect function for users. Will try to connect later if user
 * is waiting for an ID. */
Peer.prototype._createManager = function(managerId, peer, options) {
  if (this.disconnected) {
    var err = new Error('This Peer has been disconnected from the server and can no longer make connections.');
    err.type = 'server-disconnected';
    this.emit('error', err);
    return;
  }

  options = util.extend({
    config: this.options.config
  }, options);

  if (!this._managers[peer]) {
    this._managers[peer] = {nextId: 0, managers: {}};
  }
  
  managerId = managerId || peer + this._managers[peer].nextId++;
  
  var manager = new ConnectionManager(managerId, peer, options);
  if (!!this.id && !!this.socket) {
    manager.initialize(this.id, this.socket);
  } else {
    this._queued.push(manager);
  }
  this._attachManagerListeners(manager);
  this._managers[peer].managers[manager._managerId] = manager;

  return manager;
};

Peer.prototype.connect = function(peer, options) {
  var manager = this._getDataManager(peer);
  if (!manager) {
    manager = this._createManager(false, peer, options);
  }
  var connection = manager.connect(options);
  return connection;
}

Peer.prototype.call = function(peer, stream, options) {
  var manager = this._createManager(false, peer, options);
  var connection = manager.call(stream, options);
  return connection;
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
    this.destroyed = true;
  }
};


// TODO: UPDATE
Peer.prototype._cleanup = function() {
  var self = this;
  if (!!this._managers) {
    var peers = Object.keys(this._managers);
    for (var i = 0, ii = peers.length; i < ii; i++) {
      var ids = Object.keys(this._managers[peers[i]]);
      for (var j = 0, jj = peers.length; j < jj; j++) {
        this._managers[peers[i]][ids[j]].close();
      }
    }
  }
  util.setZeroTimeout(function(){
    self.disconnect();
  });
  this.emit('close');
};

/**
 * Disconnects the Peer's connection to the PeerServer. Does not close any
 *  active connections.
 * Warning: The peer can no longer create or accept connections after being
 *  disconnected. It also cannot reconnect to the server.
 */
Peer.prototype.disconnect = function() {
  if (!this.disconnected) {
    if (!!this.socket) {
      this.socket.close();
    }
    this.id = null;
    this.disconnected = true;
  }
};

/** The current browser. */
Peer.browser = util.browserisms;


exports.Peer = Peer;
