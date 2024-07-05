import { EventEmitter } from "eventemitter3";
import logger from "./logger";
import { ServerMessageType, SocketEventType } from "./enums";
import { version } from "../package.json";
import { PeerOptions } from "./peer";
import { io, Socket as IOSocket } from "socket.io-client";

/**
 * An abstraction on top of WebSockets to provide fastest
 * possible connection for peers.
 */
export class Socket extends EventEmitter {
	private _disconnected: boolean = true;
	private _id?: string;
	private _messagesQueue: Array<object> = [];
	private _websocket?: WebSocket
	_socketio?:IOSocket
	private _wsPingTimer?: any;
	private readonly _baseWebSocketUrl: string;
	private readonly _baseSocketioUrl: string
	private _baseSocketioQueryParams: Object
	private _clientType:PeerOptions["clientType"]="websocket"

	constructor(
		secure: any,
		host: string,
		port: number,
		path: string,
		key: string,
		clientType:PeerOptions["clientType"],
		private readonly pingInterval: number = 5000,
	) {
		super();

		const wsProtocol = secure ? "wss://" : "ws://";

		this._baseWebSocketUrl = wsProtocol + host + ":" + port + path + "peerjs?key=" + key;
		this._baseSocketioUrl =wsProtocol + host + ":" + port;
		this._baseSocketioQueryParams = {
			key
		}
		this._clientType = clientType
	}

	async start(id: string, token: string) {
		return new Promise<void>((resolve,reject)=>{
			let isResolved = false;
			if (this._clientType === "websocket") {
				resolve();
				this._id = id;
			}

			if (!!this._websocket || !this._disconnected || !!this._socketio) {
				return;
			}


			if (this._clientType === "websocket") {
				const wsUrl = `${this._baseWebSocketUrl}&id=${id}&token=${token}`;
				this._websocket = new WebSocket(wsUrl + "&version=" + version);
			} else {
				this._socketio = io(this._baseSocketioUrl+"/peerjs",
					{
						query:{
							...this._baseSocketioQueryParams,
							token,version
						}

					}
				);

			}
			this._disconnected = false;

			if (this._clientType === "websocket") {
				this._websocket.onmessage = (event) => {
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

				this._websocket.onclose = (event) => {
					if (this._disconnected) {
						return;
					}

					logger.log("Socket closed.", event);

					this._cleanup();
					this._disconnected = true;
					this.emit(SocketEventType.Disconnected);
					if (!isResolved) {
						reject('WebSocket connection closed');
						isResolved = true;
					}
				};

				// Take care of the queue of connections if necessary and make sure Peer knows
				// socket is open.
				this._websocket.onopen = () => {
					if (this._disconnected) {
						return;
					}

					this._sendQueuedMessages();
					logger.log("Socket open");
					this._scheduleHeartbeat();
					if (!isResolved) {
						resolve();
						isResolved = true;
					}
				};
			}
			else {
				this._socketio.on("message", (data: any) => {
					try {
						logger.log("Server message received:", data);
					} catch (e) {
						logger.log("Invalid server message", data);
						return;
					}

					this.emit(SocketEventType.Message, data);
				});

				this._socketio.on("disconnect", (reason: string) => {
					if (this._disconnected) {
						return;
					}

					logger.log("Socket closed.", reason);
					this._cleanup();
					this._disconnected = true;
					this.emit(SocketEventType.Disconnected);
					if (!isResolved) {
						reject(reason);
						isResolved = true;
					}
				});

				this._socketio.on("connect", () => {
					this._id = this._socketio.id
					if (this._disconnected) {
						return;
					}

					this._sendQueuedMessages();

					logger.log("Socket open");
					if (!isResolved) {
						resolve();
						isResolved = true;
					}
				});

			}
		});
	}

	private _scheduleHeartbeat(): void {
		this._wsPingTimer = setTimeout(() => {
			this._sendHeartbeat();
		}, this.pingInterval);
	}

	private _sendHeartbeat(): void {
		if (!this._wsOpen()) {
			logger.log(`Cannot send heartbeat, because socket closed`);
			return;
		}

    const message = { type: ServerMessageType.Heartbeat };

    if (this._clientType === "websocket") {///////////// add //////////
      this._websocket.send(JSON.stringify(message));
			this._scheduleHeartbeat();
    }


	}

	/** Is the websocket currently open? */
	private _wsOpen(): boolean {
		if (this._clientType === "websocket") {
			return !!this._websocket && this._websocket.readyState === WebSocket.OPEN;
		}
		else{
			return !!this._socketio && this._socketio.connected;
		}
	}

	/** Send queued messages. */
	private _sendQueuedMessages(): void {
		//Create copy of queue and clear it,
		//because send method push the message back to queue if smth will go wrong
		const copiedQueue = [...this._messagesQueue];
		this._messagesQueue = [];

		for (const message of copiedQueue) {
			this.send(message);
		}
	}

	/** Exposed send for DC & Peer. */
	send(data: any): void {
		if (this._disconnected) {
			return;
		}

		// If we didn't get an ID yet, we can't yet send anything so we should queue
		// up these messages.
		if (!this._id) {
			this._messagesQueue.push(data);
			return;
		}

		if (!data.type) {
			this.emit(SocketEventType.Error, "Invalid message");
			return;
		}

		if (!this._wsOpen()) {
			return;
		}

		if (this._clientType === "websocket") {
			const message = JSON.stringify(data);
			this._websocket.send(message);
    } else {
      this._socketio.emit("message", data);
    }
	}

	close(): void {
		if (this._disconnected) {
			return;
		}

		this._cleanup();

		this._disconnected = true;
	}

	private _cleanup(): void {
		if (this._clientType === "websocket"){
			if (this._websocket) {
				this._websocket.onopen =
					this._websocket.onmessage =
					this._websocket.onclose =
						null;
				this._websocket.close();
				this._websocket = undefined;
			}
		}
		else{
			if(this._socketio){
        this._socketio.off("connect");
        this._socketio.off("message");
        this._socketio.off("disconnect");
        this._socketio.close();
				this._socketio  = undefined
			}
		}


		clearTimeout(this._wsPingTimer!);
	}
}
