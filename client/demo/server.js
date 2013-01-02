var express = require('express');
var fs = require('fs');
var app =  express.createServer();

// Initialize main server
app.use(express.bodyParser());

app.use(express.static(__dirname + '/static'));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');


app.get('/', function(req, res){
  res.render('index');
});


app.listen(8000);


