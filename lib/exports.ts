import { util } from "./util";
import { Peer } from "./peer";

export type {
	PeerJSOption,
	PeerConnectOption,
	AnswerOption,
	CallOption,
} from "./optionInterfaces";
export type { UtilSupportsObj } from "./util";
export type { DataConnection } from "./dataconnection/DataConnection";
export type { MediaConnection } from "./mediaconnection";
export type { LogLevel } from "./logger";
export type {
	ConnectionType,
	PeerErrorType,
	SerializationType,
	SocketEventType,
	ServerMessageType,
} from "./enums";

export { Peer, util };
export default Peer;
