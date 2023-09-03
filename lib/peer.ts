import { util } from "./util";
import logger, { LogLevel } from "./logger";
import { Socket } from "./socket";
import { MediaConnection } from "./mediaconnection";
import type { DataConnection } from "./dataconnection/DataConnection";
import {
	ConnectionType,
	PeerErrorType,
	ServerMessageType,
	SocketEventType,
} from "./enums";
import type { ServerMessage } from "./servermessage";
import { API } from "./api";
import type {
	CallOption,
	PeerConnectOption,
	PeerJSOption,
} from "./optionInterfaces";
import { BinaryPack } from "./dataconnection/BufferedConnection/BinaryPack";
import { Raw } from "./dataconnection/BufferedConnection/Raw";
import { Json } from "./dataconnection/BufferedConnection/Json";

import { EventEmitterWithError, PeerError } from "./peerError";

class PeerOptions implements PeerJSOption {
	/**
	 * Prints log messages depending on the debug level passed in.
	 */
	debug?: LogLevel;
	/**
	 * Server host. Defaults to `0.peerjs.com`.
	 * Also accepts `'/'` to signify relative hostname.
	 */
	host?: string;
	/**
	 * Server port. Defaults to `443`.
	 */
	port?: number;
	/**
	 * The path where your self-hosted PeerServer is running. Defaults to `'/'`
	 */
	path?: string;
	/**
	 * API key for the PeerServer.
	 * This is not used anymore.
	 * @deprecated
	 */
	key?: string;
	token?: string;
	/**
	 * Configuration hash passed to RTCPeerConnection.
	 * This hash contains any custom ICE/TURN server configuration.
	 *
	 * Defaults to {@apilink util.defaultConfig}
	 */
	config?: any;
	/**
	 * Set to true `true` if you're using TLS.
	 * :::danger
	 * If possible *always use TLS*
	 * :::
	 */
	secure?: boolean;
	pingInterval?: number;
	referrerPolicy?: ReferrerPolicy;
	logFunction?: (logLevel: LogLevel, ...rest: any[]) => void;
	serializers?: SerializerMapping;
}

export { type PeerOptions };

export interface SerializerMapping {
	[key: string]: new (
		peerId: string,
		provider: Peer,
		options: any,
	) => DataConnection;
}

export interface PeerEvents {
	/**
	 * Emitted when a connection to the PeerServer is established.
	 *
	 * You may use the peer before this is emitted, but messages to the server will be queued. <code>id</code> is the brokering ID of the peer (which was either provided in the constructor or assigned by the server).<span class='tip'>You should not wait for this event before connecting to other peers if connection speed is important.</span>
	 */
	open: (id: string) => void;
	/**
	 * Emitted when a new data connection is established from a remote peer.
	 */
	connection: (dataConnection: DataConnection) => void;
	/**
	 * Emitted when a remote peer attempts to call you.
	 */
	call: (mediaConnection: MediaConnection) => void;
	/**
	 * Emitted when the peer is destroyed and can no longer accept or create any new connections.
	 */
	close: () => void;
	/**
	 * Emitted when the peer is disconnected from the signalling server
	 */
	disconnected: (currentId: string) => void;
	/**
	 * Errors on the peer are almost always fatal and will destroy the peer.
	 *
	 * Errors from the underlying socket and PeerConnections are forwarded here.
	 */
	error: (error: PeerError<`${PeerErrorType}`>) => void;
}
/**
 * A peer who can initiate connections with other peers.
 */
export class Peer extends EventEmitterWithError<PeerErrorType, PeerEvents> {
	private static readonly DEFAULT_KEY = "peerjs";

	protected readonly _serializers: SerializerMapping = {
		raw: Raw,
		json: Json,
		binary: BinaryPack,
		"binary-utf8": BinaryPack,

		default: BinaryPack,
	};
	private readonly _options: PeerOptions;
	private readonly _api: API;
	private readonly _socket: Socket;

	private _id: string | null = null;
	private _lastServerId: string | null = null;

