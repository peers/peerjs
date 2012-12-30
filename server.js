var WebSocketServer = require('ws').Server;

function randomId() {
  return Math.random().toString(36).substr(2);
}

function prettyError(msg) {
  console.log('PeerServer: ', msg);
}

function PeerServer(options) {
  var wss = new WebSocketServer({ port: options.port || 80 });
  this.clients = {};
  var self = this;

  // For connecting clients:
  // Src will connect upon creating a link.
  // Receivers will connect after clicking a button and entering an optional key.
  wss.on('connection', function(socket) {
    var clientId = randomId();
    while (!!self.clients[clientId]) {
      clientId = randomId();
    }
    self.clients[clientId] = socket;

    socket.on('message', function(data) {
      var message = JSON.parse(data);
      if (options.debug) {
        console.log('PeerServer: ', message);
      }

      switch (message.type) {
        // Source connected -- send back its ID.
        case 'SOURCE':
          socket.send(JSON.stringify({ type: 'SOURCE-ID', id: clientId }));
          break;
        // Sink connected -- send back its ID and notify src.
        case 'SINK':
          if (!!message.source && !!self.clients[message.source]) {
            self.clients[message.source].send(JSON.stringify({
              type: 'SINK-CONNECTED', sink: clientId }));

            socket.send(JSON.stringify({ type: 'SINK-ID', id: clientId }));
          } else {
            prettyError('source invalid');
          }
          break;
        case 'LEAVE':
          delete self.clients[message.src];
        // Offer or answer from src to sink.
        case 'OFFER':
        case 'ANSWER':
        case 'CANDIDATE':
        case 'PORT':
          self.clients[message.dst].send(JSON.stringify(message));
          break;
        default:
          prettyError('message unrecognized');
      }
    });
  });

};

exports.PeerServer = PeerServer;
