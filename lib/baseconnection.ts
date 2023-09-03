import type { Peer } from "./peer";
import type { ServerMessage } from "./servermessage";
import type { ConnectionType } from "./enums";
import { BaseConnectionErrorType } from "./enums";
import {
	EventEmitterWithError,
	type EventsWithError,
	PeerError,
} from "./peerError";
import type { ValidEventTypes } from "eventemitter3";

export interface BaseConnectionEvents<
	ErrorType extends string = BaseConnectionErrorType,
> extends EventsWithError<ErrorType> {
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
	error: (error: PeerError<`${ErrorType}`>) => void;
	iceStateChanged: (state: RTCIceConnectionState) => void;
}

export abstract class BaseConnection<
	SubClassEvents extends ValidEventTypes,
	ErrorType extends string = never,
> extends EventEmitterWithError<
	ErrorType | BaseConnectionErrorType,
	SubClassEvents & BaseConnectionEvents<BaseConnectionErrorType | ErrorType>
> {
	protected _open = false;

	/**
	 * Any type of metadata associated with the connection,
	 * passed in by whoever initiated the connection.
	 */
	readonly metadata: any;
	connectionId: string;

	peerConnection: RTCPeerConnection;
	dataChannel: RTCDataChannel;

	abstract get type(): ConnectionType;

	/**
	 * The optional label passed in or assigned by PeerJS when the connection was initiated.
	 */
	label: string;

	/**
	 * Whether the media connection is active (e.g. your call has been answered).
	 * You can check this if you want to set a maximum wait time for a one-sided call.
	 */
	get open() {
		return this._open;
	}

	protected constructor(
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

	/**
	 * @internal
	 */
	abstract handleMessage(message: ServerMessage): void;

	/**
	 * Called by the Negotiator when the DataChannel is ready.
	 * @internal
	 * */
	abstract _initializeDataChannel(dc: RTCDataChannel): void;
}
