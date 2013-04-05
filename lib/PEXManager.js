/**
 * Manages DataConnections between its peer and one other peer.
 * Internally, manages PeerConnection.
 */
function PEXManager(id, peer, connections, options) {
  if (!(this instanceof PEXManager)) return new PEXManager(id, options);
  EventEmitter.call(this);

  options = util.extend({
    config: { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] }
  }, options);
  this._options = options;

  // PeerConnection is not yet dead.
  this.open = true;

  this.peerConnections = connections;

  this.id = id; //local peer
  this.peer = peer; //remote peer
  this.pc = null;

  // Mapping labels to metadata and serialization.
  // label => { metadata: ..., serialization: ..., reliable: ...}
  this.labels = {};
  // A default label in the event that none are passed in.
  this._default = 0;

  // DataConnections on this PC.
  this.connections = {};
  this._queued = [];

  if (!!this.id) {
    this.initialize();
  }
};

util.inherits(PEXManager, EventEmitter);

PEXManager.prototype._send = function(message) {
	message.dst = this.peer;
	message.src = this.id;
	////console.log(this.connections);
	function sendWhenReady(connection){
		if(connection){
			if(!connection.isOpen()){
				connection.once('open', function(){
					//console.log("pex sending on open");
					//console.log(message);
					//console.log('to '+ connection.getPeer());
					connection.send(message);
				});
			} else {
				//console.log("pex sending");
				//console.log(JSON.stringify(message));
				//console.log('to '+ connection.getPeer());
				//console.log(connection);
				connection.send(JSON.stringify(message));//wish I could move this to the broker
			}
		} else {
			util.log("something's wrong with the pex connection");
		}
	}
	if(this.peerConnections[message.dst]['pex'] === undefined){
		for(var key in this.peerConnections){
			if(key != message.dst)
				sendWhenReady(this.peerConnections[key]['pex']);
		}
	} else {
		sendWhenReady(this.peerConnections[message.dst]['pex']);
	}
};

PEXManager.prototype.initialize = function(id) {
  if (!!id) {
    this.id = id;
  }

  // Firefoxism where ports need to be generated.
  /*if (util.browserisms === 'Firefox') {
    this._firefoxPortSetup();
  }*/

  // Set up PeerConnection.
  this._startPeerConnection();

  // Process queued DCs.
  if (util.browserisms !== 'Firefox') {
    this._processQueue();
  }

  // Listen for ICE candidates.
  this._setupIce();

  // Listen for data channel.
  this._setupDataChannel();

  // Listen for negotiation needed.
  // Chrome only--Firefox instead has to manually makeOffer.
  if (util.browserisms !== 'Firefox') {
    this._setupNegotiationHandler();
  } else if (this._options.originator) {
  //  this._firefoxHandlerSetup()
  //  this._firefoxAdditional()
  }

  this.initialize = function() { };
};

/** Start a PC. */
PEXManager.prototype._startPeerConnection = function() {
  util.log('Creating RTCPeerConnection');
  this.pc = new RTCPeerConnection(this._options.config, { optional: [ { RtpDataChannels: true } ]});
};

/** Set up ICE candidate handlers. */
PEXManager.prototype._setupIce = function() {
  util.log('Listening for ICE candidates.');
  var self = this;
  this.pc.onicecandidate = function(evt) {
    if (evt.candidate) {
      self._send({
        type: 'CANDIDATE',
        payload: {
          candidate: evt.candidate
        }
      });
    }
  };
};

/** Set up Data Channel listener. */
PEXManager.prototype._setupDataChannel = function() {
  var self = this;
  util.log('Listening for data channel');
  this.pc.ondatachannel = function(evt) {
    util.log('Received data channel');
    util.log(evt);
    // Firefoxism: ondatachannel receives channel directly. NOT TO SPEC.
    var dc = util.browserisms === 'Firefox' ? evt : evt.channel;
    var label = dc.label;

    // This should not be empty.
    // NOTE: Multiple DCs are currently not configurable in FF. Will have to
    // come up with reasonable defaults.
    var options = self.labels[label] || { label: label };
    var connection  = new DataConnection(self.peer, dc, options);
    delete self.labels[label];

    self._attachConnectionListeners(connection);
    self.connections[label] = connection;
    self.emit('connection', connection);
  };
};

PEXManager.prototype._makeAnswer = function() {
  var self = this;
  this.pc.createAnswer(function(answer) {
    util.log('Created answer.');
    self.pc.setLocalDescription(answer, function() {
      util.log('Set localDescription to answer.');
      self._send({
        type: 'ANSWER',
        payload: {
          browserisms: util.browserisms,
          sdp: answer
        }
      });
    }, function(err) {
      self.emit('error', err);
      util.log('Failed to setLocalDescription from PEX, ', err); //why is this fireing on the broker?
    });
  }, function(err) {
    self.emit('error', err);
    util.log('Failed to create answer, ', err);
  });
};

/** Clean up PC, close related DCs. */
PEXManager.prototype._cleanup = function() {
  util.log('Cleanup ConnectionManager for ' + this.peer);
  if (!!this.pc && this.pc.readyState !== 'closed') {
    this.pc.close();
    this.pc = null;
  }

  var self = this;
  this._send({
    type: 'LEAVE'
  });

  this.open = false;
  this.emit('close');
};

