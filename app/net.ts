import Peer from '../exports';
import { RelayConfig, NetEvents } from './types';

// Peer-to-Peer networking
export default class Net {
  peer: Object;
  connections: Array<any> = [];
  peerId?: string = undefined;
  emit: Function;
  // TODO: use secure persistant local storage
  messages: Array<Object> = [];

  constructor(emit: Function, relays: Array<RelayConfig>) {
    if (Peer) {
      // TODO: connect to all provided relays
      if (relays[0]) {
        this.peer = new Peer(relays[0]);
        this.emit = emit;

        /* method bindings */
        this.receiveMessage = this.receiveMessage.bind(this);
        this.add = this.add.bind(this);
        this.start = this.start.bind(this);
        this.connectRemotePeer = this.connectRemotePeer.bind(this);
        this.receiveMessage = this.receiveMessage.bind(this);
        this.sendMessage = this.sendMessage.bind(this);

        this.start();
        return;
      }
      throw new Error('Invalid Relay Option');
    }
    throw new Error('Invalid Peer Object');
  }

  // start network
  start() {
    const self = this;

    // Connected to Peer network
    self.peer.on('open', (peerId) => {
      self.peerId = peerId;
      self.emit(NetEvents.UpdatePeerId, self.peerId);
    });

    // Receive
    self.peer.on('connection', (conn) => {
      conn.on('data', (data) => {
        self.receiveMessage(data);
      });

      conn.on('open', () => {
        self.add(conn);
      });

      conn.on('error', (err: any) => {
        self.emit(NetEvents.Error, err);
      });
    });

    self.peer.on('error', (err: any) => {
      self.emit(NetEvents.Error, err);
    });
  }

  connectRemotePeer(remotePeerAddress: string) {
    const self = this;
    const conn = self.peer.connect(remotePeerAddress);

    conn.on('open', () => {
      self.add(conn);
    });

    conn.on('data', (data: any) => {
      self.receiveMessage(data);
    });

    conn.on('error', (err: any) => {
      self.emit(NetEvents.Error, err);
    });
  }
  // Add new Peer-to-Peer connection
  add(conn: any) {
    const self = this;
    if (!self.connExists(conn)) {
      self.connections.push(conn);
      self.emit(NetEvents.SetConnections, self.connections);
    }
  }

  // Check if Peer-to-Peer connection exists
  connExists(conn: any) {
    const self = this;

    for (var i = 0; i < self.connections.length; i++) {
      if (conn.peer === self.connections[i].peer) {
        return true;
      }
    }
    return false;
  }

  // Receive new message
  receiveMessage(data: any) {
    this.messages.push(data);
    this.emit(NetEvents.MsgReceived, data);
  }

  // Send a message
  sendMessage(message: any, receiver: any) {
    const self = this;
    for (var i = 0; i < self.connections.length; i++) {
      if (self.connections[i].peer === receiver) {
        self.messages.push(message);
        self.connections[i].send(message);
        return;
      }
    }
    // TODO: emit MESSAGE_SENT event
  }
}
