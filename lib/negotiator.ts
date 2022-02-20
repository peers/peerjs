import logger from './logger';
import type { MediaConnection } from './mediaconnection';
import type { DataConnection } from './dataconnection';
import { ConnectionType, PeerErrorType, ConnectionEventType, ServerMessageType } from './enums';
import { BaseConnection } from './baseconnection';

function noop(): void {}
/**
 * Manages all negotiations between Peers.
 */
export class Negotiator {
  constructor(readonly connection: BaseConnection) {}

  private get webRtc() {
    return this.connection.provider.options.polyfills?.WebRTC ?? window;
  }

  /** Returns a PeerConnection object set up correctly (for data, media). */
  startConnection(options: any) {
    const peerConnection = this._startPeerConnection();

    // Set the connection's PC.
    this.connection.peerConnection = peerConnection;

    if (this.connection.type === ConnectionType.Media && options._stream) {
      this._addTracksToConnection(options._stream, peerConnection);
    }

    // What do we need to do now?
    if (options.originator) {
      if (this.connection.type === ConnectionType.Data) {
        const dataConnection = this.connection as DataConnection;

        const config: RTCDataChannelInit = { ordered: !!options.reliable };

        const dataChannel = peerConnection.createDataChannel(dataConnection.label, config);
        dataConnection.initialize(dataChannel);
      }

      this._makeOffer();
    } else {
      this.handleSDP('OFFER', options.sdp);
    }
  }

  /** Start a PC. */
  private _startPeerConnection(): RTCPeerConnection {
    logger.log('Creating RTCPeerConnection.');

    const ctr: typeof RTCPeerConnection = this.webRtc.RTCPeerConnection;

    const peerConnection = new ctr(this.connection.provider.options.config);

    this._setupListeners(peerConnection);

    return peerConnection;
  }

  /** Set up various WebRTC listeners. */
  private _setupListeners(peerConnection: RTCPeerConnection) {
    const peerId = this.connection.peer;
    const connectionId = this.connection.connectionId;
    const connectionType = this.connection.type;
    const provider = this.connection.provider;

    // ICE CANDIDATES.
    logger.log('Listening for ICE candidates, remote streams and data channels.');

    peerConnection.onicecandidate = evt => {
      if (!evt.candidate || !evt.candidate.candidate) return;

      logger.log(`Received ICE candidates for ${peerId}:`, evt.candidate);

      provider.socket.send({
        type: ServerMessageType.Candidate,
        payload: {
          candidate: evt.candidate,
          type: connectionType,
          connectionId: connectionId,
        },
        dst: peerId,
      });
    };

    peerConnection.oniceconnectionstatechange = () => {
      switch (peerConnection.iceConnectionState) {
        case 'failed':
          logger.log('iceConnectionState is failed, closing connections to ' + peerId);
          this.connection.emit(
            ConnectionEventType.Error,
            new Error('Negotiation of connection to ' + peerId + ' failed.')
          );
          this.connection.close();
          break;
        case 'closed':
          logger.log('iceConnectionState is closed, closing connections to ' + peerId);
          this.connection.emit(ConnectionEventType.Error, new Error('Connection to ' + peerId + ' closed.'));
          this.connection.close();
          break;
        case 'connected':
          logger.log('iceConnectionState changed to connected on the connection with ' + peerId);
          break;
        case 'disconnected':
          logger.log('iceConnectionState changed to disconnected on the connection with ' + peerId);
          break;
        case 'completed':
          logger.log('iceConnectionState changed to completed on the connection with ' + peerId);
          peerConnection.onicecandidate = noop;
          break;
      }

      this.connection.emit(ConnectionEventType.IceStateChanged, peerConnection.iceConnectionState);
    };

    // Fired between offer and answer, so options should already be saved
    // in the options hash.
    peerConnection.ondatachannel = evt => {
      logger.log('Received data channel');

      const dataChannel = evt.channel;
      const connection = provider.getConnection(peerId, connectionId) as DataConnection;

      connection.initialize(dataChannel);
    };

    peerConnection.ontrack = evt => {
      logger.log('Received remote stream');

      const stream = evt.streams[0];
      const connection = provider.getConnection(peerId, connectionId);

      if (connection.type === ConnectionType.Media) {
        const mediaConnection = connection as MediaConnection;

        this._addStreamToMediaConnection(stream, mediaConnection);
      }
    };
  }

  cleanup(): void {
    logger.log('Cleaning up PeerConnection to ' + this.connection.peer);

    const peerConnection = this.connection.peerConnection;

    if (!peerConnection) {
      return;
    }

    this.connection.peerConnection = null;

    //unsubscribe from all PeerConnection's events
    peerConnection.onicecandidate =
      peerConnection.oniceconnectionstatechange =
      peerConnection.ondatachannel =
      peerConnection.ontrack =
        null;

    const peerConnectionNotClosed = peerConnection.signalingState !== 'closed';
    let dataChannelNotClosed = false;

    if (this.connection.type === ConnectionType.Data) {
      const dataConnection = this.connection as DataConnection;
      const dataChannel = dataConnection.dataChannel;

      if (dataChannel) {
        dataChannelNotClosed = !!dataChannel.readyState && dataChannel.readyState !== 'closed';
      }
    }

    if (peerConnectionNotClosed || dataChannelNotClosed) {
      peerConnection.close();
    }
  }

