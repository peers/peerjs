Peers
=====

Under heavy development and testing.

Currently DataChannel (P2P data transfer) only works in Firefox Nightly, but in Webkit browsers it will facilitate a P2P video/audio stream.

See public/js/sink.js for progress.


Current Dependencies:
==

* Firefox flags:
  `media.navigator.enabled: true`
  `media.navigator.permission.disabled: true`
  `media.peerconnection.enabled: true`
* node.js/SocketIO
* BinaryPack/MsgPack for easy ArrayBuffers
