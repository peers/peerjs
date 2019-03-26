import { ServerMessageType } from "./enums";

export class ServerMessage {
  type: ServerMessageType;
  payload: any;
  src: string;
}
