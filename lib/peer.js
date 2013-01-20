function Peer(options) {
  if (!(this instanceof Peer)) return new Peer(options);
  EventEmitter.call(this);

  options = util.extend({
    debug: false,
    config: { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] },
    ws: 'ws://localhost'
  }, options);
  util.debug = options.debug;

  this._id = null;

  // Connections
  this.connections = {};
  this._socket = new WebSocket(options.ws);

  // Init socket msg handlers
  var self = this;
  this._socket.onopen = function() {
    self.socketInit();
  };
};

util.inherits(Peer, EventEmitter);

/** Start up websocket communications. */
Peer.prototype.socketInit = function() {
  var self = this;

  this._socket.onmessage = function(event) {
    var message = JSON.parse(event.data);
    var peer = message.src;
    var connection = self.connections[peer];

    switch (message.type) {
      case 'ID':
        self._id = message.id;
        self.emit('ready', self._id);
        break;
      case 'OFFER':
        var options = {
          metadata: message.metadata,
          peer: peer,
          id: self._id,
          originator: false,
          sdp: message.sdp
        };
        var connection = new DataConnection(options, self._socket, function(err, connection) {
          if (!err) {
            self.emit('connection', connection);
          }
        });
        self.connections[peer] = connection;
        break;
      case 'ANSWER':
        if (connection) connection.handleAnswer(message);
        break;
      case 'CANDIDATE':
        if (connection) connection.handleCandidate(message);
        break;
      case 'LEAVE':
        if (connection) connection.handleLeave(message);
        break;
      case 'PORT':
        if (browserisms && browserisms == 'Firefox') {
          connection.handlePort(message);
          break;
        }
      case 'DEFAULT':
        util.log('PEER: unrecognized message ', message.type);
        break;
    }
  };
  // Announce as a PEER to receive an ID.
  this._socket.send(JSON.stringify({
    type: 'PEER'
  }));

};


Peer.prototype.connect = function(peer, metadata, cb) {
  if (typeof metadata === 'function' && !cb) cb = metadata; metadata = false;

  var options = {
    metadata: metadata,
    id: this._id,
    peer: peer,
    originator: true
  };
  var connection = new DataConnection(options, this._socket, cb);
  this.connections[peer] = connection;
};


exports.Peer = Peer;

