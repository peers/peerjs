# PeerJS Changelog

## Version 0.2.5 (24 Apr 2013)
* **Firefox compatibility for Firefox Nightly.**
* Misc bug fixes.

## Version 0.2.1 (3 Apr 2013)
* **Warning**: this build changes the error of type `peer-destroyed` to `server-disconnected`.
* ~~**Firefox compatibility.**~~ - Pushed back due to volatility of Firefox Nightly DataChannel APIs.
* Browser detection added. If an incompatible browser is detected, the `browser-incompatible` error is emitted from the `Peer`.
* Added a `.disconnect()` method to `Peer`, which can be called to close connections to the PeerServer (but not any active DataConnections).

## Version 0.2.0 (24 Mar 2013)
* **Warning**: this build introduces the following API changes that may break existing code.
  * `peer.connections` is no longer a hash mapping peer IDs to connections.
  * Connections no longer emit errors from `PeerConnection`; `PeerConnection` errors are now forwarded to the `Peer` object.
* Add support for multiple DataConnections with different labels.
* Update Reliable version to support faster file transfer.
* Fix bug where using XHR streaming to broker a connection occasionally fails.

## Version 0.1.7 (6 Mar 2013)
* Add experimental `reliable` messaging option. [See documentation.](https://github.com/peers/peerjs/blob/master/docs/api.md#experimental-reliable-and-large-file-transfer)
* Fix bug where the ID /GET request was cached and so two Peers created simultaneously would get the same ID: [See issue.](https://github.com/peers/peerjs-server/issues/2)
* Add support for relative hostname. [See documentation.](https://github.com/peers/peerjs/blob/master/docs/api.md#new-peerid-options)
