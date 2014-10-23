# PeerJS: Simple peer-to-peer with WebRTC #

PeerJS provides a complete, configurable, and easy-to-use peer-to-peer API built on top of WebRTC, supporting both data channels and media streams.

### [http://nttcom.github.io/skyway](https://nttcom.github.io/skyway)

## Setup


**Include the library**

```html
<script src="https://skyway.io/dist/0.3/peer.js"></script>
```

**Create a Peer**  
Get a [free API key](http://nttcom.github.io/skyway/registration.html). Your id only needs to be unique to the namespace of your API key.
```javascript
var peer = new Peer('pick-an-id', {key: 'myapikey'}); 
// You can pick your own id or omit the id if you want to get a random one from the server.
```

## Data connections
**Connect**
```javascript
var conn = peer.connect('another-peers-id');
conn.on('open', function(){
  conn.send('hi!');
});
```
**Receive**
```javascript
peer.on('connection', function(conn) {
  conn.on('data', function(data){
    // Will print 'hi!'
    console.log(data);
  });
});
```

## Media calls
**Call**
```javascript
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
navigator.getUserMedia({video: true, audio: true}, function(stream) {
  var call = peer.call('another-peers-id', stream);
  call.on('stream', function(remoteStream) {
    // Show stream in some <video> element.
  });
}, function(err) {
  console.log('Failed to get local stream' ,err);
});

```
**Answer**
```javascript
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
peer.on('call', function(call) {
  navigator.getUserMedia({video: true, audio: true}, function(stream) {
    call.answer(stream); // Answer the call with an A/V stream.
    call.on('stream', function(remoteStream) {
      // Show stream in some <video> element.
    });
  }, function(err) {
    console.log('Failed to get local stream' ,err);
  });
});
```
## SkyWay Links

### [Documentation / API Reference](http://nttcom.github.io/skyway/docs)

### [Changelog](https://github.com/nttcom/peerjs/blob/master/changelog.md)

### [free API key](http://nttcom.github.io/skyway/registration.html)

### [Discuss SkyWay on our Google Group](https://groups.google.com/forum/#!forum/skywayjs)

## PeerJS links

### [WebRTC Browser compatibility status](http://peerjs.com/status)

### [PeerServer](https://github.com/peers/peerjs-server)

### [Discuss PeerJS on our Google Group](https://groups.google.com/forum/?fromgroups#!forum/peerjs)


