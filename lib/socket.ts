import { EventEmitter } from "eventemitter3";
import logger from "./logger";
import { SocketEventType, ServerMessageType } from "./enums";

/**
 * An abstraction on top of WebSockets to provide fastest
 * possible connection for peers.
 */
export class Socket extends EventEmitter {
  private _disconnected = false;
  private _id: string;
  private _wsUrl: string;
  private _socket: WebSocket;
  private _wsPingTimer: any;

  constructor(
    secure: any,
    host: string,
    port: number,
    path: string,
    key: string,
  ) {
    super();

    const wsProtocol = secure ? "wss://" : "ws://";

    this._wsUrl = wsProtocol + host + ":" + port + path + "peerjs?key=" + key;
  }

  start(id: string, token: string): void {
    this._id = id;
    this._wsUrl += "&id=" + id + "&token=" + token;
    this._startWebSocket();
  }

  /** Start up websocket communications. */
  private _startWebSocket(): void {
    if (this._socket) {
      return;
    }

    this._socket = new WebSocket(this._wsUrl);

    this._socket.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        logger.log("Invalid server message", event.data);
        return;
      }
      this.emit(SocketEventType.Message, data);
    };

    this._socket.onclose = (event) => {
      logger.log("Socket closed.", event);;
      this._disconnected = true;
      clearTimeout(this._wsPingTimer);
      this.emit(SocketEventType.Disconnected);
    };

    this._socket.onopen = () => {
      if (this._disconnected) return;
      logger.log("Socket open");

    };
  }

  /** Is the websocket currently open? */
  private _wsOpen(): boolean {
    return !!this._socket && this._socket.readyState == 1;
  }

  /** Exposed send for DC & Peer. */
  send(data: any): void {
    if (this._disconnected) {
      return;
    }

    if (!data.type) {
      this.emit(SocketEventType.Error, "Invalid message");
      return;
    }

    if (!this._wsOpen()) {
      return;
    }

    const message = JSON.stringify(data);
    this._socket.send(message);
  }

  close(): void {
    if (!this._disconnected && !!this._socket) {
      this._socket.close();
      this._disconnected = true;
      clearTimeout(this._wsPingTimer);
    }
  }
}
