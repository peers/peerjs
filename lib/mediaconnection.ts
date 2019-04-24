import { util } from "./util";
import logger from "./logger";
import { Negotiator } from "./negotiator";
import { ConnectionType, ConnectionEventType, ServerMessageType } from "./enums";
import { Peer } from "./peer";
import { BaseConnection } from "./baseconnection";
import { ServerMessage } from "./servermessage";
import { AnswerOption } from "..";

/**
 * Wraps the streaming interface between two Peers.
 */
export class MediaConnection extends BaseConnection {
  private static readonly ID_PREFIX = "mc_";

  private _negotiator: Negotiator;
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

    this._negotiator = new Negotiator(this);

    if (this._localStream) {
      this._negotiator.startConnection({
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
        this._negotiator.handleSDP(type, payload.sdp);
        this._open = true;
        break;
      case ServerMessageType.Candidate:
        this._negotiator.handleCandidate(payload.candidate);
        break;
      default:
        logger.warn(`Unrecognized message type:${type} from peer:${this.peer}`);
        break;
    }
  }

  answer(stream: MediaStream, options: AnswerOption = {}): void {
    if (this._localStream) {
      logger.warn(
        "Local stream already exists on this MediaConnection. Are you answering a call twice?"
      );
      return;
    }

    this._localStream = stream;

    if (options && options.sdpTransform) {
      this.options.sdpTransform = options.sdpTransform;
    }

    this._negotiator.startConnection({ ...this.options._payload, _stream: stream });
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
    if (this._negotiator) {
      this._negotiator.cleanup();
      this._negotiator = null;
    }

    this._localStream = null;
    this._remoteStream = null;

    if (this.provider) {
      this.provider._removeConnection(this);

      this.provider = null;
    }

    if (this.options && this.options._stream) {
      this.options._stream = null;
    }

    if (!this.open) {
      return;
    }

    this._open = false;

    super.emit(ConnectionEventType.Close);
  }
}
