import { BinaryPackChunker } from "./dataconnection/BufferedConnection/binaryPackChunker";
import * as BinaryPack from "peerjs-js-binarypack";
import { Supports } from "./supports";
import { validateId } from "./utils/validateId";
import { randomToken } from "./utils/randomToken";

export interface UtilSupportsObj {
	/**
	 * The current browser.
	 * This property can be useful in determining whether two peers can connect.
	 *
	 * ```ts
	 * if (util.browser === 'firefox') {
	 *  // OK to peer with Firefox peers.
	 * }
	 * ```
	 *
	 * `util.browser` can currently have the values
	 * `'firefox', 'chrome', 'safari', 'edge', 'Not a supported browser.', 'Not a browser.' (unknown WebRTC-compatible agent).
	 */
	browser: boolean;
	webRTC: boolean;
	/**
	 * True if the current browser supports media streams and PeerConnection.
	 */
	audioVideo: boolean;
	/**
	 * True if the current browser supports DataChannel and PeerConnection.
	 */
	data: boolean;
	binaryBlob: boolean;
	/**
	 * True if the current browser supports reliable DataChannels.
	 */
	reliable: boolean;
}

const DEFAULT_CONFIG = {
	iceServers: [
		{ urls: "stun:stun.l.google.com:19302" },
		{
			urls: [
				"turn:eu-0.turn.peerjs.com:3478",
				"turn:us-0.turn.peerjs.com:3478",
			],
			username: "peerjs",
			credential: "peerjsp",
		},
	],
	sdpSemantics: "unified-plan",
};

export class Util extends BinaryPackChunker {
	noop(): void {}

	readonly CLOUD_HOST = "0.peerjs.com";
	readonly CLOUD_PORT = 443;

	// Browsers that need chunking:
	readonly chunkedBrowsers = { Chrome: 1, chrome: 1 };

	// Returns browser-agnostic default config
	readonly defaultConfig = DEFAULT_CONFIG;

	readonly browser = Supports.getBrowser();
	readonly browserVersion = Supports.getVersion();

	pack = BinaryPack.pack;
	unpack = BinaryPack.unpack;

	/**
	 * A hash of WebRTC features mapped to booleans that correspond to whether the feature is supported by the current browser.
	 *
	 * :::caution
	 * Only the properties documented here are guaranteed to be present on `util.supports`
	 * :::
	 */
	readonly supports = (function () {
		const supported: UtilSupportsObj = {
			browser: Supports.isBrowserSupported(),
			webRTC: Supports.isWebRTCSupported(),
			audioVideo: false,
			data: false,
			binaryBlob: false,
			reliable: false,
		};

		if (!supported.webRTC) return supported;

		let pc: RTCPeerConnection;

		try {
			pc = new RTCPeerConnection(DEFAULT_CONFIG);

			supported.audioVideo = true;

			let dc: RTCDataChannel;

			try {
				dc = pc.createDataChannel("_PEERJSTEST", { ordered: true });
				supported.data = true;
				supported.reliable = !!dc.ordered;

				// Binary test
				try {
					dc.binaryType = "blob";
					supported.binaryBlob = !Supports.isIOS;
				} catch (e) {}
			} catch (e) {
			} finally {
				if (dc) {
					dc.close();
				}
			}
		} catch (e) {
		} finally {
			if (pc) {
				pc.close();
			}
		}

		return supported;
	})();

	// Ensure alphanumeric ids
	validateId = validateId;
	randomToken = randomToken;

	blobToArrayBuffer(
		blob: Blob,
		cb: (arg: ArrayBuffer | null) => void,
	): FileReader {
		const fr = new FileReader();

		fr.onload = function (evt) {
			if (evt.target) {
				cb(evt.target.result as ArrayBuffer);
			}
		};

		fr.readAsArrayBuffer(blob);

		return fr;
	}

	binaryStringToArrayBuffer(binary: string): ArrayBuffer | SharedArrayBuffer {
		const byteArray = new Uint8Array(binary.length);

		for (let i = 0; i < binary.length; i++) {
			byteArray[i] = binary.charCodeAt(i) & 0xff;
		}

		return byteArray.buffer;
	}
	isSecure(): boolean {
		return location.protocol === "https:";
	}
}

/**
 * Provides a variety of helpful utilities.
 *
 * :::caution
 * Only the utilities documented here are guaranteed to be present on `util`.
 * Undocumented utilities can be removed without warning.
 * We don't consider these to be breaking changes.
 * :::
 */
export const util = new Util();
