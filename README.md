# PeerJS: peer-to-peer in the browser #

PeerJS provides a complete, configurable, and easy-to-use peer-to-peer API built on top of WebRTC, supporting both data channels and media streams.

### [http://peerjs.com](http://peerjs.com)

## Setup


**Include the library**

```html
<script src="http://cdn.peerjs.com/0.3/peer.js"></script>
```

**Create a Peer**
```javascript
var peer = new Peer('pick-an-id', {key: 'myapikey'}); 
// You can pick your own id or omit the id if you want to get a random one from the server.
```

## Data connections
```javascript

// Connect
var conn = peer.connect('a-peers-id');
conn.on('open', function(){
  conn.send('hi!');
});

// Receive
peer.on('connection', function(conn) {
  conn.on('data', function(data){
    // Will print 'hi!'
    console.log(data);
  });
});
```

**Media calls**
```javascript
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
peer.on('call', function(call) {
  getUserMedia({video: true, audio: true}, function(stream) {
    call.on('stream', function(stream) {
      // Show stream in some <video> element.
    });
    call.answer(stream); // Answer any call with an A/V stream.
  }, function(err) {
    console.log(err);
  });
});
```

```

**Connecting peer**

```javascript
var peer = new Peer('thing2', {key: 'myapikey'}); // You can omit the ID if you want to get a random one from the server.

/** Data connections. */

var connection = peer.connect('thing1');
connection.on('open', function() {
  connection.send('hi!'); // Send 'hi!' when the data connection opens.
});

/** Media calls. */

var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
getUserMedia({video: true, audio: true}, function(stream) {
  var call = peer.call('thing1', stream);
  call.on('stream', function(stream) {
    // Show stream in some <video> element.
  });
}, function(err) {
  console.log(err);
});

```

### [Documentation](http://peerjs.com/docs)

### [Browser compatibility status](http://peerjs.com/status)

### [PeerServer](https://github.com/peers/peerjs-server)

### [Discuss PeerJS on our Google Group](https://groups.google.com/forum/?fromgroups#!forum/peerjs)

### [Changelog](https://github.com/peers/peerjs/blob/master/changelog.md)
