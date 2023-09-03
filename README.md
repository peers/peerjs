# PeerJS: Simple peer-to-peer with WebRTC

### https://t.me/joinchat/VWI0UBxnG7f7_DV7

[![Backers on Open Collective](https://opencollective.com/peer/backers/badge.svg)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/peer/sponsors/badge.svg)](#sponsors)

PeerJS provides a complete, configurable, and easy-to-use peer-to-peer API built on top of WebRTC, supporting both data channels and media streams.

## Live Example

Here's an example application that uses both media and data connections: https://glitch.com/~peerjs-video. The example also uses its own [PeerServer](https://github.com/peers/peerjs-server).

## Setup

**Include the library**

with npm:
`npm install peerjs`

with yarn:
`yarn add peerjs`

```js
// The usage -
import { Peer } from "peerjs";
```

**Create a Peer**

```javascript
const peer = new Peer("pick-an-id");
// You can pick your own id or omit the id if you want to get a random one from the server.
```

## Data connections

**Connect**

```javascript
const conn = peer.connect("another-peers-id");
conn.on("open", () => {
	conn.send("hi!");
});
```

**Receive**

```javascript
peer.on("connection", (conn) => {
	conn.on("data", (data) => {
		// Will print 'hi!'
		console.log(data);
	});
	conn.on("open", () => {
		conn.send("hello!");
	});
});
```

## Media calls

**Call**

```javascript
navigator.mediaDevices.getUserMedia(
	{ video: true, audio: true },
	(stream) => {
		const call = peer.call("another-peers-id", stream);
		call.on("stream", (remoteStream) => {
			// Show stream in some <video> element.
		});
	},
	(err) => {
		console.error("Failed to get local stream", err);
	},
);
```

**Answer**

```javascript
peer.on("call", (call) => {
	navigator.mediaDevices.getUserMedia(
		{ video: true, audio: true },
		(stream) => {
			call.answer(stream); // Answer the call with an A/V stream.
			call.on("stream", (remoteStream) => {
				// Show stream in some <video> element.
			});
		},
		(err) => {
			console.error("Failed to get local stream", err);
		},
	);
});
```

## Running tests

```bash
npm test
```

## Browser support

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Safari |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 80+                                                                                                                                                                                                               | 83+                                                                                                                                                                                                           | 83+                                                                                                                                                                                                     | 15+                                                                                                                                                                                                           |

We test PeerJS against these versions of Chrome, Edge, Firefox, and Safari with [BrowserStack](https://www.browserstack.com) to ensure compatibility.
It may work in other and older browsers, but we don't officially support them.
Changes to browser support will be a breaking change going forward.

> [!NOTE]  
> Firefox 102+ is required for CBOR / MessagePack support.

## FAQ

Q. I have a message `Critical dependency: the request of a dependency is an expression` in browser's console

A. The message occurs when you use PeerJS with Webpack. It is not critical! It relates to Parcel https://github.com/parcel-bundler/parcel/issues/2883 We'll resolve it when updated to Parcel V2.

## Links

### [Documentation / API Reference](https://peerjs.com/docs/)

### [PeerServer](https://github.com/peers/peerjs-server)

### [Discuss PeerJS on our Telegram Channel](https://t.me/joinchat/ENhPuhTvhm8WlIxTjQf7Og)

### [Changelog](https://github.com/peers/peerjs/blob/master/CHANGELOG.md)

## Contributors

This project exists thanks to all the people who contribute.
<a href="https://github.com/peers/peerjs/graphs/contributors"><img src="https://opencollective.com/peer/contributors.svg?width=890&button=false" /></a>

## Backers

Thank you to all our backers! [[Become a backer](https://opencollective.com/peer#backer)]

<a href="https://opencollective.com/peer/backer/0/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/0/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/1/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/1/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/2/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/2/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/3/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/3/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/4/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/4/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/5/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/5/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/6/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/6/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/7/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/7/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/8/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/8/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/9/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/9/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/10/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/10/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/11/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/11/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/12/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/12/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/13/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/13/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/14/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/14/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/15/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/15/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/16/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/16/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/17/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/17/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/18/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/18/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/19/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/19/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/20/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/20/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/21/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/21/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/22/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/22/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/23/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/23/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/24/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/24/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/25/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/25/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/26/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/26/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/27/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/27/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/28/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/28/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/29/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/29/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/30/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/30/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/31/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/31/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/32/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/32/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/33/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/33/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/34/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/34/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/35/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/35/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/36/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/36/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/37/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/37/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/38/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/38/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/39/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/39/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/40/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/40/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/41/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/41/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/42/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/42/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/43/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/43/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/44/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/44/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/45/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/45/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/46/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/46/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/47/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/47/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/48/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/48/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/49/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/49/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/50/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/50/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/51/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/51/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/52/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/52/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/53/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/53/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/54/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/54/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/55/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/55/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/56/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/56/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/57/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/57/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/58/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/58/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/59/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/59/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/60/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/60/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/61/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/61/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/62/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/62/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/63/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/63/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/64/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/64/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/65/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/65/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/66/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/66/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/67/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/67/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/68/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/68/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/69/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/69/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/70/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/70/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/71/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/71/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/72/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/72/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/73/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/73/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/74/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/74/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/75/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/75/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/76/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/76/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/77/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/77/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/78/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/78/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/79/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/79/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/80/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/80/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/81/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/81/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/82/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/82/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/83/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/83/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/84/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/84/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/85/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/85/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/86/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/86/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/87/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/87/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/88/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/88/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/89/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/89/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/90/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/90/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/91/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/91/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/92/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/92/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/93/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/93/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/94/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/94/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/95/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/95/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/96/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/96/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/97/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/97/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/98/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/98/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/99/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/99/avatar.svg?requireActive=false"/></a>
<a href="https://opencollective.com/peer/backer/100/website?requireActive=false" target="_blank"><img src="https://opencollective.com/peer/backer/100/avatar.svg?requireActive=false"/></a>

## Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/peer#sponsor)]

<a href="https://opencollective.com/peer/sponsor/1/website" target="_blank"><img src="https://opencollective.com/peer/sponsor/1/avatar.svg"/></a>
<a href="https://opencollective.com/peer/sponsor/2/website" target="_blank"><img src="https://opencollective.com/peer/sponsor/2/avatar.svg"/></a>
<a href="https://opencollective.com/peer/sponsor/0/website" target="_blank"><img src="https://opencollective.com/peer/sponsor/0/avatar.svg"/></a>
<a href="https://opencollective.com/peer/sponsor/3/website" target="_blank"><img src="https://opencollective.com/peer/sponsor/3/avatar.svg"/></a>
<a href="https://opencollective.com/peer/sponsor/4/website" target="_blank"><img src="https://opencollective.com/peer/sponsor/4/avatar.svg"/></a>
<a href="https://opencollective.com/peer/sponsor/5/website" target="_blank"><img src="https://opencollective.com/peer/sponsor/5/avatar.svg"/></a>
<a href="https://opencollective.com/peer/sponsor/6/website" target="_blank"><img src="https://opencollective.com/peer/sponsor/6/avatar.svg"/></a>
<a href="https://opencollective.com/peer/sponsor/7/website" target="_blank"><img src="https://opencollective.com/peer/sponsor/7/avatar.svg"/></a>
<a href="https://opencollective.com/peer/sponsor/8/website" target="_blank"><img src="https://opencollective.com/peer/sponsor/8/avatar.svg"/></a>
<a href="https://opencollective.com/peer/sponsor/9/website" target="_blank"><img src="https://opencollective.com/peer/sponsor/9/avatar.svg"/></a>

## License

PeerJS is licensed under the [MIT License](https://tldrlegal.com/l/mit).
