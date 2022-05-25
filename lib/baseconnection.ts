import { EventEmitter, ValidEventTypes } from "eventemitter3";
import { Peer } from "./peer";
import { ServerMessage } from "./servermessage";
import { ConnectionType } from "./enums";

export type BaseConnectionEvents = {
	/**
	 * Emitted when either you or the remote peer closes the connection.
	 */
	close: () => void;
	error: (error: Error) => void;
	iceStateChanged: (state: RTCIceConnectionState) => void;
};

export abstract class BaseConnection<
	T extends ValidEventTypes,
> extends EventEmitter<T & BaseConnectionEvents> {
	protected _open = false;

	readonly metadata: any;
	connectionId: string;

	peerConnection: RTCPeerConnection;

	abstract get type(): ConnectionType;

	get open() {
		return this._open;
	}

	constructor(
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
