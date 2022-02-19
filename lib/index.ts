import { Utils } from './utils';
import { Peer } from './peer';

export { Peer, Utils };

export default Peer;

if (typeof window === 'object') {
  // @ts-expect-error
  window.Peer = Peer;
}