  private async _makeOffer(): Promise<void> {
    const peerConnection = this.connection.peerConnection;
    const provider = this.connection.provider;

    try {
      const offer = await peerConnection.createOffer(this.connection.options.constraints);

      if (peerConnection.signalingState === 'closed') return;

      logger.log('Created offer.');

      if (this.connection.options.sdpTransform && typeof this.connection.options.sdpTransform === 'function') {
        offer.sdp = this.connection.options.sdpTransform(offer.sdp) || offer.sdp;
      }

      try {
        await peerConnection.setLocalDescription(offer);

        logger.log('Set localDescription:', offer, `for:${this.connection.peer}`);

        let payload: any = {
          sdp: offer,
          type: this.connection.type,
          connectionId: this.connection.connectionId,
          metadata: this.connection.metadata,
        };

        if (this.connection.type === ConnectionType.Data) {
          const dataConnection = this.connection as DataConnection;

          payload = {
            ...payload,
            label: dataConnection.label,
            reliable: dataConnection.reliable,
            serialization: dataConnection.serialization,
          };
        }

        provider.socket.send({
          type: ServerMessageType.Offer,
          payload,
          dst: this.connection.peer,
        });
      } catch (err) {
        // TODO: investigate why _makeOffer is being called from the answer
        if (err != 'OperationError: Failed to set local offer sdp: Called in wrong state: kHaveRemoteOffer') {
          provider.emitError(PeerErrorType.WebRTC, err);
          logger.log('Failed to setLocalDescription, ', err);
        }
      }
    } catch (err_1) {
      provider.emitError(PeerErrorType.WebRTC, err_1);
      logger.log('Failed to createOffer, ', err_1);
    }
  }

  private async _makeAnswer(): Promise<void> {
    const peerConnection = this.connection.peerConnection;
    const provider = this.connection.provider;

    try {
      const answer = await peerConnection.createAnswer();

      if (peerConnection.signalingState === 'closed') return;

      logger.log('Created answer.');

      if (this.connection.options.sdpTransform && typeof this.connection.options.sdpTransform === 'function') {
        answer.sdp = this.connection.options.sdpTransform(answer.sdp) || answer.sdp;
      }

      try {
        await peerConnection.setLocalDescription(answer);

        logger.log(`Set localDescription:`, answer, `for:${this.connection.peer}`);

        provider.socket.send({
          type: ServerMessageType.Answer,
          payload: {
            sdp: answer,
            type: this.connection.type,
            connectionId: this.connection.connectionId,
          },
          dst: this.connection.peer,
        });
      } catch (err) {
        provider.emitError(PeerErrorType.WebRTC, err);
        logger.log('Failed to setLocalDescription, ', err);
      }
    } catch (err_1) {
      provider.emitError(PeerErrorType.WebRTC, err_1);
      logger.log('Failed to create answer, ', err_1);
    }
  }

  /** Handle an SDP. */
  async handleSDP(type: string, sdp: any): Promise<void> {
    const ctr: typeof RTCSessionDescription = this.webRtc.RTCSessionDescription;

    sdp = new ctr(sdp);
    const peerConnection = this.connection.peerConnection;
    const provider = this.connection.provider;

    logger.log('Setting remote description', sdp);

    const self = this;

    try {
      await peerConnection.setRemoteDescription(sdp);
      logger.log(`Set remoteDescription:${type} for:${this.connection.peer}`);
      if (type === 'OFFER') {
        await self._makeAnswer();
      }
    } catch (err) {
      provider.emitError(PeerErrorType.WebRTC, err);
      logger.log('Failed to setRemoteDescription, ', err);
    }
  }

  /** Handle a candidate. */
  async handleCandidate(ice: any): Promise<void> {
    logger.log(`handleCandidate:`, ice);

    const candidate = ice.candidate;
    const sdpMLineIndex = ice.sdpMLineIndex;
    const sdpMid = ice.sdpMid;
    const peerConnection = this.connection.peerConnection;
    const provider = this.connection.provider;

    try {
      const ctr: typeof RTCIceCandidate = this.webRtc.RTCIceCandidate;

      await peerConnection.addIceCandidate(
        new ctr({
          sdpMid: sdpMid,
          sdpMLineIndex: sdpMLineIndex,
          candidate: candidate,
        })
      );
      logger.log(`Added ICE candidate for:${this.connection.peer}`);
    } catch (err) {
      provider.emitError(PeerErrorType.WebRTC, err);
      logger.log('Failed to handleCandidate, ', err);
    }
  }

  private _addTracksToConnection(stream: MediaStream, peerConnection: RTCPeerConnection): void {
    logger.log(`add tracks from stream ${stream.id} to peer connection`);

    if (!peerConnection.addTrack) {
      return logger.error(`Your browser does't support RTCPeerConnection#addTrack. Ignored.`);
    }

    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });
  }

  private _addStreamToMediaConnection(stream: MediaStream, mediaConnection: MediaConnection): void {
    logger.log(`add stream ${stream.id} to media connection ${mediaConnection.connectionId}`);

    mediaConnection.addStream(stream);
  }
}