	// States.
	private _destroyed = false; // Connections have been killed
	private _disconnected = false; // Connection to PeerServer killed but P2P connections still active
	private _open = false; // Sockets and such are not yet open.
	private readonly _connections: Map<
		string,
		(DataConnection | MediaConnection)[]
	> = new Map(); // All connections for this peer.
	private readonly _lostMessages: Map<string, ServerMessage[]> = new Map(); // src => [list of messages]
	/**
	 * The brokering ID of this peer
	 *
	 * If no ID was specified in {@apilink Peer | the constructor},
	 * this will be `undefined` until the {@apilink PeerEvents | `open`} event is emitted.
	 */
	get id() {
		return this._id;
	}

	get options() {
		return this._options;
	}

	get open() {
		return this._open;
	}

	/**
	 * @internal
	 */
	get socket() {
		return this._socket;
	}

	/**
	 * A hash of all connections associated with this peer, keyed by the remote peer's ID.
	 * @deprecated
	 * Return type will change from Object to Map<string,[]>
	 */
	get connections(): Object {
		const plainConnections = Object.create(null);

		for (const [k, v] of this._connections) {
			plainConnections[k] = v;
		}

		return plainConnections;
	}

	/**
	 * true if this peer and all of its connections can no longer be used.
	 */
	get destroyed() {
		return this._destroyed;
	}
	/**
	 * false if there is an active connection to the PeerServer.
	 */
	get disconnected() {
		return this._disconnected;
	}

	/**
	 * A peer can connect to other peers and listen for connections.
	 */
	constructor();

	/**
	 * A peer can connect to other peers and listen for connections.
	 * @param options for specifying details about PeerServer
	 */
	constructor(options: PeerOptions);

	/**
	 * A peer can connect to other peers and listen for connections.
	 * @param id Other peers can connect to this peer using the provided ID.
	 *     If no ID is given, one will be generated by the brokering server.
	 * The ID must start and end with an alphanumeric character (lower or upper case character or a digit). In the middle of the ID spaces, dashes (-) and underscores (_) are allowed. Use {@apilink PeerOptions.metadata } to send identifying information.
	 * @param options for specifying details about PeerServer
	 */
	constructor(id: string, options?: PeerOptions);

	constructor(id?: string | PeerOptions, options?: PeerOptions) {
		super();

		let userId: string | undefined;

		// Deal with overloading
		if (id && id.constructor == Object) {
			options = id as PeerOptions;
		} else if (id) {
			userId = id.toString();
		}

		// Configurize options
		options = {
			debug: 0, // 1: Errors, 2: Warnings, 3: All logs
			host: util.CLOUD_HOST,
			port: util.CLOUD_PORT,
			path: "/",
			key: Peer.DEFAULT_KEY,
			token: util.randomToken(),
			config: util.defaultConfig,
			referrerPolicy: "strict-origin-when-cross-origin",
			serializers: {},
			...options,
		};
		this._options = options;
		this._serializers = { ...this._serializers, ...this.options.serializers };

		// Detect relative URL host.
		if (this._options.host === "/") {
			this._options.host = window.location.hostname;
		}

		// Set path correctly.
		if (this._options.path) {
			if (this._options.path[0] !== "/") {
				this._options.path = "/" + this._options.path;
			}
			if (this._options.path[this._options.path.length - 1] !== "/") {
				this._options.path += "/";
			}
		}

		// Set whether we use SSL to same as current host
		if (
			this._options.secure === undefined &&
			this._options.host !== util.CLOUD_HOST
		) {
			this._options.secure = util.isSecure();
		} else if (this._options.host == util.CLOUD_HOST) {
			this._options.secure = true;
		}
		// Set a custom log function if present
		if (this._options.logFunction) {
			logger.setLogFunction(this._options.logFunction);
		}

		logger.logLevel = this._options.debug || 0;

		this._api = new API(options);
		this._socket = this._createServerConnection();

		// Sanity checks
		// Ensure WebRTC supported
		if (!util.supports.audioVideo && !util.supports.data) {
			this._delayedAbort(
				PeerErrorType.BrowserIncompatible,
				"The current browser does not support WebRTC",
			);
			return;
		}

		// Ensure alphanumeric id
		if (!!userId && !util.validateId(userId)) {
			this._delayedAbort(PeerErrorType.InvalidID, `ID "${userId}" is invalid`);
			return;
		}

		if (userId) {
			this._initialize(userId);
		} else {
			this._api
				.retrieveId()
				.then((id) => this._initialize(id))
				.catch((error) => this._abort(PeerErrorType.ServerError, error));
		}
	}

