import { util } from "./util";
import logger from "./logger";
import { Negotiator } from "./negotiator";
import { ConnectionType, ServerMessageType } from "./enums";
import type { Peer } from "./peer";
import { BaseConnection, type BaseConnectionEvents } from "./baseconnection";
import type { ServerMessage } from "./servermessage";
import type { AnswerOption } from "./optionInterfaces";

export interface MediaConnectionEvents extends BaseConnectionEvents<never> {
	/**
	 * Emitted when a connection to the PeerServer is established.
	 *
	 * ```ts
	 * mediaConnection.on('stream', (stream) => { ... });
	 * ```
	 */
	stream: (stream: MediaStream) => void;
	/**
	 * Emitted when the auxiliary data channel is established.
	 * After this event, hanging up will close the connection cleanly on the remote peer.
	 * @beta
	 */
	willCloseOnRemote: () => void;
}

/**
 * Wraps WebRTC's media streams.
 * To get one, use {@apilink Peer.call} or listen for the {@apilink PeerEvents | `call`} event.
 */
export class MediaConnection extends BaseConnection<MediaConnectionEvents> {
	private static readonly ID_PREFIX = "mc_";
	readonly label: string;

	private _negotiator: Negotiator<MediaConnectionEvents, this>;
	private _localStream: MediaStream;
	private _remoteStream: MediaStream;

	/**
	 * For media connections, this is always 'media'.
	 */
	get type() {
		return ConnectionType.Media;
	}

	get localStream(): MediaStream {
		return this._localStream;
	}

	get remoteStream(): MediaStream {
		return this._remoteStream;
	}

	constructor(peerId: string, provider: Peer, options: any) {
		super(peerId, provider, options);

		this._localStream = this.options._stream;
		this.connectionId =
			this.options.connectionId ||
			MediaConnection.ID_PREFIX + util.randomToken();

		this._negotiator = new Negotiator(this);

		if (this._localStream) {
			this._negotiator.startConnection({
				_stream: this._localStream,
				originator: true,
			});
		}
	}

	/** Called by the Negotiator when the DataChannel is ready. */
	override _initializeDataChannel(dc: RTCDataChannel): void {
		this.dataChannel = dc;

		this.dataChannel.onopen = () => {
			logger.log(`DC#${this.connectionId} dc connection success`);
			this.emit("willCloseOnRemote");
		};

		this.dataChannel.onclose = () => {
			logger.log(`DC#${this.connectionId} dc closed for:`, this.peer);
			this.close();
		};
	}
	addStream(remoteStream) {
		logger.log("Receiving stream", remoteStream);

		this._remoteStream = remoteStream;
		super.emit("stream", remoteStream); // Should we call this `open`?
	}

	/**
	 * @internal
	 */
	handleMessage(message: ServerMessage): void {
		const type = message.type;
		const payload = message.payload;

		switch (message.type) {
			case ServerMessageType.Answer:
				// Forward to negotiator
				void this._negotiator.handleSDP(type, payload.sdp);
				this._open = true;
				break;
			case ServerMessageType.Candidate:
				void this._negotiator.handleCandidate(payload.candidate);
				break;
			default:
				logger.warn(`Unrecognized message type:${type} from peer:${this.peer}`);
				break;
		}
	}

	/**
     * When receiving a {@apilink PeerEvents | `call`} event on a peer, you can call
     * `answer` on the media connection provided by the callback to accept the call
     * and optionally send your own media stream.

     *
     * @param stream A WebRTC media stream.
     * @param options
     * @returns
     */
	answer(stream?: MediaStream, options: AnswerOption = {}): void {
		if (this._localStream) {
			logger.warn(
				"Local stream already exists on this MediaConnection. Are you answering a call twice?",
			);
			return;
		}

		this._localStream = stream;

		if (options && options.sdpTransform) {
			this.options.sdpTransform = options.sdpTransform;
		}

		this._negotiator.startConnection({
			...this.options._payload,
			_stream: stream,
		});
		// Retrieve lost messages stored because PeerConnection not set up.
		const messages = this.provider._getMessages(this.connectionId);

		for (const message of messages) {
			this.handleMessage(message);
		}

		this._open = true;
	}

	/**
	 * Exposed functionality for users.
	 */

	/**
	 * Closes the media connection.
	 */
	close(): void {
		if (this._negotiator) {
			this._negotiator.cleanup();
			this._negotiator = null;
		}

		this._localStream = null;
		this._remoteStream = null;

		if (this.provider) {
			this.provider._removeConnection(this);

			this.provider = null;
		}

		if (this.options && this.options._stream) {
			this.options._stream = null;
		}

		if (!this.open) {
			return;
		}

		this._open = false;

		super.emit("close");
	}
}
