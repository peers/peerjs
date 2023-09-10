import type { ServerMessageType } from "./enums";
import { ConnectionType } from "./enums";

export type OutgoingServerMessage = (
	| OfferMessage
	| AnswerMessage
	| CandidateMessage
	| HeartbeatMessage
) & { dst: string };

export type IncomingServerMessage =
	| OpenMessage
	| ErrorMessage
	| IdTakenMessage
	| InvalidKeyMessage
	| ((
			| AnswerMessage
			| OfferMessage
			| CandidateMessage
			| LeaveMessage
			| ExpireMessage
	  ) & { src: string });

interface ServerMessage<
	Type extends ServerMessageType,
	Payload extends object = never,
> {
	type: Type;
	payload: Payload;
}
interface Offer {
	sdp: RTCSessionDescriptionInit;
	type: ConnectionType;
	connectionId: string;
	metadata: unknown;
}
interface MediaConnectionOffer extends Offer {
	type: ConnectionType.Media;
}
interface DataConnectionOffer extends Offer {
	type: ConnectionType.Data;
	label: string;
	serialization: string;
	reliable: boolean;
}

interface OfferMessage
	extends ServerMessage<
		ServerMessageType.Offer,
		DataConnectionOffer | MediaConnectionOffer
	> {}
interface AnswerMessage
	extends ServerMessage<ServerMessageType.Answer, Omit<Offer, "metadata">> {}
export interface OpenMessage {
	type: ServerMessageType.Open;
	dst: string;
}
interface CandidateMessage
	extends ServerMessage<
		ServerMessageType.Candidate,
		{
			candidate: RTCIceCandidate;
			type: ConnectionType;
			connectionId: string;
		}
	> {}
interface LeaveMessage extends ServerMessage<ServerMessageType.Leave> {}
interface ExpireMessage extends ServerMessage<ServerMessageType.Expire> {}
interface ErrorMessage
	extends ServerMessage<
		ServerMessageType.Error,
		{
			msg: string;
		}
	> {}

interface HeartbeatMessage extends ServerMessage<ServerMessageType.Heartbeat> {}

interface IdTakenMessage extends ServerMessage<ServerMessageType.IdTaken> {}

interface InvalidKeyMessage
	extends ServerMessage<ServerMessageType.InvalidKey> {}
