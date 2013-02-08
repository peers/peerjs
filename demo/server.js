var express = require('express');
var fs = require('fs');
var app =  express.createServer();

// Initialize main server
app.use(express.bodyParser());

app.use(express.static(__dirname + '/static'));

app.set('views', __dirname + '/views');


app.listen(8000);


var peer = require('peer');
s = new peer.PeerServer({ debug: true, port: 9000 });
