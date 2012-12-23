var express = require('express');
var fs = require('fs');
var app =  express.createServer();
var io = require('socket.io').listen(app);

// Initialize main server.
app.use(express.bodyParser());

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// P2P sources: { socket id => url }.
sources = {};
// socket.io clients.
clients = {};

// P2Ps. { source id => group members }
connections = {};

// For connecting clients:
// Src will connect upon creating a link.
// Receivers will connect after clicking a button and entering an optional key.
io.sockets.on('connection', function(socket) {
  clients[socket.id] = socket;

  // Source connected.
  socket.on('source', function(msg, fn) {
    fn({ 'id': socket.id });
    connections(socket.id) = [];
  });
  // Sink connected.
  socket.on('sink', function(msg, fn) {
    var source_id = msg.source;
    var sink_id = socket.id;
    var source = clients[source_id];
    source.emit('sink-connected', { 'sink': sink_id });
    fn({ 'id': sink_id });
  });

  // Offer from src to dest.
  socket.on('offer', function (msg) {
    sink = clients[msg.sink];
    sink.emit('offer', msg);
  });
  // Answer from dest to src.
  socket.on('answer', function (msg) {
    source = msg.source;
    source.emit('answer', msg, function() {
      // Add to list of successful connections.
      connections[msg.source].append(msg.sink);
      console.log('Successful Offer/Answer between ', msg.source, ' and ', msg.sink);
    });
  });

  socket.on('disconnect', function() {
    // Handle on client side?
    socket.broadcast.to(connections[socket.id]).emit('Host disconnected');
    delete connections[socket.id];
    delete clients[socket.id];
  });
});


app.get('/', function(req, res){
  res.render('index');
});


app.listen(80);


