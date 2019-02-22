import { util } from "./util";
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate
} from "./adapter";

/**
 * Manages all negotiations between Peers.
 */
export const Negotiator = {
  pcs: {
    data: {},
    media: {}
  }, // type => {peerId: {pc_id: pc}}.
  //providers: {}, // provider's id => providers (there may be multiple providers/client.
  queue: [] // connections that are delayed due to a PC being in use.
};

Negotiator._idPrefix = "pc_";

/** Returns a PeerConnection object set up correctly (for data, media). */
Negotiator.startConnection = function(connection, options) {
  var pc = Negotiator._getPeerConnection(connection, options);

  // Set the connection's PC.
  connection.pc = connection.peerConnection = pc;

  if (connection.type === "media" && options._stream) {
    addStreamToConnection(options._stream, pc);
  }

  // What do we need to do now?
  if (options.originator) {
    if (connection.type === "data") {
      // Create the datachannel.
      var config = {};
      // Dropping reliable:false support, since it seems to be crashing
      // Chrome.
      /*if (util.supports.sctp && !options.reliable) {
        // If we have canonical reliable support...
        config = {maxRetransmits: 0};
      }*/
      // Fallback to ensure older browsers don't crash.
      if (!util.supports.sctp) {
        config = { reliable: options.reliable };
      }
      var dc = pc.createDataChannel(connection.label, config);
      connection.initialize(dc);
    }

    Negotiator._makeOffer(connection);
  } else {
    Negotiator.handleSDP("OFFER", connection, options.sdp);
  }
};

Negotiator._getPeerConnection = function(connection, options) {
  if (!Negotiator.pcs[connection.type]) {
    util.error(
      connection.type +
        " is not a valid connection type. Maybe you overrode the `type` property somewhere."
    );
  }

  if (!Negotiator.pcs[connection.type][connection.peer]) {
    Negotiator.pcs[connection.type][connection.peer] = {};
  }
  var peerConnections = Negotiator.pcs[connection.type][connection.peer];

  var pc;
  // Not multiplexing while FF and Chrome have not-great support for it.
  /*if (options.multiplex) {
    ids = Object.keys(peerConnections);
    for (var i = 0, ii = ids.length; i < ii; i += 1) {
      pc = peerConnections[ids[i]];
      if (pc.signalingState === 'stable') {
        break; // We can go ahead and use this PC.
      }
    }
  } else */
  if (options.pc) {
    // Simplest case: PC id already provided for us.
    pc = Negotiator.pcs[connection.type][connection.peer][options.pc];
  }

  if (!pc || pc.signalingState !== "stable") {
    pc = Negotiator._startPeerConnection(connection);
  }
  return pc;
};

/*
Negotiator._addProvider = function(provider) {
  if ((!provider.id && !provider.disconnected) || !provider.socket.open) {
    // Wait for provider to obtain an ID.
    provider.on('open', function(id) {
      Negotiator._addProvider(provider);
    });
  } else {
    Negotiator.providers[provider.id] = provider;
  }
}*/

/** Start a PC. */
Negotiator._startPeerConnection = function(connection) {
  util.log("Creating RTCPeerConnection.");

  var id = Negotiator._idPrefix + util.randomToken();
  var optional = {};

  if (connection.type === "data" && !util.supports.sctp) {
    optional = { optional: [{ RtpDataChannels: true }] };
  } else if (connection.type === "media") {
    // Interop req for chrome.
    optional = { optional: [{ DtlsSrtpKeyAgreement: true }] };
  }

  var pc = new RTCPeerConnection(connection.provider.options.config, optional);
  Negotiator.pcs[connection.type][connection.peer][id] = pc;

  Negotiator._setupListeners(connection, pc, id);

  return pc;
};

/** Set up various WebRTC listeners. */
Negotiator._setupListeners = function(connection, pc, pc_id) {
  var peerId = connection.peer;
  var connectionId = connection.id;
  var provider = connection.provider;

  // ICE CANDIDATES.
  util.log("Listening for ICE candidates.");
  pc.onicecandidate = function(evt) {
    if (evt.candidate) {
      util.log("Received ICE candidates for:", connection.peer);
      provider.socket.send({
        type: "CANDIDATE",
        payload: {
          candidate: evt.candidate,
          type: connection.type,
          connectionId: connection.id
        },
        dst: peerId
      });
    }
  };

  pc.oniceconnectionstatechange = function() {
    switch (pc.iceConnectionState) {
      case "failed":
        util.log(
          "iceConnectionState is disconnected, closing connections to " + peerId
        );
        connection.emit(
          "error",
          new Error("Negotiation of connection to " + peerId + " failed.")
        );
        connection.close();
        break;
      case "disconnected":
        util.log(
          "iceConnectionState is disconnected, closing connections to " + peerId
        );
        break;
      case "completed":
        pc.onicecandidate = util.noop;
        break;
    }
  };

  // Fallback for older Chrome impls.
  pc.onicechange = pc.oniceconnectionstatechange;

  // DATACONNECTION.
  util.log("Listening for data channel");
  // Fired between offer and answer, so options should already be saved
  // in the options hash.
  pc.ondatachannel = function(evt) {
    util.log("Received data channel");
    var dc = evt.channel;
    var connection = provider.getConnection(peerId, connectionId);
    connection.initialize(dc);
  };

  // MEDIACONNECTION.
  util.log("Listening for remote stream");
  pc.ontrack = function(evt) {
    util.log("Received remote stream");
    var stream = evt.streams[0];
    var connection = provider.getConnection(peerId, connectionId);
    if (connection.type === "media") {
      addStreamToConnection(stream, connection);
    }
  };
};

