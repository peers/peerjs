import { EventEmitter } from "eventemitter3";
import { Peer } from "./peer";
import { ServerMessage } from "./servermessage";
import { ConnectionType } from "./enums";

export abstract class BaseConnection extends EventEmitter {
  protected _open = false;

  readonly sessionEncryptionKey: string;
  readonly sharedSecret: string;
  readonly metadata: any;
  connectionId: string;

  peerConnection: RTCPeerConnection;

  abstract get type(): ConnectionType;

  get open() {
    return this._open;
  }

  constructor(readonly peer: string, public provider: Peer, readonly options: any) {
    super();
    this.metadata = options.metadata;  
    if (this.options.sessionEncryptionKey){
      this.sessionEncryptionKey = this.options.sessionEncryptionKey;
      this.sharedSecret = this.options.sharedSecret;
    }
  }

  abstract close(): void;

  abstract handleMessage(message: ServerMessage): void;
}
