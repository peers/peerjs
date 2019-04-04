import { Reliable } from "reliable";
import { util } from "./util";
import logger, { LogLevel } from "./logger";
import { Negotiator } from "./negotiator";
import {
  ConnectionType,
  ConnectionEventType,
  SerializationType,
  ServerMessageType
} from "./enums";
import { Peer } from "./peer";
import { BaseConnection } from "./baseconnection";
import { ServerMessage } from "./servermessage";

/**
 * Wraps a DataChannel between two Peers.
 */
export class DataConnection extends BaseConnection {
  private static readonly ID_PREFIX = "dc_";

  private _negotiator: Negotiator;
  readonly label: string;
  readonly serialization: SerializationType;
  readonly reliable: boolean;

  get type() {
    return ConnectionType.Data;
  }

  private _buffer: any[] = [];
  private _bufferSize = 0;
  private _buffering = false;
  private _chunkedData = {};

  private _peerBrowser: any;
  private _dc: RTCDataChannel;
  private _reliable: Reliable;

  get dataChannel(): RTCDataChannel {
    return this._dc;
  }

  get bufferSize(): number { return this._bufferSize; }

  constructor(peerId: string, provider: Peer, options: any) {
    super(peerId, provider, options);

    this.connectionId =
      this.options.connectionId || DataConnection.ID_PREFIX + util.randomToken();

    this.label = this.options.label || this.connectionId;
    this.serialization = this.options.serialization || SerializationType.Binary;
    this.reliable = this.options.reliable;

    if (this.options._payload) {
      this._peerBrowser = this.options._payload.browser;
    }

    this._negotiator = new Negotiator(this);

    this._negotiator.startConnection(
      this.options._payload || {
        originator: true
      }
    );
  }

  /** Called by the Negotiator when the DataChannel is ready. */
  initialize(dc: RTCDataChannel): void {
    this._dc = dc;
    this._configureDataChannel();
  }

  private _configureDataChannel(): void {
    if (util.supports.sctp) {
      this.dataChannel.binaryType = "arraybuffer";
    }

    this.dataChannel.onopen = () => {
      logger.log("Data channel connection success");
      this._open = true;
      this.emit(ConnectionEventType.Open);
    };

    // Use the Reliable shim for non Firefox browsers
    if (!util.supports.sctp && this.reliable) {
      const isLoggingEnable = logger.logLevel > LogLevel.Disabled;
      this._reliable = new Reliable(this.dataChannel, isLoggingEnable);
    }

    if (this._reliable) {
      this._reliable.onmessage = (msg) => {
        this.emit(ConnectionEventType.Data, msg);
      };
    } else {
      this.dataChannel.onmessage = (e) => {
        this._handleDataMessage(e);
      };
    }
    this.dataChannel.onclose = () => {
      logger.log("DataChannel closed for:", this.peer);
      this.close();
    };
  }

  // Handles a DataChannel message.
  private _handleDataMessage(e): void {
    let data = e.data;
    const datatype = data.constructor;

    const isBinarySerialization = this.serialization === SerializationType.Binary ||
      this.serialization === SerializationType.BinaryUTF8;

    if (isBinarySerialization) {
      if (datatype === Blob) {
        // Datatype should never be blob
        util.blobToArrayBuffer(data, (ab) => {
          data = util.unpack(ab);
          this.emit(ConnectionEventType.Data, data);
        });
        return;
      } else if (datatype === ArrayBuffer) {
        data = util.unpack(data);
      } else if (datatype === String) {
        // String fallback for binary data for browsers that don't support binary yet
        const ab = util.binaryStringToArrayBuffer(data);
        data = util.unpack(ab);
      }
    } else if (this.serialization === SerializationType.JSON) {
      data = JSON.parse(data);
    }

    // Check if we've chunked--if so, piece things back together.
    // We're guaranteed that this isn't 0.
    if (data.__peerData) {
      const id = data.__peerData;
      const chunkInfo = this._chunkedData[id] || {
        data: [],
        count: 0,
        total: data.total
      };

      chunkInfo.data[data.n] = data.data;
      chunkInfo.count++;

      if (chunkInfo.total === chunkInfo.count) {
        // Clean up before making the recursive call to `_handleDataMessage`.
        delete this._chunkedData[id];

        // We've received all the chunks--time to construct the complete data.
        data = new Blob(chunkInfo.data);
        this._handleDataMessage({ data: data });
      }

      this._chunkedData[id] = chunkInfo;
      return;
    }

    super.emit(ConnectionEventType.Data, data);
  }

