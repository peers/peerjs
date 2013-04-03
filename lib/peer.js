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

  // First check if browser can use PeerConnection/DataChannels.
  // TODO: when media is supported, lower browser version limit and move DC
  // check to where`connect` is called.
  if (!util.isBrowserCompatible()) {
    this._abort('browser-incompatible', 'The current browser does not support WebRTC DataChannels');
    return;
  }

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

  // States.
  this.destroyed = false;
  this.disconnected = false;

  // Connections for this peer.
  this.connections = {};
  // Connection managers.
  this.managers = {};

  // Queued connections to make.
  this._queued = [];

  // Init immediately if ID is given, otherwise ask server for ID
  if (id) {
    this.id = id;
    this._init();
  } else {
    this.id = null;
    this._getId();
  }
};

util.inherits(Peer, EventEmitter);

Peer.prototype._getId = function(cb) {  
  var self = this;
  try {
    var http = new XMLHttpRequest();
    var url = 'http://' + this._options.host + ':' + this._options.port + '/' + this._options.key + '/id';
    var queryString = '?ts=' + new Date().getTime() + '' + Math.random();
    url += queryString;
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
  var manager = this.managers[peer];
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
        sdp: payload.sdp,
        labels: payload.labels,
        config: this._options.config
      };

      var manager = this.managers[peer];
      if (!manager) {
        manager = new ConnectionManager(this.id, peer, this._socket, options);
        this._attachManagerListeners(manager);
        this.managers[peer] = manager;
        this.connections[peer] = {};
      }
      manager.update(options.labels);
      manager.handleSDP(payload.sdp, message.type);
      break;
    case 'EXPIRE':
      if (manager) {
        manager.close();
        manager.emit('error', new Error('Could not connect to peer ' + manager.peer));
      }
      break;
    case 'ANSWER':
      if (manager) {
        manager.handleSDP(payload.sdp, message.type);
      }
      break;
    case 'CANDIDATE':
      if (manager) {
        manager.handleCandidate(payload);
      }
      break;
    case 'LEAVE':
      if (manager) {
        manager.handleLeave();
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
    var manager = this._queued.pop();
    manager.initialize(this.id, this._socket);
  }
};

/** Listeners for manager. */
Peer.prototype._attachManagerListeners = function(manager) {
  var self = this;
  // Handle receiving a connection.
  manager.on('connection', function(connection) {
    self.connections[connection.peer][connection.label] = connection;
    self.emit('connection', connection);
  });
  // Handle a connection closing.
  manager.on('close', function() {
    if (!!self.managers[manager.peer]) {
      delete self.managers[manager.peer]
    }
  });
  manager.on('error', function(err) {
    self.emit('error', err);
  });
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
  if (!!this.managers) {
    var peers = Object.keys(this.managers);
    for (var i = 0, ii = peers.length; i < ii; i++) {
      this.managers[peers[i]].close();
    }
    util.setZeroTimeout(function(){
      self.disconnect();
    });
  }
  this.emit('close');
};



/** Exposed connect function for users. Will try to connect later if user
 * is waiting for an ID. */
Peer.prototype.connect = function(peer, options) {
  if (this.disconnected) {
    var err = new Error('This Peer has been disconnected from the server and can no longer make connections.');
    err.type = 'server-disconnected';
    this.emit('error', err);
    return;
  }

  options = util.extend({
    config: this._options.config
  }, options);

  var manager = this.managers[peer];
  if (!manager) {
    manager = new ConnectionManager(this.id, peer, this._socket, options);
    this._attachManagerListeners(manager);
    this.managers[peer] = manager;
    this.connections[peer] = {};
  }

  var connectionInfo = manager.connect(options);
  if (!!connectionInfo) {
    this.connections[peer][connectionInfo[0]] = connectionInfo[1];
  }

  if (!this.id) {
    this._queued.push(manager);
  }
  return connectionInfo[1];
};

/**
 * Return the peer id or null, if there's no id at the moment.
 * Reasons for no id could be 'connect in progress' or 'disconnected'
 */
Peer.prototype.getId = function() {
  return this.id;
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

/**
 * Disconnects the Peer's connection to the PeerServer. Does not close any
 *  active connections.
 * Warning: The peer can no longer create or accept connections after being
 *  disconnected. It also cannot reconnect to the server.
 */
Peer.prototype.disconnect = function() {
  if (!this.disconnected) {
    this._socket.close();
    this.id = null;
    this.disconnected = true;
  }
};

/**
 * Provides a clean method for checking if there's an active connection to the
 * peer server.
 */
Peer.prototype.isConnected = function() {
  return !this.disconnected;
};

/**
 * Returns true if this peer is destroyed and can no longer be used.
 */
Peer.prototype.isDestroyed = function() {
  return this.destroyed;
};

exports.Peer = Peer;
