/**
 * Manages all negotiations between Peers.
 */
// TODO: LOCKS.
// TODO: FIREFOX new PC after offer made for DC.
var Negotiator = {
  pcs: {
    data: {},
    media: {}
  }, // type => {peer_id: {pc_id: pc}}.
  //providers: {}, // provider's id => providers (there may be multiple providers/client.
  queue: [] // connections that are delayed due to a PC being in use.
}

Negotiator._idPrefix = 'pc_'

/** Returns a PeerConnection object set up correctly (for data, media). */
// Options preceeded with _ are ones we add artificially.
Negotiator.startConnection = function(connection, options) {
  //Negotiator._addProvider(provider);
  var pc = Negotiator._getPeerConnection(connection, options);

  if (connection.type === 'media' && options._stream) {
    // Add the stream.
    pc.addStream(options._stream);
  }

  // What do we need to do now?
  if (options.originator) {
    if (connection.type === 'data') {
      // Create the datachannel.
      var dc = pc.createDataChannel(options.label, {reliable: reliable});
      connection.initialize(dc);
    }

    if (!util.supports.onnegotiationneeded) {
      Negotiator._makeOffer(connection);
    }
  } else {
    Negotiator.handleSDP('OFFER', connection, options.sdp);
  }

  return pc;
}

Negotiator._getPeerConnection = function(connection, options) {
  if (!Negotiator.pcs[connection.type]) {
    util.error(connection.type + ' is not a valid connection type. Maybe you overrode the `type` property somewhere.');
  }

  if (!Negotiator.pcs[connection.type][connection.peer]) {
    Negotiator.pcs[connection.type][connection.peer] = {};
  }
  peer_connections = Negotiator.pcs[connection.type][connection.peer];

  var pc;
  if (options.multiplex) {
    // Find an existing PC to use.
    ids = Object.keys(peer_connections);
    for (var i = 0, ii = ids.length; i < ii; i += 1) {
      pc = peer_connections[ids[i]];
      if (pc.signalingState === 'stable') {
        break; // We can go ahead and use this PC.
      }
    }
  } else if (options.pc) { // Simplest case: PC id already provided for us.
    pc = Negotiator.pcs[connection.type][connection.peer][options.pc];
  }

  if (!pc || pc.signalingState !== 'stable') {
    pc = Negotiator._startPeerConnection(connection);
  }
  return pc;
}

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
  util.log('Creating RTCPeerConnection.');

  var id = Negotiator._idPrefix + util.randomToken();
  pc = new RTCPeerConnection(connection.provider.options.config, {optional: [{RtpDataChannels: true}]});
  Negotiator.pcs[connection.type][connection.peer][id] = pc;

  Negotiator._setupListeners(connection, pc, id);

  return pc;
}

/** Set up various WebRTC listeners. */
Negotiator._setupListeners = function(connection, pc, pc_id) {
  var peer_id = connection.peer;
  var connection_id = connection.id;
  var provider = connection.provider;

  // ICE CANDIDATES.
  util.log('Listening for ICE candidates.');
  pc.onicecandidate = function(evt) {
    if (evt.candidate) {
      util.log('Received ICE candidates.');
      provider.socket.send({
        type: 'CANDIDATE',
        payload: {
          candidate: evt.candidate,
          connection_id: connection.id
        },
        dst: peer_id,
      });
    }
  };

  pc.oniceconnectionstatechange = function() {
    switch (pc.iceConnectionState) {
      case 'failed':
        util.log('iceConnectionState is disconnected, closing connections to ' + peer_id);
        Negotiator._cleanup();
        break;
      case 'completed':
        pc.onicecandidate = util.noop;
        break;
    }
  };

  // Fallback for older Chrome impls.
  pc.onicechange = pc.oniceconnectionstatechange;

  // ONNEGOTIATIONNEEDED (Chrome)
  util.log('Listening for `negotiationneeded`');
  pc.onnegotiationneeded = function() {
    util.log('`negotiationneeded` triggered');
    Negotiator._makeOffer(connection);
  };

  // DATACONNECTION.
  util.log('Listening for data channel');
  // Fired between offer and answer, so options should already be saved
  // in the options hash.
  pc.ondatachannel = function(evt) {
    util.log('Received data channel');
    var dc = evt.channel;
    var connection = provider.getConnection(peer_id, connection_id);
    connection.initialize(dc);
  };

  // MEDIACONNECTION.
  util.log('Listening for remote stream');
  pc.onaddstream = function(evt) {
    util.log('Received remote stream');
    var stream = evt.stream;
    provider.getConnection(peer_id, id).receiveStream(stream);
  };
}

