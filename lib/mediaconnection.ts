import { util } from "./util";
import Negotiator from "./negotiator";
import { ConnectionType, ConnectionEventType } from "./enums";
import { Peer } from "./peer";
import { BaseConnection } from "./baseconnection";
import { ServerMessage } from "./servermessage";

/**
 * Wraps the streaming interface between two Peers.
 */
export class MediaConnection extends BaseConnection {
  private static readonly ID_PREFIX = "mc_";

  private localStream: MediaStream;
  private remoteStream: MediaStream;

  get type() {
    return ConnectionType.Media;
  }

  constructor(peerId: string, provider: Peer, options: any) {
    super(peerId, provider, options);

    this.localStream = this.options._stream;
    this.connectionId =
      this.options.connectionId ||
      MediaConnection.ID_PREFIX + util.randomToken();

    if (this.localStream) {
      Negotiator.startConnection(this, {
        _stream: this.localStream,
        originator: true
      });
    }
  }

  addStream(remoteStream) {
    util.log("Receiving stream", remoteStream);

    this.remoteStream = remoteStream;
    super.emit(ConnectionEventType.Stream, remoteStream); // Should we call this `open`?
  }

  handleMessage(message: ServerMessage): void {
    const type = message.type;
    const payload = message.payload;

    switch (message.type) {
      case "ANSWER":
        // Forward to negotiator
        Negotiator.handleSDP(type, this, payload.sdp);
        this._open = true;
        break;
      case "CANDIDATE":
        Negotiator.handleCandidate(this, payload.candidate);
        break;
      default:
        util.warn(`Unrecognized message type:${type} from peer:${this.peer}`);
        break;
    }
  }

  answer(stream: MediaStream): void {
    if (this.localStream) {
      util.warn(
        "Local stream already exists on this MediaConnection. Are you answering a call twice?"
      );
      return;
    }

    this.options._payload._stream = stream;

    this.localStream = stream;
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
