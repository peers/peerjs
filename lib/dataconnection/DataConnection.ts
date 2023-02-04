import { util } from "../util";
import logger from "../logger";
import { Negotiator } from "../negotiator";
import { ConnectionType, ServerMessageType } from "../enums";
import { Peer } from "../peer";
import { BaseConnection } from "../baseconnection";
import { ServerMessage } from "../servermessage";
import type { DataConnection as IDataConnection } from "./DataConnection";

type DataConnectionEvents = {
	/**
	 * Emitted when data is received from the remote peer.
	 */
	data: (data: unknown) => void;
	/**
	 * Emitted when the connection is established and ready-to-use.
	 */
	open: () => void;
};

/**
 * Wraps a DataChannel between two Peers.
 */
export abstract class DataConnection
	extends BaseConnection<DataConnectionEvents>
	implements IDataConnection
{
	protected static readonly ID_PREFIX = "dc_";
	protected static readonly MAX_BUFFERED_AMOUNT = 8 * 1024 * 1024;

	private _negotiator: Negotiator<DataConnectionEvents, this>;
	readonly label: string;
	abstract readonly serialization: string;
	readonly reliable: boolean;

	// public type: ConnectionType.Data;
	public get type() {
		return ConnectionType.Data;
	}

	dataChannel: RTCDataChannel;

	constructor(peerId: string, provider: Peer, options: any) {
		super(peerId, provider, options);

		this.connectionId =
			this.options.connectionId ||
			DataConnection.ID_PREFIX + util.randomToken();

		this.label = this.options.label || this.connectionId;
		this.reliable = !!this.options.reliable;

		this._negotiator = new Negotiator(this);

		this._negotiator.startConnection(
			this.options._payload || {
				originator: true,
				reliable: this.reliable,
			},
		);
	}

	/** Called by the Negotiator when the DataChannel is ready. */
	initialize(dc: RTCDataChannel): void {
		this.dataChannel = dc;

		this.dataChannel.onopen = () => {
			logger.log(`DC#${this.connectionId} dc connection success`);
			this._open = true;
			this.emit("open");
		};

		this.dataChannel.onmessage = (e) => {
			logger.log(`DC#${this.connectionId} dc onmessage:`, e.data);
			// this._handleDataMessage(e);
		};

		this.dataChannel.onclose = () => {
			logger.log(`DC#${this.connectionId} dc closed for:`, this.peer);
			this.close();
		};
	}

	/**
	 * Exposed functionality for users.
	 */

	/** Allows user to close connection. */
	close(): void {
		if (this._negotiator) {
			this._negotiator.cleanup();
			this._negotiator = null;
		}

		if (this.provider) {
			this.provider._removeConnection(this);

			this.provider = null;
		}

		if (this.dataChannel) {
			this.dataChannel.onopen = null;
			this.dataChannel.onmessage = null;
			this.dataChannel.onclose = null;
			this.dataChannel = null;
		}

		if (!this.open) {
			return;
		}

		this._open = false;

		super.emit("close");
	}

	protected abstract _send(data: any, chunked: boolean): void;

	/** Allows user to send data. */
	public send(data: any, chunked = false) {
		if (!this.open) {
			super.emit(
				"error",
				new Error(
					"Connection is not open. You should listen for the `open` event before sending messages.",
				),
			);
			return;
		}
		return this._send(data, chunked);
	}

	async handleMessage(message: ServerMessage) {
		const payload = message.payload;

		switch (message.type) {
			case ServerMessageType.Answer:
				await this._negotiator.handleSDP(message.type, payload.sdp);
				break;
			case ServerMessageType.Candidate:
				await this._negotiator.handleCandidate(payload.candidate);
				break;
			default:
				logger.warn(
					"Unrecognized message type:",
					message.type,
					"from peer:",
					this.peer,
				);
				break;
		}
	}
}
