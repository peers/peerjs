import { Utils } from './utils';
import { Peer } from './peer';

export { Peer, Utils };

export default Peer;

if (typeof window !== 'undefined') {
  // @ts-expect-error
  window.Peer = Peer;
}
