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
};

util.inherits(Socket, EventEmitter);

/** Check in with ID or get one from server. */
Socket.prototype._checkIn = function() {
  // If no ID provided, get a unique ID from server.
  var self = this;
  if (!this._id) {
    try {
      var http = new XMLHttpRequest();
      var url = this._httpUrl + '/id';
      // Set API key if necessary.
      if (!!this._key) {
        url += '/' + this._key;
      }

      // If there's no ID we need to wait for one before trying to init socket.
      http.open('get', url, true);
      http.onreadystatechange = function() {
        if (!self._id && http.readyState > 2 && !!http.responseText) {
          try {
            var response = JSON.parse(http.responseText.split('\n').shift());
            if (!!response.id) {
              self._id = response.id;
              self._startWebSocket();
              self.emit('message', { type: 'ID', id: self._id });
            }
          } catch (e) {
            self._startWebSocket();
          }
        }
        self._handleStream(http, true);
      };
      http.send(null);
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

  var wsurl = 'ws://' + this._server + '/ws';
  if (!!this._id) {
    wsurl += '?id=' + this._id;
    if (!!this._key) {
      wsurl += '&key=' + this._key;
    }
  } else if (!!this._key) {
    wsurl += '?key=' + this._key;
  }
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

    var http = new XMLHttpRequest();
    var url = this._httpUrl + '/id';
    // Set API key if necessary.
    if (!!this._key) {
      url += '/' + this._key;
    }
    http.open('post', url, true);
    http.setRequestHeader('Content-Type', 'application/json');
    http.onreadystatechange = function() {
      self._handleStream(http);
    };
    http.send(JSON.stringify({ id: this._id }));
  } catch(e) {
    util.log('XMLHttpRequest not available; defaulting to WebSockets');
  }
};


/** Handles onreadystatechange response as a stream. */
Socket.prototype._handleStream = function(http, pad) {
  // 3 and 4 are loading/done state. All others are not relevant.
  if (http.readyState < 3) {
    return;
  } else if (http.readyState == 3 && http.status != 200) {
    return;
  }

  if (this._index === undefined) {
    // TODO
    this._index = 2;
    //this._index = pad ? 2 : 1;
  }
  
  if (http.responseText === null) {
    return;
  }
  
  var message = http.responseText.split('\n')[this._index];
  if (!!message && http.readyState == 3) {
    this._index += 1;
    try {
      this._handleHTTPErrors(JSON.parse(message));
    } catch(e) {
      util.log('Invalid server message', message);
    }
  } else if (http.readyState == 4) {
    this._index = 1;
  }
};


Socket.prototype._handleHTTPErrors = function(message) {
  switch (message.type) {
    // XHR stream closed by timeout.
    case 'HTTP-END':
      util.log('XHR stream timed out.');
      if (!!this._socket && this._socket.readyState != 1) {
        this._startXhrStream();
      }
      break;
    // XHR stream closed by socket connect.
    case 'HTTP-SOCKET':
      util.log('XHR stream closed, WebSocket connected.');
      break;
    case 'HTTP-ERROR':
      // this.emit('error', 'Something went wrong.');
      util.log('XHR ended in error or the websocket connected first.');
      break;
    default:
      this.emit('message', message);
  }
};



/** Exposed send for DC & Peer. */
Socket.prototype.send = function(data) {
  var type = data.type;
  message = JSON.stringify(data);
  if (!type) {
    this.emit('error', 'Invalid message');
  }

  if (!!this._socket && this._socket.readyState == 1) {
    this._socket.send(message);
  } else {
    var self = this;
    var http = new XMLHttpRequest();
    var url = this._httpUrl + '/' + type.toLowerCase();
    // Set API key if necessary.
    if (!!this._key) {
      url += '/' + this._key;
    }
      
    http.open('post', url, true);
    http.setRequestHeader('Content-Type', 'application/json');
    http.send(message);
  }
};

Socket.prototype.close = function() {
  if (!!this._socket && this._socket.readyState == 1) {
    this._socket.close();
  }
};

Socket.prototype.start = function() {
  this._checkIn();
};
