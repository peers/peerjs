import { util } from "./util";
import { EventEmitter } from "eventemitter3";
import { SocketEventType } from "./enums";

class HttpRequest {
  index = 1;
  readonly buffer: number[] = [];
  previousRequest: HttpRequest;
  private _xmlHttpRequest = new XMLHttpRequest();

  private _onError = sender => { };
  private _onSuccess = sender => { };

  set onError(handler) {
    this._onError = handler;
  }

  set onSuccess(handler) {
    this._onSuccess = handler;
  }

  constructor(readonly streamIndex: number, private readonly _httpUrl: string) {
    const self = this;

    this._xmlHttpRequest.onerror = () => {
      self._onError(self);
    };

    this._xmlHttpRequest.onreadystatechange = () => {
      if (self.needsClearPreviousRequest()) {
        self.clearPreviousRequest();
      } else if (self.isSuccess()) {
        self._onSuccess(self);
      }
    };
  }

  send(): void {
    this._xmlHttpRequest.open(
      "post",
      this._httpUrl + "/id?i=" + this.streamIndex,
      true
    );
    this._xmlHttpRequest.send(null);
  }

  abort(): void {
    this._xmlHttpRequest.abort();
    this._xmlHttpRequest = null;
  }

  isSuccess(): boolean {
    return (
      this._xmlHttpRequest.readyState > 2 &&
      this._xmlHttpRequest.status === 200 &&
      !!this._xmlHttpRequest.responseText
    );
  }

  needsClearPreviousRequest(): boolean {
    return this._xmlHttpRequest.readyState === 2 && !!this.previousRequest;
  }

  clearPreviousRequest(): void {
    if (!this.previousRequest) return;

    this.previousRequest.abort();
    this.previousRequest = null;
  }

  getMessages(): string[] {
    return this._xmlHttpRequest.responseText.split("\n");
  }

  hasBufferedIndices(): boolean {
    return this.buffer.length > 0;
  }

  popBufferedIndex(): number {
    return this.buffer.shift();
  }

  pushIndexToBuffer(index: number) {
    this.buffer.push(index);
  }
}

/**
 * An abstraction on top of WebSockets and XHR streaming to provide fastest
 * possible connection for peers.
 */
export class Socket extends EventEmitter {
  private readonly HTTP_TIMEOUT = 25000;//ms
  private readonly WEB_SOCKET_PING_INTERVAL = 20000;//ms

  private _disconnected = false;
  private _id: string;
  private _messagesQueue: Array<any> = [];
  private _httpUrl: string;
  private _wsUrl: string;
  private _socket: WebSocket;
  private _wsPingTimer: any;
  private _httpRequest: HttpRequest;
  private _timeout: any;

  constructor(
    secure: any,
    host: string,
    port: number,
    path: string,
    key: string,
    wsport = port
  ) {
    super();

    const httpProtocol = secure ? "https://" : "http://";
    const wsProtocol = secure ? "wss://" : "ws://";

    this._httpUrl = httpProtocol + host + ":" + port + path + key;
    this._wsUrl = wsProtocol + host + ":" + wsport + path + "peerjs?key=" + key;
  }

  /** Check in with ID or get one from server. */
  start(id: string, token: string): void {
    this._id = id;

    this._httpUrl += "/" + id + "/" + token;
    this._wsUrl += "&id=" + id + "&token=" + token;

    this._startXhrStream();
    this._startWebSocket();
  }

  /** Start up websocket communications. */
  private _startWebSocket(): void {
    if (this._socket) {
      return;
    }

    this._socket = new WebSocket(this._wsUrl);

    const self = this;

    this._socket.onmessage = function (event) {
      let data;

      try {
        data = JSON.parse(event.data);
      } catch (e) {
        util.log("Invalid server message", event.data);
        return;
      }
      self.emit(SocketEventType.Message, data);
    };

    this._socket.onclose = function (event) {
      util.log("Socket closed.", event);;

      self._disconnected = true;
      self.emit(SocketEventType.Disconnected);
    };

    // Take care of the queue of connections if necessary and make sure Peer knows
    // socket is open.
    this._socket.onopen = function () {
      if (self._timeout) {
        clearTimeout(self._timeout);
        setTimeout(function () {
          self._httpRequest.abort();
          self._httpRequest = null;
        }, 5000);
      }

      self._sendQueuedMessages();
      util.log("Socket open");

      self._wsPingTimer = setTimeout(function () { self._sendHeartbeat() }, self.WEB_SOCKET_PING_INTERVAL);
    };
  }