  /**
   * Exposed functionality for users.
   */

  /** Allows user to close connection. */
  close(): void {
    this._buffer = [];
    this._bufferSize = 0;

    if (this._negotiator) {
      this._negotiator.cleanup();
      this._negotiator = null;
    }

    if (this.provider) {
      this.provider._removeConnection(this);

      this.provider = null;
    }

    if (!this.open) {
      return;
    }

    this._open = false;

    super.emit(ConnectionEventType.Close);
  }

  /** Allows user to send data. */
  send(data: any, chunked: boolean): void {
    if (!this.open) {
      super.emit(
        ConnectionEventType.Error,
        new Error(
          "Connection is not open. You should listen for the `open` event before sending messages."
        )
      );
      return;
    }

    if (this._reliable) {
      // Note: reliable shim sending will make it so that you cannot customize
      // serialization.
      this._reliable.send(data);
      return;
    }

    if (this.serialization === SerializationType.JSON) {
      this._bufferedSend(JSON.stringify(data));
    } else if (
      this.serialization === SerializationType.Binary ||
      this.serialization === SerializationType.BinaryUTF8
    ) {
      const blob = util.pack(data);

      // For Chrome-Firefox interoperability, we need to make Firefox "chunk"
      // the data it sends out.
      const needsChunking =
        util.chunkedBrowsers[this._peerBrowser] ||
        util.chunkedBrowsers[util.browser];

      if (needsChunking && !chunked && blob.size > util.chunkedMTU) {
        this._sendChunks(blob);
        return;
      }

      // DataChannel currently only supports strings.
      if (!util.supports.sctp) {
        util.blobToBinaryString(blob, (str) => {
          this._bufferedSend(str);
        });
      } else if (!util.supports.binaryBlob) {
        // We only do this if we really need to (e.g. blobs are not supported),
        // because this conversion is costly.
        util.blobToArrayBuffer(blob, (ab) => {
          this._bufferedSend(ab);
        });
      } else {
        this._bufferedSend(blob);
      }
    } else {
      this._bufferedSend(data);
    }
  }

  private _bufferedSend(msg: any): void {
    if (this._buffering || !this._trySend(msg)) {
      this._buffer.push(msg);
      this._bufferSize = this._buffer.length;
    }
  }

  // Returns true if the send succeeds.
  private _trySend(msg: any): boolean {
    if (!this.open) {
      return false;
    }

    try {
      this.dataChannel.send(msg);
    } catch (e) {
      this._buffering = true;

      setTimeout(() => {
        // Try again.
        this._buffering = false;
        this._tryBuffer();
      }, 100);

      return false;
    }

    return true;
  }

  // Try to send the first message in the buffer.
  private _tryBuffer(): void {
    if (!this.open) {
      return;
    }

    if (this._buffer.length === 0) {
      return;
    }

    const msg = this._buffer[0];

    if (this._trySend(msg)) {
      this._buffer.shift();
      this._bufferSize = this._buffer.length;
      this._tryBuffer();
    }
  }

  private _sendChunks(blob): void {
    const blobs = util.chunk(blob);

    for (let blob of blobs) {
      this.send(blob, true);
    }
  }

  handleMessage(message: ServerMessage): void {
    const payload = message.payload;

    switch (message.type) {
      case ServerMessageType.Answer:
        this._peerBrowser = payload.browser;

        // Forward to negotiator
        this._negotiator.handleSDP(message.type, payload.sdp);
        break;
      case ServerMessageType.Candidate:
        this._negotiator.handleCandidate(payload.candidate);
        break;
      default:
        logger.warn(
          "Unrecognized message type:",
          message.type,
          "from peer:",
          this.peer
        );
        break;
    }
  }
}
