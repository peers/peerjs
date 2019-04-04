import { util } from "./util";
import { Peer } from "./peer";

export const peerjs = {
  Peer,
  util
};

export default Peer;

(<any>window).peerjs = peerjs;
/** @deprecated Should use peerjs namespace */
(<any>window).Peer = Peer;