  /** Start XHR streaming. */
  private _startXhrStream(streamIndex: number = 0) {
    const newRequest = new HttpRequest(streamIndex, this._httpUrl);
    this._httpRequest = newRequest;

    newRequest.onError = () => {
      // If we get an error, likely something went wrong.
      // Stop streaming.
      clearTimeout(this._timeout);
      this.emit(SocketEventType.Disconnected);
    };

    newRequest.onSuccess = () => {
      this._handleStream(newRequest);
    };

    try {
      newRequest.send();
      this._setHTTPTimeout();
    } catch (e) {
      util.log("XMLHttpRequest not available; defaulting to WebSockets");
    }
  }

  private _sendHeartbeat(): void {
    if (!this._wsOpen()) {
      util.log(`Cannot send heartbeat, because socket closed`);
      return;
    }

    const data = { type: 'HEARTBEAT' };
    const message = JSON.stringify(data);
    this._socket.send(message);

    const self = this;

    this._wsPingTimer = setTimeout(function () { self._sendHeartbeat() }, this.WEB_SOCKET_PING_INTERVAL);
  }

  /** Handles onreadystatechange response as a stream. */
  private _handleStream(httpRequest: HttpRequest) {
    // 3 and 4 are loading/done state. All others are not relevant.
    const messages = httpRequest.getMessages();

    // Check to see if anything needs to be processed on buffer.

    while (httpRequest.hasBufferedIndices()) {
      const index = httpRequest.popBufferedIndex();
      let bufferedMessage = messages[index];

      try {
        bufferedMessage = JSON.parse(bufferedMessage);
      } catch (e) {
        //TODO should we need to put it back?
        httpRequest.buffer.unshift(index);
        break;
      }

      this.emit(SocketEventType.Message, bufferedMessage);
    }

    let message = messages[httpRequest.index];

    if (message) {
      httpRequest.index += 1;
      // Buffering--this message is incomplete and we'll get to it next time.
      // This checks if the httpResponse ended in a `\n`, in which case the last
      // element of messages should be the empty string.
      if (httpRequest.index === messages.length) {
        httpRequest.pushIndexToBuffer(httpRequest.index - 1);
      } else {
        try {
          message = JSON.parse(message);
        } catch (e) {
          util.log("Invalid server message", message);
          return;
        }
        this.emit(SocketEventType.Message, message);
      }
    }
  }

  private _setHTTPTimeout() {
    const self = this;

    this._timeout = setTimeout(function () {
      if (!self._wsOpen()) {
        const oldHttp = self._httpRequest;
        self._startXhrStream(oldHttp.streamIndex + 1);
        self._httpRequest.previousRequest = oldHttp;
      } else {
        self._httpRequest.abort();
        self._httpRequest = null;
      }
    }, this.HTTP_TIMEOUT);
  }

  /** Is the websocket currently open? */
  private _wsOpen(): boolean {
    return this._socket && this._socket.readyState == 1;
  }

  /** Send queued messages. */
  private _sendQueuedMessages(): void {
    //TODO is it ok?
    //Create copy of queue and clear it,
    //because send method push the message back to queue if smth will go wrong
    const copiedQueue = [...this._messagesQueue];
    this._messagesQueue = [];

    for (const message of copiedQueue) {
      this.send(message);
    }
  }

  /** Exposed send for DC & Peer. */
  send(data: any): void {
    if (this._disconnected) {
      return;
    }

    // If we didn't get an ID yet, we can't yet send anything so we should queue
    // up these messages.
    if (!this._id) {
      this._messagesQueue.push(data);
      return;
    }

    if (!data.type) {
      this.emit(SocketEventType.Error, "Invalid message");
      return;
    }

    const message = JSON.stringify(data);

    if (this._wsOpen()) {
      this._socket.send(message);
    } else {
      const http = new XMLHttpRequest();
      const url = this._httpUrl + "/" + data.type.toLowerCase();
      http.open("post", url, true);
      http.setRequestHeader("Content-Type", "application/json");
      http.send(message);
    }
  }

  close(): void {
    if (!this._disconnected && this._wsOpen()) {
      this._socket.close();
      this._disconnected = true;
      clearTimeout(this._wsPingTimer);
    }
  }
}
