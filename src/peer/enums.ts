export enum ConnectionEventType {
  Open = "open",
  Stream = "stream",
  Data = "data",
  Close = "close",
  Error = "error",
  IceStateChanged = "iceStateChanged"
}

export enum ConnectionType {
  Data = "data",
  Media = "media"
}

export enum PeerEventType {
  Open = "open",
  Close = "close",
  Connection = "connection",
  Call = "call",
  Disconnected = "disconnected",
  Error = "error"
}

export enum PeerErrorType {
  BrowserIncompatible = "browser-incompatible",
  Disconnected = "disconnected",
  InvalidID = "invalid-id",
  InvalidKey = "invalid-key",
  Network = "network",
  PeerUnavailable = "peer-unavailable",
  SslUnavailable = "ssl-unavailable",
  ServerError = "server-error",
  SocketError = "socket-error",
  SocketClosed = "socket-closed",
  UnavailableID = "unavailable-id",
  WebRTC = "webrtc"
}

export enum SerializationType {
  Binary = "binary",
  BinaryUTF8 = "binary-utf8",
  JSON = "json"
}

export enum SocketEventType {
  Message = "message",
  Disconnected = "disconnected",
  Error = "error",
  Close = "close"
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
  Expire = "EXPIRE" // The offer sent to a peer has expired without response.

}