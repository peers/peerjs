export enum ConnectionType {
	Data = "data",
	Media = "media",
}

export enum PeerErrorType {
	/**
	 * The client's browser does not support some or all WebRTC features that you are trying to use.
	 */
	BrowserIncompatible = "browser-incompatible",
	/**
	 * You've already disconnected this peer from the server and can no longer make any new connections on it.
	 */
	Disconnected = "disconnected",
	/**
	 * The ID passed into the Peer constructor contains illegal characters.
	 */
	InvalidID = "invalid-id",
	/**
	 * The API key passed into the Peer constructor contains illegal characters or is not in the system (cloud server only).
	 */
	InvalidKey = "invalid-key",
	/**
	 * Lost or cannot establish a connection to the signalling server.
	 */
	Network = "network",
	/**
	 * The peer you're trying to connect to does not exist.
	 */
	PeerUnavailable = "peer-unavailable",
	/**
	 * PeerJS is being used securely, but the cloud server does not support SSL. Use a custom PeerServer.
	 */
	SslUnavailable = "ssl-unavailable",
	/**
	 * Unable to reach the server.
	 */
	ServerError = "server-error",
	/**
	 * An error from the underlying socket.
	 */
	SocketError = "socket-error",
	/**
	 * The underlying socket closed unexpectedly.
	 */
	SocketClosed = "socket-closed",
	/**
	 * The ID passed into the Peer constructor is already taken.
	 *
	 * :::caution
	 * This error is not fatal if your peer has open peer-to-peer connections.
	 * This can happen if you attempt to {@apilink Peer.reconnect} a peer that has been disconnected from the server,
	 * but its old ID has now been taken.
	 * :::
	 */
	UnavailableID = "unavailable-id",
	/**
	 * Native WebRTC errors.
	 */
	WebRTC = "webrtc",
}

export enum BaseConnectionErrorType {
	NegotiationFailed = "negotiation-failed",
	ConnectionClosed = "connection-closed",
}

export enum DataConnectionErrorType {
	NotOpenYet = "not-open-yet",
	MessageToBig = "message-too-big",
}

export enum SerializationType {
	Binary = "binary",
	BinaryUTF8 = "binary-utf8",
	JSON = "json",
	None = "raw",
}

export enum SocketEventType {
	Message = "message",
	Disconnected = "disconnected",
	Error = "error",
	Close = "close",
}

export enum ServerMessageType {
	Heartbeat = "HEARTBEAT",
	Candidate = "CANDIDATE",
	Offer = "OFFER",
	Answer = "ANSWER",
	Open = "OPEN", // The connection to the server is open.
	Error = "ERROR", // Server error.
	IdTaken = "ID-TAKEN", // The selected ID is taken.
	InvalidKey = "INVALID-KEY", // The given API key cannot be found.
	Leave = "LEAVE", // Another peer has closed its connection to this peer.
	Expire = "EXPIRE", // The offer sent to a peer has expired without response.
}
