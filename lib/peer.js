function Peer(options) {
  if (!(this instanceof Peer)) return new Peer(options);
  EventEmitter.call(this);

  options = util.extend({
    debug: false,
    host: 'localhost',
    port: 80
  }, options);
  this.options = options;
  util.debug = options.debug;

  this._server = options.host + ':' + options.port;

  // Ensure alphanumeric_-
  if (options.id && !/^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(options.id))
    throw new Error('Peer ID can only contain alphanumerics, "_", and "-".');

  this._id = options.id;
  // If no ID provided, get a unique ID from server. TODO

  if (!this._id) {
  // Not used unless using cloud server.
  this._apikey = options.apikey;


  // Must have an ID at this point.
  this._socket = new WebSocket('ws://' + this._server + '/ws?');
  this._socketInit();

  // Connections for this peer.
  this.connections = {};

  // Queued connections to make.
  this._queued = [];

  // Make sure connections are cleaned up.
  window.onbeforeunload = this._cleanup;
};

util.inherits(Peer, EventEmitter);

/** Start up websocket communications. */
Peer.prototype._socketInit = function() {
  var self = this;
  this._socket.onmessage = function(event) {
    var message = JSON.parse(event.data);
    var peer = message.src;
    var connection = self.connections[peer];
    switch (message.type) {
      case 'OFFER':
        var options = {
          metadata: message.metadata,
          sdp: message.sdp
        };
        var connection = new DataConnection(self._id, peer, self._socket, function(err, connection) {
          if (!err) {
            self.emit('connection', connection, message.metadata);
          }
        }, options);
        self.connections[peer] = connection;
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
  this._socket.onopen = function() {
    self._processQueue();
  };
};


Peer.prototype._processQueue = function() {
  while (this._queued.length > 0) {
    var cdata = this._queued.pop();
    this.connect.apply(this, cdata);
  }
};


Peer.prototype._cleanup = function() {
  for (var peer in this.connections) {
    if (this.connections.hasOwnProperty(peer)) {
      this.connections[peer].close();
    }
  }
};


Peer.prototype.connect = function(peer, metadata, cb) {
  if (typeof metadata === 'function' && !cb) cb = metadata; metadata = false;

  if (!this._id) {
    this._queued.push(Array.prototype.slice.apply(arguments));
    return;
  }

  var options = {
    metadata: metadata
  };

  var connection = new DataConnection(this._id, peer, this._socket, cb, options);
  this.connections[peer] = connection;
};


exports.Peer = Peer;

