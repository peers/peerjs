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
  socket.on('source', function(from, msg) {

  });

  // Offer from src to dest.
  socket.on('offer', function (from, msg) {
  });
  // Answer from dest to src.
  socket.on('answer', function (from, msg) {
    var source = clients[msg.answer];
    source.emit('client-connected' { member: msg.member, offer: msg.offer });
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


