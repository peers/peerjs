import { util } from './util';
import { Peer } from './peer';

export const peerjs = {
  Peer,
  util,
};

export default Peer;

if (typeof window !== 'undefined') {
  (window as any).peerjs = peerjs;
  /** @deprecated Should use peerjs namespace */
  (window as any).Peer = Peer;
}
