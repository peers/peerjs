# Peers: a node.js PeerConnection library #


## Chrome ##

* Run Canary with `--enable-data-channel`


## Firefox ##

Currently awaiting next Firefox WebRTC update.

* Firefox flags:
  `media.navigator.enabled: true`
  `media.navigator.permission.disabled: true`
  `media.peerconnection.enabled: true`

## Usage ##

### Server ###

`npm install peer`

```js
var PeerServer = require('peer').PeerServer({ port: 80, debug: true });
```

### Client ###

`<script type="text/javascript" src="/client/dist/peer.js"></script>`


#### First peer ####

```js
var connections = {};

p1 = new Peer({ server: 'localhost' });
p1.on('ready', function(id) {
  console.log(id); // => 'some_id_1'
});

p1.on('connection', function(connection) {
  // Sends a message to the other peer. This can even be a blob or JSON.
  connection.send('Hi there!');
  connection.send({ file: new Blob([1, 2, 3])});

  // Probably want to save the connection object.
  connections[connection.metadata.username] = connection;

  if (connection.metadata.username == 'spy') {
    connection.close();
  } else {
    // Add handler for connection data.
    connection.on('data', function(data) {
      console.log(data);
    }
  }
});

```

#### Second Peer ####

```js
p2 = new Peer({ server: 'localhost' });
p2.on('ready', function(id) {
  console.log(id);

  p2.connect('some_id_1', { username: 'friend' }, function(err, connection) {
    connection.send('Hi, bye.');

    connection.close();
  });
});
```

#### Other events ####

* Connection - `close`: Called when a peer disconnects.
