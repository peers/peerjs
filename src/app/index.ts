import { NetEvents } from '../net/types';

interface DOMElementsType {
  peerId: HTMLElement;
}

export default class App {
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
