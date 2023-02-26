import { EventEmitter, ValidEventTypes } from "eventemitter3";
import { Peer } from "./peer";
import { ServerMessage } from "./servermessage";
import { ConnectionType } from "./enums";

export type BaseConnectionEvents = {
	/**
	 * Emitted when either you or the remote peer closes the connection.
	 *
	 * ```ts
	 * connection.on('close', () => { ... });
	 * ```
	 */
	close: () => void;
	/**
	 * ```ts
	 * connection.on('error', (error) => { ... });
	 * ```
	 */
	error: (error: Error) => void;
	iceStateChanged: (state: RTCIceConnectionState) => void;
};

export abstract class BaseConnection<
	T extends ValidEventTypes,
> extends EventEmitter<T & BaseConnectionEvents> {
	protected _open = false;

	/**
	 * Any type of metadata associated with the connection,
	 * passed in by whoever initiated the connection.
	 */
	readonly metadata: any;
	connectionId: string;

	peerConnection: RTCPeerConnection;

	abstract get type(): ConnectionType;

	/**
	 * Whether the media connection is active (e.g. your call has been answered).
	 * You can check this if you want to set a maximum wait time for a one-sided call.
	 */
	get open() {
		return this._open;
	}

	constructor(
		/**
		 * The ID of the peer on the other end of this connection.
		 */
		readonly peer: string,
		public provider: Peer,
		readonly options: any,
	) {
		super();

		this.metadata = options.metadata;
	}

	abstract close(): void;

	abstract handleMessage(message: ServerMessage): void;
}
