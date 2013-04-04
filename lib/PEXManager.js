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

  this.connections = connections;

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
	if(this.connections[message.dst] === undefined){
		for(var key in this.connections){
			this.connections[key]['pex'].send(message);
		}
	} else {
		this.connections[message.dst]['pex'].send(message);
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
      util.log('Received ICE candidates.');
      util.log(evt.candidates);
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
    self.emit('connection', connection);*/
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
      util.log('Failed to setLocalDescription, ', err);
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