	private _createServerConnection(): Socket {
		const socket = new Socket(
			this._options.secure,
			this._options.host!,
			this._options.port!,
			this._options.path!,
			this._options.key!,
			this._options.pingInterval,
		);

		socket.on(SocketEventType.Message, (data: ServerMessage) => {
			this._handleMessage(data);
		});

		socket.on(SocketEventType.Error, (error: string) => {
			this._abort(PeerErrorType.SocketError, error);
		});

		socket.on(SocketEventType.Disconnected, () => {
			if (this.disconnected) {
				return;
			}

			this.emitError(PeerErrorType.Network, "Lost connection to server.");
			this.disconnect();
		});

		socket.on(SocketEventType.Close, () => {
			if (this.disconnected) {
				return;
			}

			this._abort(
				PeerErrorType.SocketClosed,
				"Underlying socket is already closed.",
			);
		});

		return socket;
	}

	/** Initialize a connection with the server. */
	private _initialize(id: string): void {
		this._id = id;
		this.socket.start(id, this._options.token!);
	}

	/** Handles messages from the server. */
	private _handleMessage(message: ServerMessage): void {
		const type = message.type;
		const payload = message.payload;
		const peerId = message.src;

		switch (type) {
			case ServerMessageType.Open: // The connection to the server is open.
				this._lastServerId = this.id;
				this._open = true;
				this.emit("open", this.id);
				break;
			case ServerMessageType.Error: // Server error.
				this._abort(PeerErrorType.ServerError, payload.msg);
				break;
			case ServerMessageType.IdTaken: // The selected ID is taken.
				this._abort(PeerErrorType.UnavailableID, `ID "${this.id}" is taken`);
				break;
			case ServerMessageType.InvalidKey: // The given API key cannot be found.
				this._abort(
					PeerErrorType.InvalidKey,
					`API KEY "${this._options.key}" is invalid`,
				);
				break;
			case ServerMessageType.Leave: // Another peer has closed its connection to this peer.
				logger.log(`Received leave message from ${peerId}`);
				this._cleanupPeer(peerId);
				this._connections.delete(peerId);
				break;
			case ServerMessageType.Expire: // The offer sent to a peer has expired without response.
				this.emitError(
					PeerErrorType.PeerUnavailable,
					`Could not connect to peer ${peerId}`,
				);
				break;
			case ServerMessageType.Offer: {
				// we should consider switching this to CALL/CONNECT, but this is the least breaking option.
				const connectionId = payload.connectionId;
				let connection = this.getConnection(peerId, connectionId);

				if (connection) {
					connection.close();
					logger.warn(
						`Offer received for existing Connection ID:${connectionId}`,
					);
				}

				// Create a new connection.
				if (payload.type === ConnectionType.Media) {
					const mediaConnection = new MediaConnection(peerId, this, {
						connectionId: connectionId,
						_payload: payload,
						metadata: payload.metadata,
					});
					connection = mediaConnection;
					this._addConnection(peerId, connection);
					this.emit("call", mediaConnection);
				} else if (payload.type === ConnectionType.Data) {
					const dataConnection = new this._serializers[payload.serialization](
						peerId,
						this,
						{
							connectionId: connectionId,
							_payload: payload,
							metadata: payload.metadata,
							label: payload.label,
							serialization: payload.serialization,
							reliable: payload.reliable,
						},
					);
					connection = dataConnection;

					this._addConnection(peerId, connection);
					this.emit("connection", dataConnection);
				} else {
					logger.warn(`Received malformed connection type:${payload.type}`);
					return;
				}

				// Find messages.
				const messages = this._getMessages(connectionId);
				for (const message of messages) {
					connection.handleMessage(message);
				}

				break;
			}
			default: {
				if (!payload) {
					logger.warn(
						`You received a malformed message from ${peerId} of type ${type}`,
					);
					return;
				}

				const connectionId = payload.connectionId;
				const connection = this.getConnection(peerId, connectionId);

				if (connection && connection.peerConnection) {
					// Pass it on.
					connection.handleMessage(message);
				} else if (connectionId) {
					// Store for possible later use
					this._storeMessage(connectionId, message);
				} else {
					logger.warn("You received an unrecognized message:", message);
				}
				break;
			}
		}
	}

