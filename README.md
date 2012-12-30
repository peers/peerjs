# Peers: a node.js PeerConnection library #

Under heavy development and testing.

## Chrome ##

* Run Canary with `--enable-data-channel`


## Firefox ##

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


#### Source Peer ####

```js
originator = new SinkPeer({ video: true, audio: true, ws: 'ws://www.host.com' });
originator.on('ready', function(id) {
  console.log(id);
});
originator.on('connection', function(recipient) {
  // Sends a message to the other peer. This can even be a blob or JSON.
  originator.send('Hi there!');
  originator.send({ file: new Blob([1, 2, 3])});
});
originator.on('data', function(data) {
  // Prints out any messages received.
  console.log(data);
});
```

#### Sink Peer ####

```js
// Sinks start off with an ID of whom to connect to.
sink = new SinkPeer({ source: source_id, ws: 'ws://localhost' });
```

#### Other events ####

* `localstream, remotestream`: Callback is called with `type`, `stream` when a
local or remote stream is added.

* `disconnect`: Called with `id` when a peer disconnects. (TODO)
