import { util } from "./util";
import logger from "./logger";
import Negotiator from "./negotiator";
import { ConnectionType, ConnectionEventType, ServerMessageType } from "./enums";
import { Peer } from "./peer";
import { BaseConnection } from "./baseconnection";
import { ServerMessage } from "./servermessage";

/**
 * Wraps the streaming interface between two Peers.
 */
export class MediaConnection extends BaseConnection {
  private static readonly ID_PREFIX = "mc_";

  private _localStream: MediaStream;
  private _remoteStream: MediaStream;

  get type() {
    return ConnectionType.Media;
  }

  get localStream(): MediaStream { return this._localStream; }
  get remoteStream(): MediaStream { return this._remoteStream; }

  constructor(peerId: string, provider: Peer, options: any) {
    super(peerId, provider, options);

    this._localStream = this.options._stream;
    this.connectionId =
      this.options.connectionId ||
      MediaConnection.ID_PREFIX + util.randomToken();

    if (this._localStream) {
      Negotiator.startConnection(this, {
        _stream: this._localStream,
        originator: true
      });
    }
  }

  addStream(remoteStream) {
    logger.log("Receiving stream", remoteStream);

    this._remoteStream = remoteStream;
    super.emit(ConnectionEventType.Stream, remoteStream); // Should we call this `open`?
  }

  handleMessage(message: ServerMessage): void {
    const type = message.type;
    const payload = message.payload;

    switch (message.type) {
      case ServerMessageType.Answer:
        // Forward to negotiator
        Negotiator.handleSDP(type, this, payload.sdp);
        this._open = true;
        break;
      case ServerMessageType.Candidate:
        Negotiator.handleCandidate(this, payload.candidate);
        break;
      default:
        logger.warn(`Unrecognized message type:${type} from peer:${this.peer}`);
        break;
    }
  }

  answer(stream: MediaStream): void {
    if (this._localStream) {
      logger.warn(
        "Local stream already exists on this MediaConnection. Are you answering a call twice?"
      );
      return;
    }

    this.options._payload._stream = stream;

    this._localStream = stream;
    Negotiator.startConnection(this, this.options._payload);
    // Retrieve lost messages stored because PeerConnection not set up.
    const messages = this.provider._getMessages(this.connectionId);

    for (let message of messages) {
      this.handleMessage(message);
    }

    this._open = true;
  }

  /**
   * Exposed functionality for users.
   */

  /** Allows user to close connection. */
  close(): void {
    if (!this.open) {
      return;
    }

    this._open = false;
    Negotiator.cleanup(this);
    super.emit(ConnectionEventType.Close);
  }
}