	/** Stores messages without a set up connection, to be claimed later. */
	private _storeMessage(connectionId: string, message: ServerMessage): void {
		if (!this._lostMessages.has(connectionId)) {
			this._lostMessages.set(connectionId, []);
		}

		this._lostMessages.get(connectionId).push(message);
	}

	/**
	 * Retrieve messages from lost message store
	 * @internal
	 */
	//TODO Change it to private
	public _getMessages(connectionId: string): ServerMessage[] {
		const messages = this._lostMessages.get(connectionId);

		if (messages) {
			this._lostMessages.delete(connectionId);
			return messages;
		}

		return [];
	}

	/**
	 * Connects to the remote peer specified by id and returns a data connection.
	 * @param peer The brokering ID of the remote peer (their {@apilink Peer.id}).
	 * @param options for specifying details about Peer Connection
	 */
	connect(peer: string, options: PeerConnectOption = {}): DataConnection {
		options = {
			serialization: "default",
			...options,
		};
		if (this.disconnected) {
			logger.warn(
				"You cannot connect to a new Peer because you called " +
					".disconnect() on this Peer and ended your connection with the " +
					"server. You can create a new Peer to reconnect, or call reconnect " +
					"on this peer if you believe its ID to still be available.",
			);
			this.emitError(
				PeerErrorType.Disconnected,
				"Cannot connect to new Peer after disconnecting from server.",
			);
			return;
		}

		const dataConnection = new this._serializers[options.serialization](
			peer,
			this,
			options,
		);
		this._addConnection(peer, dataConnection);
		return dataConnection;
	}

	/**
	 * Calls the remote peer specified by id and returns a media connection.
	 * @param peer The brokering ID of the remote peer (their peer.id).
	 * @param stream The caller's media stream
	 * @param options Metadata associated with the connection, passed in by whoever initiated the connection.
	 */
	call(
		peer: string,
		stream: MediaStream,
		options: CallOption = {},
	): MediaConnection {
		if (this.disconnected) {
			logger.warn(
				"You cannot connect to a new Peer because you called " +
					".disconnect() on this Peer and ended your connection with the " +
					"server. You can create a new Peer to reconnect.",
			);
			this.emitError(
				PeerErrorType.Disconnected,
				"Cannot connect to new Peer after disconnecting from server.",
			);
			return;
		}

		if (!stream) {
			logger.error(
				"To call a peer, you must provide a stream from your browser's `getUserMedia`.",
			);
			return;
		}

		const mediaConnection = new MediaConnection(peer, this, {
			...options,
			_stream: stream,
		});
		this._addConnection(peer, mediaConnection);
		return mediaConnection;
	}

	/** Add a data/media connection to this peer. */
	private _addConnection(
		peerId: string,
		connection: MediaConnection | DataConnection,
	): void {
		logger.log(
			`add connection ${connection.type}:${connection.connectionId} to peerId:${peerId}`,
		);

		if (!this._connections.has(peerId)) {
			this._connections.set(peerId, []);
		}
		this._connections.get(peerId).push(connection);
	}

	//TODO should be private
	_removeConnection(connection: DataConnection | MediaConnection): void {
		const connections = this._connections.get(connection.peer);

		if (connections) {
			const index = connections.indexOf(connection);

			if (index !== -1) {
				connections.splice(index, 1);
			}
		}

		//remove from lost messages
		this._lostMessages.delete(connection.connectionId);
	}

