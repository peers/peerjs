import { EventEmitter } from "eventemitter3";
import logger from "./logger";
import {
	SocketEventType,
	ServerMessageType,
	type ConnectionType,
} from "./enums";
import type { PeerJSOption } from "../index";

type MessageData = {
	type: ServerMessageType;
	dst: string;
	payload: {
		type: ConnectionType;
		connectionId: string;
	} & Record<string, any>;
};
/**
 * An abstraction on top of WebSockets to provide the fastest
 * possible connection for peers.
 */
export class Socket extends EventEmitter {
	private _disconnected: boolean = true;
	private _id: string | null = null;
	private _messagesQueue: Array<MessageData> = [];
	private _socket?: WebSocket;
	private _wsPingTimer?: any;
	private readonly _baseUrl: string;

	private readonly pingInterval: number;
	private readonly WebSocketConstructor: typeof WebSocket;

	alive: boolean = false;

	private _destroyed = false;

	get messagesQueue(): ReadonlyArray<MessageData> {
		return this._messagesQueue;
	}

	get destroyed() {
		return this._destroyed;
	}

	constructor({
		secure,
		host,
		port,
		path,
		key,
		pingInterval = 5000,
		polyfills,
	}: PeerJSOption) {
		super();

		this.pingInterval = pingInterval;

		const wsProtocol = secure ? "wss://" : "ws://";

		this._baseUrl = wsProtocol + host + ":" + port + path + "peerjs?key=" + key;
		this.WebSocketConstructor = polyfills?.WebSocket ?? window.WebSocket;
	}

	start(id: string, token: string): void {
		if (this._destroyed) throw new Error("Socket was destroyed!");

		this._id = id;

		if (!!this._socket || !this._disconnected) {
			return;
		}

		const wsUrl = `${this._baseUrl}&id=${id}&token=${token}`;

		this._socket = new this.WebSocketConstructor(wsUrl);
		this._disconnected = false;

		this._socket.onmessage = (event) => {
			if (this._destroyed) return;

			let data;

			try {
				data = JSON.parse(event.data);
				logger.log("Server message received:", data);
			} catch (e) {
				logger.log("Invalid server message", event.data);
				return;
			}

			this.emit(SocketEventType.Message, data);
		};

		this._socket.onclose = (event) => {
			if (this._disconnected || this._destroyed) {
				return;
			}

			logger.log("Socket closed.", event);

			this._cleanup();
			this._disconnected = true;

			this.emit(SocketEventType.Disconnected);
		};

		// Take care of the queue of connections if necessary and make sure Peer knows
		// socket is open.
		this._socket.onopen = () => {
			if (this._disconnected || this._destroyed) {
				return;
			}

			logger.log("Socket open");

			this.emit(SocketEventType.Open);

			this._sendQueuedMessages();

			this._scheduleHeartbeat();
		};
	}

	private _scheduleHeartbeat(): void {
		this._wsPingTimer = setTimeout(() => {
			this._sendHeartbeat();
		}, this.pingInterval);
	}

	private _sendHeartbeat(): void {
		if (this._destroyed) return;

		if (!this._wsOpen()) {
			logger.log(`Cannot send heartbeat, because socket closed`);
			return;
		}

		const message = JSON.stringify({ type: ServerMessageType.Heartbeat });

		this._socket!.send(message);

		this._scheduleHeartbeat();
	}

	/** Is the websocket currently open? */
	private _wsOpen(): boolean {
		return !!this._socket && this._socket.readyState === 1;
	}

	/** Send queued messages. */
	private _sendQueuedMessages(): void {
		//Create copy of queue and clear it,
		//because send method push the message back to queue if something will go wrong
		const copiedQueue = [...this._messagesQueue];
		this._messagesQueue = [];

		for (const message of copiedQueue) {
			this.send(message);
		}

		if (copiedQueue.length > 0) {
			logger.log(`${copiedQueue.length} queued messages was sent`);
		}
	}

	/** Exposed send for DC & Peer. */
	send(data: MessageData): void {
		if (this._destroyed) throw new Error("Socket was destroyed!");

		if (!data.type) {
			this.emit(SocketEventType.Error, "Invalid message");
			return;
		}

		if (!this.alive) {
			return;
		}

		// If we didn't get an ID yet, we can't yet send anything so we should queue
		// up these messages.
		if (this._id == null || !this._wsOpen()) {
			this._messagesQueue.push(data);
			return;
		}

		const message = JSON.stringify(data);

		this._socket!.send(message);
	}

	close(): void {
		if (this._disconnected) {
			return;
		}

		this._cleanup();

		this._id = null;

		this._disconnected = true;
	}

	private _cleanup(): void {
		if (this._socket) {
			this._socket.onopen =
				this._socket.onmessage =
				this._socket.onclose =
					null;
			this._socket.close();
			this._socket = undefined;
		}

		clearTimeout(this._wsPingTimer!);
	}

	destroy() {
		if (this._destroyed) return;

		this.close();
		this._messagesQueue.length = 0;

		this._destroyed = true;
	}
}