Negotiator.cleanup = function(connection) {
  util.log("Cleaning up PeerConnection to " + connection.peer);

  var pc = connection.pc;

  if (
    !!pc &&
    ((pc.readyState && pc.readyState !== "closed") ||
      pc.signalingState !== "closed")
  ) {
    pc.close();
    connection.pc = null;
  }
};

Negotiator._makeOffer = function(connection) {
  var pc: RTCPeerConnection = connection.pc;
  const callback = function(offer) {
    util.log("Created offer.");

    if (
      !util.supports.sctp &&
      connection.type === "data" &&
      connection.reliable
    ) {
      offer.sdp = Reliable.higherBandwidthSDP(offer.sdp);
    }
    const descCallback = function() {
      util.log("Set localDescription: offer", "for:", connection.peer);
      connection.provider.socket.send({
        type: "OFFER",
        payload: {
          sdp: offer,
          type: connection.type,
          label: connection.label,
          connectionId: connection.id,
          reliable: connection.reliable,
          serialization: connection.serialization,
          metadata: connection.metadata,
          browser: util.browser
        },
        dst: connection.peer
      });
    }
    const descError = function(err) {
      // TODO: investigate why _makeOffer is being called from the answer
      if (
        err !=
        "OperationError: Failed to set local offer sdp: Called in wrong state: kHaveRemoteOffer"
      ) {
        connection.provider.emitError("webrtc", err);
        util.log("Failed to setLocalDescription, ", err);
      }
    }
    pc.setLocalDescription(offer)
    .then(() => descCallback())
    .catch(err => descError(err));
  }
  const errorHandler = function(err) {
    connection.provider.emitError("webrtc", err);
    util.log("Failed to createOffer, ", err);
  }
  pc.createOffer(connection.options.constraints)
    .then(offer => callback(offer))
    .catch(err => errorHandler(err));
};

Negotiator._makeAnswer = function(connection) {
  var pc: RTCPeerConnection = connection.pc;
  const callback = function(answer) {
    util.log("Created answer.");

    if (
      !util.supports.sctp &&
      connection.type === "data" &&
      connection.reliable
    ) {
      answer.sdp = Reliable.higherBandwidthSDP(answer.sdp);
    }

    const descCallback = function() {
      util.log("Set localDescription: answer", "for:", connection.peer);
      connection.provider.socket.send({
        type: "ANSWER",
        payload: {
          sdp: answer,
          type: connection.type,
          connectionId: connection.id,
          browser: util.browser
        },
        dst: connection.peer
      });
    }
    pc.setLocalDescription(answer)
    .then(() => descCallback())
    .catch(err => {
        connection.provider.emitError("webrtc", err);
        util.log("Failed to setLocalDescription, ", err);
      });
  };
  pc.createAnswer()
  .then(answer => callback(answer))
  .catch(err => {
    connection.provider.emitError("webrtc", err);
    util.log("Failed to create answer, ", err);
  });
};

/** Handle an SDP. */
Negotiator.handleSDP = function(type, connection, sdp) {
  sdp = new RTCSessionDescription(sdp);
  const pc: RTCPeerConnection = connection.pc;

  util.log("Setting remote description", sdp);

  const callback = function() {
    util.log("Set remoteDescription:", type, "for:", connection.peer);

    if (type === "OFFER") {
      Negotiator._makeAnswer(connection);
    }
  };

  pc.setRemoteDescription(sdp)
  .then(() => callback())
  .catch(err => {
      connection.provider.emitError("webrtc", err);
      util.log("Failed to setRemoteDescription, ", err);
    }
  );
};

/** Handle a candidate. */
Negotiator.handleCandidate = function(connection, ice) {
  var candidate = ice.candidate;
  var sdpMLineIndex = ice.sdpMLineIndex;
  connection.pc.addIceCandidate(
    new RTCIceCandidate({
      sdpMLineIndex: sdpMLineIndex,
      candidate: candidate
    })
  );
  util.log("Added ICE candidate for:", connection.peer);
};

function addStreamToConnection(stream: MediaStream, connection: RTCPeerConnection) {
  if ('addTrack' in connection) {
    stream.getTracks().forEach(track => {
      connection.addTrack(track, stream);
    });
  } else if ('addStream' in connection) {
    (<any>connection).addStream(stream);
  }
}