	/** Retrieve a data/media connection for this peer. */
	getConnection(
		peerId: string,
		connectionId: string,
	): null | DataConnection | MediaConnection {
		const connections = this._connections.get(peerId);
		if (!connections) {
			return null;
		}

		for (const connection of connections) {
			if (connection.connectionId === connectionId) {
				return connection;
			}
		}

		return null;
	}

	private _delayedAbort(type: PeerErrorType, message: string | Error): void {
		setTimeout(() => {
			this._abort(type, message);
		}, 0);
	}

	/**
	 * Emits an error message and destroys the Peer.
	 * The Peer is not destroyed if it's in a disconnected state, in which case
	 * it retains its disconnected state and its existing connections.
	 */
	private _abort(type: PeerErrorType, message: string | Error): void {
		logger.error("Aborting!");

		this.emitError(type, message);

		if (!this._lastServerId) {
			this.destroy();
		} else {
			this.disconnect();
		}
	}

	/**
	 * Destroys the Peer: closes all active connections as well as the connection
	 * to the server.
	 *
	 * :::caution
	 * This cannot be undone; the respective peer object will no longer be able
	 * to create or receive any connections, its ID will be forfeited on the server,
	 * and all of its data and media connections will be closed.
	 * :::
	 */
	destroy(): void {
		if (this.destroyed) {
			return;
		}

		logger.log(`Destroy peer with ID:${this.id}`);

		this.disconnect();
		this._cleanup();

		this._destroyed = true;

		this.emit("close");
	}

	/** Disconnects every connection on this peer. */
	private _cleanup(): void {
		for (const peerId of this._connections.keys()) {
			this._cleanupPeer(peerId);
			this._connections.delete(peerId);
		}

		this.socket.removeAllListeners();
	}

	/** Closes all connections to this peer. */
	private _cleanupPeer(peerId: string): void {
		const connections = this._connections.get(peerId);

		if (!connections) return;

		for (const connection of connections) {
			connection.close();
		}
	}

	/**
	 * Disconnects the Peer's connection to the PeerServer. Does not close any
	 *  active connections.
	 * Warning: The peer can no longer create or accept connections after being
	 *  disconnected. It also cannot reconnect to the server.
	 */
	disconnect(): void {
		if (this.disconnected) {
			return;
		}

		const currentId = this.id;

		logger.log(`Disconnect peer with ID:${currentId}`);

		this._disconnected = true;
		this._open = false;

		this.socket.close();

		this._lastServerId = currentId;
		this._id = null;

		this.emit("disconnected", currentId);
	}

	/** Attempts to reconnect with the same ID.
	 *
	 * Only {@apilink Peer.disconnect | disconnected peers} can be reconnected.
	 * Destroyed peers cannot be reconnected.
	 * If the connection fails (as an example, if the peer's old ID is now taken),
	 * the peer's existing connections will not close, but any associated errors events will fire.
	 */
	reconnect(): void {
		if (this.disconnected && !this.destroyed) {
			logger.log(
				`Attempting reconnection to server with ID ${this._lastServerId}`,
			);
			this._disconnected = false;
			this._initialize(this._lastServerId!);
		} else if (this.destroyed) {
			throw new Error(
				"This peer cannot reconnect to the server. It has already been destroyed.",
			);
		} else if (!this.disconnected && !this.open) {
			// Do nothing. We're still connecting the first time.
			logger.error(
				"In a hurry? We're still trying to make the initial connection!",
			);
		} else {
			throw new Error(
				`Peer ${this.id} cannot reconnect because it is not disconnected from the server!`,
			);
		}
	}

	/**
	 * Get a list of available peer IDs. If you're running your own server, you'll
	 * want to set allow_discovery: true in the PeerServer options. If you're using
	 * the cloud server, email team@peerjs.com to get the functionality enabled for
	 * your key.
	 */
	listAllPeers(cb = (_: any[]) => {}): void {
		this._api
			.listAllPeers()
			.then((peers) => cb(peers))
			.catch((error) => this._abort(PeerErrorType.ServerError, error));
	}
}
