/**
 * An abstraction on top of WebSockets and XHR streaming to provide fastest
 * possible connection for peers.
 */
function Socket(server, id, key) {
  if (!(this instanceof Socket)) return new Socket(server, id, key);
  EventEmitter.call(this);

  this._id = id;
  this._server = server;
  this._httpUrl = 'http://' + this._server;
  this._key = key;
  this._token = util.randomToken();
};

util.inherits(Socket, EventEmitter);

/** Check in with ID or get one from server. */
Socket.prototype._checkIn = function() {
  // If no ID provided, get a unique ID from server.
  var self = this;
  if (!this._id) {
    try {
      this._http = new XMLHttpRequest();
      var url = this._httpUrl;
      // Set API key if necessary.
      if (!!this._key) {
        url += '/' + this._key;
      }
      url += '/id?token=' + this._token;

      // If there's no ID we need to wait for one before trying to init socket.
      this._http.open('get', url, true);
      this._http.onreadystatechange = function() {
        if (!self._id && self._http.readyState > 2 && !!self._http.responseText) {
          try {
            var response = JSON.parse(self._http.responseText.split('\n').shift());
            if (!!response.id) {
              self._id = response.id;
              self._startWebSocket();
              self.emit('message', { type: 'OPEN', id: self._id });
            }
          } catch (e) {
            self._startWebSocket();
          }
        }
        self._handleStream(true);
      };
      this._http.send(null);
      this._setHTTPTimeout();
    } catch(e) {
      util.log('XMLHttpRequest not available; defaulting to WebSockets');
      this._startWebSocket();
    }
  } else {
    this._startXhrStream();
    this._startWebSocket();
  }
};


/** Start up websocket communications. */
Socket.prototype._startWebSocket = function() {
  if (!!this._socket) {
    return;
  }

  var wsurl = 'ws://' + this._server + '/ws?';
  var query = ['token=' + this._token];
  if (!!this._id) {
    query.push('id=' + this._id);
  }
  if (!!this._key) {
    query.push('key=' + this._key);
  }
  wsurl += query.join('&');
  this._socket = new WebSocket(wsurl);

  var self = this;
  this._socket.onmessage = function(event) {
    var data;
    try {
      data = JSON.parse(event.data);
    } catch(e) {
      data = event.data;
    }
    if (data.constructor == Object) {
      self.emit('message', data);
    } else {
      util.log('Invalid server message', event.data);
    }
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
    if (self._id) {
      self.emit('open');
    }
  };
};


/** Start XHR streaming. */
Socket.prototype._startXhrStream = function() {
  try {
    var self = this;

    this._http = new XMLHttpRequest();
    var url = this._httpUrl;
    // Set API key if necessary.
    if (!!this._key) {
      url += '/' + this._key;
    }
    url += '/id';
    this._http.open('post', url, true);
    this._http.setRequestHeader('Content-Type', 'application/json');
    this._http.onreadystatechange = function() {
      self._handleStream();
    };
    this._http.send(JSON.stringify({ id: this._id, token: this._token }));
    this._setHTTPTimeout();

  } catch(e) {
    util.log('XMLHttpRequest not available; defaulting to WebSockets');
  }
};


/** Handles onreadystatechange response as a stream. */
Socket.prototype._handleStream = function(pad) {
  // 3 and 4 are loading/done state. All others are not relevant.
  if (this._http.readyState < 3) {
    return;
  } else if (this._http.readyState == 3 && this._http.status != 200) {
    return;
  }

  if (this._index === undefined) {
    this._index = pad ? 2 : 1;
  }
  
  if (this._http.responseText === null) {
    return;
  }
  
  var message = this._http.responseText.split('\n')[this._index];
  if (!!message && this._http.readyState == 3) {
    this._index += 1;
    try {
      this._handleHTTPErrors(JSON.parse(message));
    } catch(e) {
      util.log('Invalid server message', message);
    }
  } else if (this._http.readyState == 4) {
    this._index = 1;
  }
};

Socket.prototype._setHTTPTimeout = function() {
  this._timeout = setTimeout(function() {
    var temp_http = self._http;
    if (!self._wsOpen()) {
      self._startXhrStream();
    }
    temp_http.abort();
  }, 30000);
};

Socket.prototype._handleHTTPErrors = function(message) {
  switch (message.type) {
    case 'HTTP-ERROR':
      util.log('XHR ended in error.');
      break;
    default:
      this.emit('message', message);
  }
};


/** Exposed send for DC & Peer. */
Socket.prototype.send = function(data) {
  var type = data.type;
  var message;
  if (!type) {
    this.emit('error', 'Invalid message');
  }

  if (this._wsOpen()) {
    message = JSON.stringify(data);
    this._socket.send(message);
  } else {
    data['token'] = this._token;
    message = JSON.stringify(data);
    var self = this;
    var http = new XMLHttpRequest();
    var url = this._httpUrl;

    // Set API key if necessary.
    if (!!this._key) {
      url += '/' + this._key;
    }
    url += '/' + type.toLowerCase();

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

Socket.prototype.start = function() {
  this._checkIn();
};
