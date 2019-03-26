import { util } from "./util";
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate
} from "./adapter";
import * as Reliable from "reliable";
import { MediaConnection } from "./mediaconnection";
import { DataConnection } from "./dataconnection";
import { ConnectionType, PeerErrorType, ConnectionEventType } from "./enums";
import { BaseConnection } from "./baseconnection";
import { utils } from "mocha";

/**
 * Manages all negotiations between Peers.
 */
class Negotiator {
  readonly pcs = {
    data: {},
    media: {}
  };

  queue: any[] = []; // connections that are delayed due to a PC being in use.

  private readonly _idPrefix = "pc_";

  /** Returns a PeerConnection object set up correctly (for data, media). */
  startConnection(connection: BaseConnection, options: any) {
    const peerConnection = this._getPeerConnection(connection, options);

    // Set the connection's PC.
    connection.peerConnection = peerConnection;

    if (connection.type === ConnectionType.Media && options._stream) {
      this._addTracksToConnection(options._stream, peerConnection);
    }

    // What do we need to do now?
    if (options.originator) {
      if (connection.type === ConnectionType.Data) {
        const dataConnection = <DataConnection>connection;

        let config = {};

        if (!util.supports.sctp) {
          config = { reliable: options.reliable };
        }

        const dataChannel = peerConnection.createDataChannel(
          dataConnection.label,
          config
        );
        dataConnection.initialize(dataChannel);
      }

      this._makeOffer(connection);
    } else {
      this.handleSDP("OFFER", connection, options.sdp);
    }
  }

  private _getPeerConnection(
    connection: BaseConnection,
    options: any
  ): RTCPeerConnection {
    if (!this.pcs[connection.type]) {
      util.error(
        connection.type +
        " is not a valid connection type. Maybe you overrode the `type` property somewhere."
      );
    }

    if (!this.pcs[connection.type][connection.peer]) {
      this.pcs[connection.type][connection.peer] = {};
    }

    const peerConnections = this.pcs[connection.type][connection.peer];

    let pc;

    if (options.pc) {
      // Simplest case: PC id already provided for us.
      pc = peerConnections[options.pc];
    }

    if (!pc || pc.signalingState !== "stable") {
      pc = this._startPeerConnection(connection);
    }

    return pc;
  }

  /** Start a PC. */
  private _startPeerConnection(connection: BaseConnection): RTCPeerConnection {
    util.log("Creating RTCPeerConnection.");

    const id = this._idPrefix + util.randomToken();
    let optional = {};

    if (connection.type === ConnectionType.Data && !util.supports.sctp) {
      optional = { optional: [{ RtpDataChannels: true }] };
    } else if (connection.type === ConnectionType.Media) {
      // Interop req for chrome.
      optional = { optional: [{ DtlsSrtpKeyAgreement: true }] };
    }

    const peerConnection = new RTCPeerConnection(
      connection.provider.options.config,
      optional
    );

    this.pcs[connection.type][connection.peer][id] = peerConnection;

    this._setupListeners(connection, peerConnection);

    return peerConnection;
  }

