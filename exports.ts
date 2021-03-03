import { util } from './peer/util';
import { Peer } from './peer/peer';

export const peerjs = {
  Peer,
  util,
};

export default Peer;

(<any>window).peerjs = peerjs;
/** @deprecated Should use peerjs namespace */
(<any>window).Peer = Peer;
