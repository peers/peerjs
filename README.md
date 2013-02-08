# PeerJS: Peer-to-peer data in the browser #

PeerJS provides a complete, configurable, and easy-to-use peer-to-peer data API built on top of WebRTC.   
Each peer simply provides a identifier with which other peers using the same API key can connect.

##[http://peerjs.com](http://peerjs.com)


**Include the library**

    <script src="http://cdn.peerjs.com/0/peer.js"></script>

**Peer**

```js
<script>
  var peer = new Peer('someid', {key: 'apikey'});
  peer.on('connection', function(conn) {
    conn.on('data', function(data){
      // Will print 'hi!'
      console.log(data);
    });
  });
</script>
```

**Connecting peer**

```js
<script>
  var peer = new Peer('anotherid', {key: 'apikey'});
  var conn = peer.connect('someid');
  conn.on('open', function(){
    conn.send('hi!');
  }); 
</script>
```

### [Getting started](http://peerjs.com/start)

### [API reference](https://github.com/peers/peerjs/blob/master/docs/api.md)

### [Browser compatibility status](http://peerjs.com/status)

### [PeerServer](https://github.com/peers/peerjs-server)