Negotiator._cleanup = function(provider, peer_id, connection_id) {
  // TODO
  util.log('Cleanup PeerConnection for ' + peer_id);
  if (!!this.pc && (this.pc.readyState !== 'closed' || this.pc.signalingState !== 'closed')) {
    this.pc.close();
    this.pc = null;
  }

  provider.socket.send({
    type: 'LEAVE',
    dst: peer_id
  });
}

Negotiator._makeOffer = function(connection) {
  var pc = connection.pc;

  pc.createOffer(function(offer) {
    util.log('Created offer.');

    if (!util.supports.reliable) {
      //offer.sdp = Reliable.higherBandwidthSDP(offer.sdp);
    }

    pc.setLocalDescription(offer, function() {
      util.log('Set localDescription to offer');
      connection.provider.socket.send({
        type: 'OFFER',
        payload: {
          sdp: offer,
          connection_id: connection.id
        },
        dst: connection.peer,
      });
    }, function(err) {
      connection.provider.emit('error', err);
      util.log('Failed to setLocalDescription, ', err);
    });
  }, function(err) {
    connection.provider.emit('error', err);
    util.log('Failed to createOffer, ', err);
  });
}

Negotiator._makeAnswer = function(connection) {
  var pc = connection.pc;

  pc.createAnswer(function(answer) {
    util.log('Created answer.');

    if (!util.supports.reliable) {
      // TODO
      //answer.sdp = Reliable.higherBandwidthSDP(answer.sdp);
    }

    pc.setLocalDescription(answer, function() {
      util.log('Set localDescription to answer.');
      connection.provider.socket.send({
        type: 'ANSWER',
        payload: {
          sdp: answer,
          connection_id: connection.id
        },
        dst: connection.peer
      });
    }, function(err) {
      connection.provider.emit('error', err);
      util.log('Failed to setLocalDescription, ', err);
    });
  }, function(err) {
    connection.provider.emit('error', err);
    util.log('Failed to create answer, ', err);
  });
}

/** Handle an SDP. */
Negotiator.handleSDP = function(type, connection, sdp) {
  sdp = new RTCSessionDescription(sdp);
  var pc = connection.pc;

  pc.setRemoteDescription(sdp, function() {
    util.log('Set remoteDescription: ' + type);

    if (type === 'OFFER') {
      if (connection.type === 'media') {
        if (connection.localStream) {
          // Add local stream (from answer).
          pc.addStream(connection.localStream);
        }
        util.setZeroTimeout(function(){
          // Add remote streams
          connection.addStream(pc.getRemoteStreams()[0]);
        });
      }
      // TODO. also, why setZeroTimeout up there?
      Negotiator._makeAnswer();
    }
  }, function(err) {
    connection.provider.emit('error', err);
    util.log('Failed to setRemoteDescription, ', err);
  });
}

/** Handle a candidate. */
Negotiator.handleCandidate = function(connection, candidate) {
  var candidate = new RTCIceCandidate(candidate);
  connection.pc.addIceCandidate(candidate);
  util.log('Added ICE candidate.');
}

/** Handle peer leaving. */
Negotiator.handleLeave = function(connection) {
  util.log('Peer ' + connection.peer + ' disconnected.');
  // TODO: clean up PC if this is the last connection on that PC.
}
