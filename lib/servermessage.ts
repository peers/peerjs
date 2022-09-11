import type { ServerMessageType } from "./enums";

export interface ServerMessage {
	type: ServerMessageType;
	payload: any;
	src: string;
}
