import { util } from "./util";
import { Peer } from "./peer";
import { webRTCAdapter } from "./adapter";
import { API } from "./api";
import { BaseConnection } from "./baseconnection";
import { DataConnection } from "./dataconnection";
import { EncodingQueue } from "./encodingQueue"
import Logger from "./logger";
import { MediaConnection } from "./mediaconnection";
import { Negatiator } from "./negotiator";
import { ServerMessage } from "./servermessage";
import { Socket } from "./socket";
import { Supports } from "./supports";

export const peerjs = {
  Peer,
  util,
  webRTCAdapter,
  API,
  BaseConnection,
  DataConnection,
  EncodingQueue,
  Logger,
  MediaConnection,
  Negatiator,
  ServerMessage,
  Socket,
  Supports
};

export default Peer;

(<any>window).peerjs = peerjs;
/** @deprecated Should use peerjs namespace */
(<any>window).Peer = Peer;
