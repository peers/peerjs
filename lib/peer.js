function Peer(options) {
  if (!(this instanceof Peer)) return new Peer(options);
  EventEmitter.call(this);

  options = util.extend({
    debug: false,
    host: 'localhost',
    protocol: 'http',
    config: { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] },
    port: 80
  }, options);
  this.options = options;
  util.debug = options.debug;

  this._server = options.host + ':' + options.port;
  this._httpUrl = options.protocol + '://' + this._server;
  this._config = options.config;

  // Ensure alphanumeric_-
  if (options.id && !/^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(options.id))
    throw new Error('Peer ID can only contain alphanumerics, "_", and "-".');

  this._id = options.id;
  // Not used unless using cloud server.
  this._apikey = options.apikey;

  // Check in with the server with ID or get an ID.
  this._checkIn();

  // Connections for this peer.
  this.connections = {};

  // Queued connections to make.
  this._queued = [];

  // Make sure connections are cleaned up.
  window.onbeforeunload = this._cleanup;
};

util.inherits(Peer, EventEmitter);

/** Check in with ID or get one from server. */
Peer.prototype._checkIn = function() {
  // If no ID provided, get a unique ID from server.
  var self = this;
  if (!this._id) {
    try {
      var http = new XMLHttpRequest();
      // If there's no ID we need to wait for one before trying to init socket.
      http.open('get', this._httpUrl + '/id', true);
      http.onreadystatechange = function() {
        if (!self._id && http.readyState > 2 && !!http.responseText) {
          try {
            var response = JSON.parse(http.responseText.split('\n').shift());
            if (!!response.id) {
              self._id = response.id;
              self._socketInit();
              self.emit('ready', self._id);
              self._processQueue();
            }
          } catch (e) {
            self._socketInit();
          }
        }
        self._handleStream(http, true);
      };
      http.send(null);
    } catch(e) {
      util.log('XMLHttpRequest not available; defaulting to WebSockets');
      this._socketInit();
    }
  } else {
    this._startXhrStream();
    this._socketInit();
  }
  // TODO: may need to setInterval in case handleStream is not being called
  // enough.
};

Peer.prototype._startXhrStream = function() {
  try {
    var http = new XMLHttpRequest();
    var self = this;
    http.open('post', this._httpUrl + '/id', true);
    http.setRequestHeader('Content-Type', 'application/json');
    http.onreadystatechange = function() {
      self._handleStream(http);
    };
    http.send(JSON.stringify({ id: this._id }));
    // TODO: may need to setInterval in case handleStream is not being called
    // enough.
  } catch(e) {
    util.log('XMLHttpRequest not available; defaulting to WebSockets');
  }
};

/** Handles onreadystatechange response as a stream. */
Peer.prototype._handleStream = function(http, pad) {
  // 3 and 4 are loading/done state. All others are not relevant.
  if (http.readyState < 3) {
    return;
  } else if (http.readyState == 3 && http.status != 200) {
    return;
  } else if (http.readyState == 4 && http.status != 200) {
    // Clear setInterval here if using it.
  }

  if (this._index === undefined)
    this._index = pad ? 2 : 1;

  if (http.responseText === null)
    return;

  // TODO: handle
  var message = http.responseText.split('\n')[this._index];
  if (!!message) {
    this._index += 1;
    this._handleServerMessage(message);
  }

  if (http.readyState == 4 && !this._socketOpen)
    this._startXhrStream();
};

/** Start up websocket communications. */
Peer.prototype._socketInit = function() {
  if (!!this._socket)
    return;

  this._socket = new WebSocket('ws://' + this._server + '/ws?id=' + this._id);

  var self = this;
  this._socket.onmessage = function(event) {
    self._handleServerMessage(event.data);
  };

  // Take care of the queue of connections if necessary and make sure Peer knows
  // socket is open.
  this._socket.onopen = function() {
    util.log('Socket open');
    self._socketOpen = true;
    var ids = Object.keys(self.connections)
    for (var i = 0, ii = ids.length; i < ii; i += 1) {
      self.connections[ids[i]].setSocketOpen();
    }
    if (self._id)
      self._processQueue();
  };
};


Peer.prototype._handleServerMessage = function(message) {
  var message;
  try {
    message = JSON.parse(message);
  } catch(e) {
    util.log('message unrecognizable:', message);
    return;
  }
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
      //throw new Error(message.msg);
      this.emit('error', message.msg);
      util.log(message.msg);
      break;
    case 'OFFER':
      var options = {
        metadata: message.metadata,
        sdp: message.sdp,
        socketOpen: this._socketOpen,
        config: this._config
      };
      var self = this;
      var connection = new DataConnection(this._id, peer, this._socket, this._httpUrl, function(err, connection) {
        if (!err) {
          self.emit('connection', connection, message.metadata);
        }
      }, options);
      this._attachConnectionListeners(connection);
      this.connections[peer] = connection;
      break;
    case 'PEER_READY':
      //if (connection) connection.processQueuedIce();
      break;
    case 'ANSWER':
      if (connection) connection.handleSDP(message);
      break;
    case 'CANDIDATE':
      if (connection) connection.handleCandidate(message);
      break;
    case 'LEAVE':
      if (connection) connection.handleLeave();
      break;
    case 'PORT':
      if (util.browserisms === 'Firefox') {
        connection.handlePort(message);
        break;
      }
    case 'DEFAULT':
      util.log('PEER: unrecognized message ', message.type);
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
  this._socket.send(JSON.stringify({ type: 'LEAVE', src: this._id }));
  for (var peer in this.connections) {
    if (this.connections.hasOwnProperty(peer)) {
      this.connections[peer].close();
    }
  }
};

/** Listeners for DataConnection events. */
Peer.prototype._attachConnectionListeners = function(connection) {
  var self = this;
  connection.on('close', function(peer) {
    if (self.connections[peer]) delete self.connections[peer];
  });
};



/** Exposed connect function for users. Will try to connect later if user
 * is waiting for an ID. */
Peer.prototype.connect = function(peer, metadata, cb) {
  if (typeof metadata === 'function' && !cb) cb = metadata; metadata = false;

  if (!this._id) {
    this._queued.push(Array.prototype.slice.apply(arguments));
    return;
  }

  var options = {
    metadata: metadata,
    socketOpen: this._socketOpen,
    config: this._config
  };
  var connection = new DataConnection(this._id, peer, this._socket, this._httpUrl, cb, options);
  this._attachConnectionListeners(connection);

  this.connections[peer] = connection;
};

Peer.prototype.destroy = function() {
  this._cleanup();
};


exports.Peer = Peer;