  /** Set up various WebRTC listeners. */
  private _setupListeners(
    connection: BaseConnection,
    peerConnection: RTCPeerConnection
  ) {
    const peerId = connection.peer;
    const connectionId = connection.connectionId;
    const connectionType = connection.type;
    const provider = connection.provider;

    // ICE CANDIDATES.
    util.log("Listening for ICE candidates.");

    peerConnection.onicecandidate = (evt) => {
      if (evt.candidate) {
        util.log("Received ICE candidates for:", peerId);
        provider.socket.send({
          type: "CANDIDATE",
          payload: {
            candidate: evt.candidate,
            type: connectionType,
            connectionId: connectionId
          },
          dst: peerId
        });
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      switch (peerConnection.iceConnectionState) {
        case "failed":
          util.log(
            "iceConnectionState is disconnected, closing connections to " +
            peerId
          );
          connection.emit(
            ConnectionEventType.Error,
            new Error("Negotiation of connection to " + peerId + " failed.")
          );
          connection.close();
          break;
        case "disconnected":
          util.log(
            "iceConnectionState is disconnected, closing connections to " +
            peerId
          );
          break;
        case "completed":
          peerConnection.onicecandidate = util.noop;
          break;
      }
    };

    // Fallback for older Chrome impls.
    //@ts-ignore
    peerConnection.onicechange = peerConnection.oniceconnectionstatechange;

    // DATACONNECTION.
    util.log("Listening for data channel");
    // Fired between offer and answer, so options should already be saved
    // in the options hash.
    peerConnection.ondatachannel = (evt) => {
      util.log("Received data channel");

      const dataChannel = evt.channel;
      const connection = <DataConnection>(
        provider.getConnection(peerId, connectionId)
      );

      connection.initialize(dataChannel);
    };

    // MEDIACONNECTION.
    util.log("Listening for remote stream");

    peerConnection.ontrack = (evt) => {
      util.log("Received remote stream");

      const stream = evt.streams[0];
      const connection = provider.getConnection(peerId, connectionId);

      if (connection.type === ConnectionType.Media) {
        const mediaConnection = <MediaConnection>connection;

        this._addStreamToMediaConnection(stream, mediaConnection);
      }
    };
  }

  cleanup(connection: BaseConnection): void {
    util.log("Cleaning up PeerConnection to " + connection.peer);

    const peerConnection = connection.peerConnection;

    if (!peerConnection) {
      return;
    }

    const peerConnectionNotClosed = peerConnection.signalingState !== "closed";
    let dataChannelNotClosed = false;

    if (connection.type === ConnectionType.Data) {
      const dataConnection = <DataConnection>connection;
      const dataChannel = dataConnection.dataChannel;

      dataChannelNotClosed =
        dataChannel.readyState && dataChannel.readyState !== "closed";
    }

    if (peerConnectionNotClosed || dataChannelNotClosed) {
      peerConnection.close();
      connection.peerConnection = null;
    }
  }

  private async _makeOffer(connection: BaseConnection): Promise<void> {
    const peerConnection = connection.peerConnection;

    try {
      const offer = await peerConnection.createOffer(
        connection.options.constraints
      );

      util.log("Created offer.");

      if (!util.supports.sctp && connection.type === ConnectionType.Data) {
        const dataConnection = <DataConnection>connection;
        if (dataConnection.reliable) {
          offer.sdp = Reliable.higherBandwidthSDP(offer.sdp);
        }
      }

      try {
        await peerConnection.setLocalDescription(offer);

        util.log("Set localDescription:", offer, `for:${connection.peer}`);

        let payload: any = {
          sdp: offer,
          type: connection.type,
          connectionId: connection.connectionId,
          metadata: connection.metadata,
          browser: util.browser
        };

        if (connection.type === ConnectionType.Data) {
          const dataConnection = <DataConnection>connection;

          payload = {
            ...payload,
            label: dataConnection.label,
            reliable: dataConnection.reliable,
            serialization: dataConnection.serialization
          };
        }

        connection.provider.socket.send({
          type: "OFFER",
          payload,
          dst: connection.peer
        });
      } catch (err) {
        // TODO: investigate why _makeOffer is being called from the answer
        if (
          err !=
          "OperationError: Failed to set local offer sdp: Called in wrong state: kHaveRemoteOffer"
        ) {
          connection.provider.emitError(PeerErrorType.WebRTC, err);
          util.log("Failed to setLocalDescription, ", err);
        }
      }
    } catch (err_1) {
      connection.provider.emitError(PeerErrorType.WebRTC, err_1);
      util.log("Failed to createOffer, ", err_1);
    }
  }

  private async _makeAnswer(connection: BaseConnection): Promise<void> {
    const peerConnection = connection.peerConnection;

    try {
      const answer = await peerConnection.createAnswer();
      util.log("Created answer.");

      if (!util.supports.sctp && connection.type === ConnectionType.Data) {
        const dataConnection = <DataConnection>connection;
        if (dataConnection.reliable) {
          answer.sdp = Reliable.higherBandwidthSDP(answer.sdp);
        }
      }

      try {
        await peerConnection.setLocalDescription(answer);

        util.log(`Set localDescription:`, answer, `for:${connection.peer}`);

        connection.provider.socket.send({
          type: "ANSWER",
          payload: {
            sdp: answer,
            type: connection.type,
            connectionId: connection.connectionId,
            browser: util.browser
          },
          dst: connection.peer
        });
      } catch (err) {
        connection.provider.emitError(PeerErrorType.WebRTC, err);
        util.log("Failed to setLocalDescription, ", err);
      }
    } catch (err_1) {
      connection.provider.emitError(PeerErrorType.WebRTC, err_1);
      util.log("Failed to create answer, ", err_1);
    }
  }

  /** Handle an SDP. */
  async handleSDP(
    type: string,
    connection: BaseConnection,
    sdp: any
  ): Promise<void> {
    sdp = new RTCSessionDescription(sdp);
    const peerConnection = connection.peerConnection;

    util.log("Setting remote description", sdp);

    const self = this;

    try {
      await peerConnection.setRemoteDescription(sdp);
      util.log(`Set remoteDescription:${type} for:${connection.peer}`);
      if (type === "OFFER") {
        await self._makeAnswer(connection);
      }
    } catch (err) {
      connection.provider.emitError(PeerErrorType.WebRTC, err);
      util.log("Failed to setRemoteDescription, ", err);
    }
  }

  /** Handle a candidate. */
  async handleCandidate(connection: BaseConnection, ice: any): Promise<void> {
    const candidate = ice.candidate;
    const sdpMLineIndex = ice.sdpMLineIndex;

    try {
      await connection.peerConnection.addIceCandidate(
        new RTCIceCandidate({
          sdpMLineIndex: sdpMLineIndex,
          candidate: candidate
        })
      );
      util.log(`Added ICE candidate for:${connection.peer}`);
    } catch (err) {
      connection.provider.emitError(PeerErrorType.WebRTC, err);
      util.log("Failed to handleCandidate, ", err);
    }
  }

  private _addTracksToConnection(
    stream: MediaStream,
    peerConnection: RTCPeerConnection
  ): void {
    util.log(`add tracks from stream ${stream.id} to peer connection`);

    if (!peerConnection.addTrack) {
      return util.error(
        `Your browser does't support RTCPeerConnection#addTrack. Ignored.`
      );
    }

    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });
  }

  private _addStreamToMediaConnection(
    stream: MediaStream,
    mediaConnection: MediaConnection
  ): void {
    util.log(
      `add stream ${stream.id} to media connection ${
      mediaConnection.connectionId
      }`
    );

    mediaConnection.addStream(stream);
  }
}

export default new Negotiator();
