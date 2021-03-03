import { util } from './src/peer/util';
import { Peer } from './src/peer/peer';
import Net from './src/app/net';

export const peerjs = {
  Peer,
  util,
  Net,
};

export default Peer;

(<any>window).peerjs = peerjs;
/** @deprecated Should use peerjs namespace */
(<any>window).Peer = Peer;
