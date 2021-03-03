import { util } from './peer/util';
import { Peer } from './peer/peer';
import Net from './app/net';

export const peerjs = {
  Peer,
  util,
  Net,
};

export default Peer;

(<any>window).peerjs = peerjs;
/** @deprecated Should use peerjs namespace */
(<any>window).Peer = Peer;
