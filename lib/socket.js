/**
 * An abstraction on top of WebSockets and XHR streaming to provide fastest
 * possible connection for peers.
 */
function Socket(host, port, key, id) {
  if (!(this instanceof Socket)) return new Socket(server, id, key);
  EventEmitter.call(this);
  
  this._id = id;
  var token = util.randomToken();
  
  this._httpUrl = 'http://' + host + ':' + port + '/' + key + '/' + id + '/' + token;
  this._wsUrl = 'ws://' + this._server + '/ws?key='+key+'id='+id+'token='+token;
  
  this._index = 1;
};

util.inherits(Socket, EventEmitter);


/** Check in with ID or get one from server. */
Socket.prototype.start = function() {  
  this._startXhrStream();
  this._startWebSocket();
};


/** Start up websocket communications. */
Socket.prototype._startWebSocket = function() {
  var self = this;

  if (!!this._socket) {
    return;
  }

  this._socket = new WebSocket(wsurl);
  
  this._socket.onmessage = function(event) {
    var data;
    try {
      data = JSON.parse(event.data);
    } catch(e) {
      util.log('Invalid server message', event.data);
      return;
    }
    self.emit('message', data);
  };

  // Take care of the queue of connections if necessary and make sure Peer knows
  // socket is open.
  this._socket.onopen = function() {
    if (!!self._timeout) {
      clearTimeout(self._timeout);
      self._http.abort();
      self._http = null;
    }
    util.log('Socket open');
  };
};


/** Start XHR streaming. */
Socket.prototype._startXhrStream = function() {
  try {
    var self = this;
    this._http = new XMLHttpRequest();
    this._http.open('post', this._httpUrl + '/id', true);
    this._http.onreadystatechange = function() {
      if (!!self._http.old) {
        self._http.old.abort();
        delete self._http.old;
      }
      if (self._http.readyState > 2 && self._http.status == 200 && !!self._http.responseText) {
        self._handleStream();
      }
    };
    this._http.send(null);
    this._setHTTPTimeout();
  } catch(e) {
    util.log('XMLHttpRequest not available; defaulting to WebSockets');
  }
};


/** Handles onreadystatechange response as a stream. */
Socket.prototype._handleStream = function() {
  var self = this;
  // 3 and 4 are loading/done state. All others are not relevant.
  var message = this._http.responseText.split('\n')[this._index];
  if (!!message) {
    this._index += 1;
    try {
      message = JSON.parse(message);
    } catch(e) {
      util.log('Invalid server message', message);
      return;
    }
    self.emit('message', message);
  }
};

Socket.prototype._setHTTPTimeout = function() {
  var self = this;
  this._timeout = setTimeout(function() {
    var old = self._http;
    if (!self._wsOpen()) {
      self._index = 1;
      self._startXhrStream();
      self._http.old = old;        
    } else {
      old.abort();
    }
  }, 30000);
};

/** Exposed send for DC & Peer. */
Socket.prototype.send = function(data) {
  if (!data.type) {
    this.emit('error', 'Invalid message');
  }
  
  message = JSON.stringify(data);
  
  if (this._wsOpen()) {
    this._socket.send(message);
  } else {
    var http = new XMLHttpRequest();
    var url = this._httpUrl + '/' + type.toLowerCase();
    http.open('post', url, true);
    http.setRequestHeader('Content-Type', 'application/json');
    http.send(message);
  }
};

Socket.prototype.close = function() {
  if (!!this._wsOpen()) {
    this._socket.close();
  }
};

Socket.prototype._wsOpen = function() {
  return !!this._socket && this._socket.readyState == 1;
};

