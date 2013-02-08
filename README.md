# PeerJS: Peer-to-peer data in the browser #

##[http://peerjs.com](http://peerjs.com)

PeerJS wraps the WebRTC implementation to provide a complete, configurable, and easy-to-use peer-to-peer data API. Each peer simply provides a identifier with which other peers using the same API key can connect.


Peer

`<script>
  var peer = new Peer('someid', {key: 'apikey'});
  peer.on('connection', function(conn) {
    conn.on('data', function(data){
      // Will print 'hi!'
      console.log(data);
    });
  });
</script>`

Connecting peer

`<script>
  var peer = new Peer('anotherid', {key: 'apikey'});
  var conn = peer.connect('someid');
  conn.on('open', function(){
    conn.send('hi!');
  }); 
</script>`







