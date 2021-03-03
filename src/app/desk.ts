import App from './index';
import Net from '../net/index';

const RELAYS = [{ host: 'localhost', port: 9000, path: '/k' }];

main(document, console);

function main(document: Document, console: Console) {
  const PEER_ID = document.getElementById('PEER_ID');

  const app = new App({ peerId: PEER_ID });
  const net = new Net(app.emit, RELAYS);
}
