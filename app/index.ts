import Net from './net';
import { NetEvents } from './types';
const RELAYS = [{ host: 'localhost', port: 9000, path: '/k' }];
const PEER_ID = document.getElementById('PEER_ID');

interface DOMElementsType {
  peerId: HTMLElement;
}

class Kwatafana {
  domElements: DOMElementsType;

  constructor(domElements: DOMElementsType) {
    this.domElements = domElements;
  }

  emit(event: NetEvents, data: any) {
    switch (event) {
      case NetEvents.SetConnections:
        console.log('Connection Has been established');
        break;
      default:
        console.log('Unknown event');
    }
  }
}

main(document, console);

function main(document: Document, console: Console) {
  const app = new Kwatafana({ peerId: PEER_ID });
  const net = new Net(app.emit, RELAYS);
}