PEXManager.prototype._attachConnectionListeners = function(connection) {
  var self = this;
  connection.on('close', function() {
    if (!!self.connections[connection.label]) {
      delete self.connections[connection.label];
    }

    if (!Object.keys(self.connections).length) {
      self._cleanup();
    }
  });
  connection.on('open', function() {
    self._lock = false;
    self._processQueue();
  });
};

PEXManager.prototype._processQueue = function() {
  var conn = this._queued.pop();
  if (!!conn) {
    conn.addDC(this.pc.createDataChannel(conn.label, { reliable: false }));
  }
};

/** Set up onnegotiationneeded. */
PEXManager.prototype._setupNegotiationHandler = function() {
  var self = this;
  util.log('Listening for `negotiationneeded`');
  this.pc.onnegotiationneeded = function() {
    util.log('`negotiationneeded` triggered');
    self._makeOffer();
  };
};

/** Send an offer for peer exchange. */
PEXManager.prototype._makeOffer = function() {
  var self = this;
  this.pc.createOffer(function setLocal(offer) {
    self.pc.setLocalDescription(offer, function() {
      util.log('Set localDescription to offer');
      util.log('Created offer.');
      util.log(offer);
      self._send({
        type: 'OFFER',  //Label for the message switch
        payload: {
          browserisms: util.browserisms, //browser specific stuff
          sdp: offer,                    //the info to connect to this peer
          config: self._options.config,  //connection config info
          labels: self.labels            //not sure
        }
      });
      // We can now reset labels because all info has been communicated.
      self.labels = {};
    }, function handleError(err) {
      self.emit('error', err);
      util.log('Failed to setLocalDescription, ', err);
    });
  });
};

//Public methods

/** Firefoxism: handle receiving a set of ports. */
PEXManager.prototype.handlePort = function(ports) {
  util.log('Received ports, calling connectDataConnection.');
  if (!PEXManager.usedPorts) {
    PEXManager.usedPorts = [];
  }
  PEXManager.usedPorts.push(ports.local);
  PEXManager.usedPorts.push(ports.remote);
  this.pc.connectDataConnection(ports.local, ports.remote);
};

/** Handle an SDP. */
PEXManager.prototype.handleSDP = function(sdp, type) {
  if (util.browserisms !== 'Firefox') {
    // Doesn't need to happen for FF.
    sdp = new RTCSessionDescription(sdp);
  }

  var self = this;
  this.pc.setRemoteDescription(sdp, function() {
    util.log('Set remoteDescription: ' + type);
    if (type === 'OFFER') {
      if (util.browserisms === 'Firefox') {
        self._firefoxAdditional();
      } else {
        self._makeAnswer();
      }
    } else if (util.browserisms === 'Firefox') {
      // Firefoxism.
      util.log('Peer ANSWER received, connectDataConnection called.');
      self.pc.connectDataConnection(self._localPort, self._remotePort);
      self._send({
        type: 'PORT',
        payload: {
          remote: self._localPort,
          local: self._remotePort
        }
      });
    }
  }, function(err) {
    self.emit('error', err);
    util.log('Failed to setRemoteDescription, ', err);
  });
};

/** Handle a candidate. */
PEXManager.prototype.handleCandidate = function(message) {
  var candidate = new RTCIceCandidate(message.candidate);
  this.pc.addIceCandidate(candidate);
  util.log('Added ICE candidate.');
};

/** Handle peer leaving. */
PEXManager.prototype.handleLeave = function() {
  util.log('Peer ' + this.peer + ' disconnected.');
  this.close();
};

/** Closes manager and all related connections. */
PEXManager.prototype.close = function() {
  if (!this.open) {
    this.emit('error', new Error('Connections to ' + this.peer + 'are already closed.'));
    return;
  }

  var labels = Object.keys(this.connections);
  for (var i = 0, ii = labels.length; i < ii; i += 1) {
    var label = labels[i];
    var connection = this.connections[label];
    connection.close();
  }
  this.connections = null;
  this._cleanup();
};

/** Create and returns a DataConnection with the peer with the given label. */
PEXManager.prototype.connect = function(options) {
  if (!this.open) {
    return;
  }

  options = util.extend({
    label: 'peerjs'
  }, options);

  // Check if label is taken...if so, generate a new label randomly.
  while (!!this.connections[options.label]) {
    options.label = 'peerjs' + this._default;
    this._default += 1;
  }

  this.labels[options.label] = options;

  var dc;
  if (!!this.pc && !this._lock && (util.browserisms !== 'Firefox' || Object.keys(this.connections).length !== 0)) {
    dc = this.pc.createDataChannel(options.label, { reliable: false });
  }
  var connection = new DataConnection(this.peer, dc, options);
  this._attachConnectionListeners(connection);
  this.connections[options.label] = connection;

  if (!dc) {
    this._queued.push(connection);
  }

  this._lock = true
  return [options.label, connection];
};

/** Updates label:[serialization, reliable, metadata] pairs from offer. */
PEXManager.prototype.update = function(updates) {
  var labels = Object.keys(updates);
  for (var i = 0, ii = labels.length; i < ii; i += 1) {
    var label = labels[i];
    this.labels[label] = updates[label];
  }
};