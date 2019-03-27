import { util } from "./util";
import { MediaConnection } from "./mediaconnection";
import { DataConnection } from "./dataconnection";
import { Peer } from "./peer";

export const peerjs = {
  MediaConnection,
  DataConnection,
  Peer,
  util
};

export default Peer;

(<any>window).peerjs = peerjs;
