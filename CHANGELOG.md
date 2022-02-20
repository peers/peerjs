# Change Log

All notable changes will be documented in this file.

## vNext

...

<a name="2.0.0"></a>

## v2.0.0 (upcoming)

The main goals of the second version:

- modernize the code base: use `es6` and latest tools;
- target to the latest browsers API(you can use webrtc adapter to shim old browsers);
- shrink the package size.

### Breaking changes

#### Drop ES5 supports

If you need to support es5, you can recompile the lib from the sources or use the latest version from the v1 branch like `npm i peerjs@1`.

#### Remove `webrtc-adapter` package from `dependencies`

The modern browsers mostly works good without any additional libs like webrtc-adapter.

You can increase cross browsers support by manually add `webrtc-adapter` package to your project:

`npm install webrtc-adapter`

Then import it as soon as possible. For example, you have an entry point for your application in the file `index.tsx`. So, lets add the import:

```
import 'webrtc-adapter'; // as soon as possible

//
//... your startup code
//

```

See more: https://github.com/webrtcHacks/adapter

#### Remove browser detection features from the library.

The `browser` field was removed from the `util` class
and the `OFFER` packet.

#### The `main` field of `package.json` now points to the non minified version.

Today, most projects use bundlers with a minification step. Sometimes, double minification can lead to issues.

If you want to use the minified version, use it directly from the `dist` folder like:

```
import Peer from 'peerjs/dist/peerjs.min.js';

...
```

#### Remove `dist` folder from git

Please, try to host the package by yourself. It is more securely and you don't depend on third party.

In any case, you can use a CDN like `unpkg.com`:

```html
<script src="https://unpkg.com/peerjs@2.0.0/dist/peerjs.min.js"></script>
```

#### Use `ESBuild` as bundler.

Parcel 1 was a good choice years ago, but now esbuild seems like simple and good solution!

### Another changes

- update `devDependencies`
- apply `Prettier` for the code style
- rename `util` to `Utils`
- remove `peerjs` export.

<a name="1.3.2"></a>

## 1.3.2 (2021-03-11)

- fixed issues #800, #803 in PR #806, thanks @jordanaustin
- updated devDeps: `typescript` to 4.2

<a name="1.3.1"></a>

## 1.3.1 (2020-07-11)

- fixed: map file resolving
- removed: @types/webrtc because it contains in ts dom lib.

<a name="1.3.0"></a>

## 1.3.0 (2020-07-03)

- changed: don't close the Connection if `iceConnectionState` changed to `disconnected`

<a name="1.2.0"></a>

## 1.2.0 (2019-12-24)

- added: ability to change json stringify / json parse methods for DataConnection #592

- removed: `peerBrowser` field from `dataConnection` because unused

- fixed: lastServerId and reconnect #580 #534 #265

<a name="1.1.0"></a>

## 1.1.0 (2019-09-16)

- removed: deprecated `RtpDataChannels` and `DtlsSrtpKeyAgreement` options
- removed: grunt from deps, upgrade deps versions
- removed: Reliable dep because modern browsers supports `RTCDataChannel.ordered` property

- added: TURN server to default config

- fixed: emit error message, then destory/disconnect when error occured
- fixed: use `peerjs-js-binarypack` instead of `js-binarypack`
- fixed: sending large files via DataConnection #121

<a name="1.0.4"></a>

## 1.0.4 (2019-08-31)

- fixed: 'close' event for DataConnection #568

<a name="1.0.3"></a>

## 1.0.3 (2019-08-21)

- add pingInterval option

<a name="1.0.2"></a>

## 1.0.2 (2019-07-20)

### Bug Fixes

- fixed: memory leak in DataConnection #556
- fixed: missing sdpMid in IceServer #550

### Other

- updated: old @types/webrtc dependency #549

<a name="1.0.1"></a>

## 1.0.1 (2019-07-09)

### Bug Fixes

- fixed: readyState of undefined #520
- fixed: call sdpTransform in Answer #524
- fixed: sdpTransform does not apply to makeAnswer SDP #523

<a name="1.0.0"></a>

## 1.0.0 (2019-04-10)

### Refactoring

Almost all project was refactored!!!

- removed: xhr long-pooling #506
- changed: fetch api instead of xhr

### Features

- added: heartbeat #502

### Bug Fixes

- fixed: destroy RTCPeerConnection #513
- fixed: MediaStream memory leak #514

<a name="0.3.18"></a>

## 0.3.18 (2018-10-30)

### Features

