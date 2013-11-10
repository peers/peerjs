# PeerJS Changelog

## Version 0.3.3 beta (2 Nov 2013)
* Fix exceptions when peer emits errors upon creation
* Remove extra commas

## Version 0.3.2 beta (25 Oct 2013)
* Use SCTP in Chrome 31+.
* Work around Chrome 31+ tab crash. The crashes were due to Chrome's lack of support for the `maxRetransmits` parameter for modifying SDP.
* Fix exceptions in Chrome 29 and below.
* DataChannels are unreliable by default in Chrome 30 and below. In setting
  reliable to `true`, the reliable shim is used only in Chrome 30 and below.

## Version 0.3.1 beta (19 Oct 2013)
* Updated docs and examples for TURN server usage
* Fixed global variable leak
* DataConnections now have reliable: false by default. This will switch to on when reliable: true works in more browsers

## Version 0.3.0 beta (20 Sept 2013)

### Highlights
* Support for WebRTC video and audio streams in both Firefox and Chrome.
* Add `util.supports.[FEATURE]` flags, which represent the WebRTC features
  supported by your browser.
* **Breaking:** Deprecate current `Peer#connections` format. Connections will no longer be
  keyed by label and will instead be in a list.

### Other changes
* **Breaking:** Deprecate `Peer.browser` in favor of `util.browser`.
* Additional logging levels (warnings, errors, all).
* Additional logging functionality (`logFunction`).
* SSL option now in config rather than automatic.

## Version 0.2.8 (1 July 2013)
* Fix bug, no error on Firefox 24 due to missing error callback.
* TLS secure PeerServers now supported.
* Updated version of Reliable shim.

## Version 0.2.7 (28 May 2013)
* Fix bug, no error when .disconnect called in before socket connection established.
* Fix bug, failure to enter debug mode when aborting because browser not supported.

## Version 0.2.6 (2 May 2013)
* Peer.browser to check browser type.
* Update Reliable library and fix Reliable functionality in Chrome.

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