- **typescript:** First commit ([0c77a5b](https://github.com/peers/peerjs/commit/0c77a5b))

<a name="0.3.16"></a>

## 0.3.16 (2018-08-21)

### Bug Fixes

- fixed typo in README ([f1bd47e](https://github.com/peers/peerjs/commit/f1bd47e))

## Version 0.3.14

- Patch for #246, which started as of Chrome 38.

## Version 0.3.11 (28 Sep 2014)

- Browserify build system

## Version 0.3.10 (29 Aug 2014)

- Fixed a bug where `disconnected` would be emitted for XHR requests that were aborted on purpose.

## Version 0.3.9 (11 July 2014)

- Allow an external adapter to be used (for `RTCPeerConnection` and such). (Thanks, @khankuan!)
- Fixed a bug where `_chunkedData` was not being cleared recursively, causing memory to be eaten up unnecessarily. (Thanks, @UnsungHero97!)
- Added `peer.reconnect()`, which allows a peer to reconnect to the signalling server with the same ID it had before after it has been disconnected. (Thanks, @jure, for the amazing input :)!)
- Added previously-missing error types, such as `webrtc`, `network`, and `peer-unavailable` error types. (Thanks, @mmis1000 for reporting!)
- Fixed a bug where the peer would infinitely attempt to start XHR streaming when there is no network connection available. Now, the peer will simply emit a `network` error and disconnect. (Thanks, @UnsungHero97 for reporting!)

## Version 0.3.8 beta (18 Mar 2014)

- **The following changes are only compatible with PeerServer 0.2.4.**
- Added the ability to specify a custom path when connecting to a self-hosted
  PeerServer.
- Added the ability to retrieve a list of all peers connected to the server.

## Version 0.3.7 beta (23 Dec 2013)

- Chrome 31+/Firefox 27+ DataConnection interop for files.
- Deprecate `binary-utf8` in favor of faster support for UTF8 in the regular
  `binary` serialization.
- Fix `invalid-key` error message.

## Version 0.3.6 beta (3 Dec 2013)

- Workaround for hitting Chrome 31+ buffer limit.
- Add `.bufferSize` to DataConnection to indicate the size of the buffer queue.
- Add `.dataChannel` to DataConnection as an alias for `._dc`, which contains
  the RTCDataChannel object associated with the DataConnection.
- Update BinaryPack dependency.

## Version 0.3.5 beta (26 Nov 2013)

- Fix bug where chunks were being emitted.

## Version 0.3.4 beta (11 Nov 2013)

- Fix file transfer issue in Chrome by chunking for data over 120KB.
- Use binary data when possible.
- Update BinaryPack dependency to fix inefficiencies.

## Version 0.3.3 beta (2 Nov 2013)

- Fix exceptions when peer emits errors upon creation
- Remove extra commas

## Version 0.3.2 beta (25 Oct 2013)

- Use SCTP in Chrome 31+.
- Work around Chrome 31+ tab crash. The crashes were due to Chrome's lack of support for the `maxRetransmits` parameter for modifying SDP.
- Fix exceptions in Chrome 29 and below.
- DataChannels are unreliable by default in Chrome 30 and below. In setting
  reliable to `true`, the reliable shim is used only in Chrome 30 and below.

## Version 0.3.1 beta (19 Oct 2013)

- Updated docs and examples for TURN server usage
- Fixed global variable leak
- DataConnections now have reliable: false by default. This will switch to on when reliable: true works in more browsers

## Version 0.3.0 beta (20 Sept 2013)

### Highlights

- Support for WebRTC video and audio streams in both Firefox and Chrome.
- Add `util.supports.[FEATURE]` flags, which represent the WebRTC features
  supported by your browser.
- **Breaking:** Deprecate current `Peer#connections` format. Connections will no longer be
  keyed by label and will instead be in a list.

### Other changes

- **Breaking:** Deprecate `Peer.browser` in favor of `util.browser`.
- Additional logging levels (warnings, errors, all).
- Additional logging functionality (`logFunction`).
- SSL option now in config rather than automatic.

## Version 0.2.8 (1 July 2013)

- Fix bug, no error on Firefox 24 due to missing error callback.
- TLS secure PeerServers now supported.
- Updated version of Reliable shim.

## Version 0.2.7 (28 May 2013)

- Fix bug, no error when .disconnect called in before socket connection established.
- Fix bug, failure to enter debug mode when aborting because browser not supported.

## Version 0.2.6 (2 May 2013)

- Peer.browser to check browser type.
- Update Reliable library and fix Reliable functionality in Chrome.

## Version 0.2.5 (24 Apr 2013)

- **Firefox compatibility for Firefox Nightly.**
- Misc bug fixes.

## Version 0.2.1 (3 Apr 2013)

- **Warning**: this build changes the error of type `peer-destroyed` to `server-disconnected`.
- ~~**Firefox compatibility.**~~ - Pushed back due to volatility of Firefox Nightly DataChannel APIs.
- Browser detection added. If an incompatible browser is detected, the `browser-incompatible` error is emitted from the `Peer`.
- Added a `.disconnect()` method to `Peer`, which can be called to close connections to the PeerServer (but not any active DataConnections).

## Version 0.2.0 (24 Mar 2013)

- **Warning**: this build introduces the following API changes that may break existing code.
  - `peer.connections` is no longer a hash mapping peer IDs to connections.
  - Connections no longer emit errors from `PeerConnection`; `PeerConnection` errors are now forwarded to the `Peer` object.
- Add support for multiple DataConnections with different labels.
- Update Reliable version to support faster file transfer.
- Fix bug where using XHR streaming to broker a connection occasionally fails.

## Version 0.1.7 (6 Mar 2013)

- Add experimental `reliable` messaging option. [See documentation.](https://github.com/peers/peerjs/blob/master/docs/api.md#experimental-reliable-and-large-file-transfer)
- Fix bug where the ID /GET request was cached and so two Peers created simultaneously would get the same ID: [See issue.](https://github.com/peers/peerjs-server/issues/2)
- Add support for relative hostname. [See documentation.](https://github.com/peers/peerjs/blob/master/docs/api.md#new-peerid-options)