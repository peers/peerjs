
Peer.prototype.pex = {};

Peer.prototype.initPEX = function(){
	this.pex._setupListeners(this);
	this.pex.queue = {};
	this.pex.peer = this;
}

Peer.prototype.pex._setupListeners = function(peer) {
	var self = this;
	//set up listeners on the right channels?
	for(var key in peer.connections){
		self.setupPEXChannel(key);
	}
	peer.on('connection', function setupBroker(connection, meta) {
		if(connection.getLabel() == 'pex'){
			console.log('got pex connection from '+ connection.getPeer());
			connection.on('data', function(data){
				//console.log('pex got: ');
				console.log(data);
				self._handlePEXJSONMessage(data);
			});
			self._unqueue(connection.getPeer());
		} else if(peer.connections[connection.getPeer()]['pex'] === undefined){
			if(connection.metadata && connection.metadata.pex){
				/*
				//I'm leaving this out because it complicates things.. also since there's clearly already a path
				//between the two peers we don't need a driect pex connection
				var channel = peer.pex.connect(connection.getPeer(), {label: 'pex', serialization: 'none', reliable: true});
				channel.on('data', function(data){
					console.log(data);
					self._handlePEXJSONMessage(data);
				});
				self._unqueue(channel.getPeer());
				*/
			} else {
				console.log("creating pex connection to " + connection.getPeer());
				var channel = self.peer.connect(connection.getPeer(), {label: 'pex', serialization: 'none', reliable: true});
				channel.on('data', function(data){
					console.log(data);
					self._handlePEXJSONMessage(data);
				});
				self._unqueue(channel.getPeer());
			}
		}
	});
};
/*
pex.broker.prototype.setupPEXChannel = function(peer){
	var self = this;
	if(self.peer.connections[peer]['pex'] === undefined){
		//console.log('creating pex connection to '+ peer);
		//honest truth is I have no idea how much of this will work when the server is down.. i'd like it all to
		//console.log('pex broker trying to setup channel to '+peer);
		var channel = self.peer.connect(peer, {label: 'pex', serialization: 'none', reliable: true});
		channel.on('data', function(data){
			//console.log('pex got: ');
			//console.log(data);
			self._handlePEXJSONMessage(data);
		});
		self._unqueue(channel.getPeer());
	}
};
*/
Peer.prototype.pex._unqueue = function(peer){
	var self = this;
	if(self.queue.hasOwnProperty(peer)){
		while(self.queue[peer].length){
			self._send(peer, self.queue[peer].pop());
		}
		delete self.queue[peer]
	}
};

Peer.prototype.pex._send = function(peer, message){
	var self = this;
	var connection = self.peer.connections[peer]['pex'];
	if(connection){
		console.log("sending");
		//console.log(connection);
		if(!connection.isOpen()){
			connection.once('open', function(){
				console.log("waiting for open");
				//console.log(connection);
				connection.send(message);
			});
		} else {
			console.log('already open');
			//console.log(connection);
			connection.send(message);
		}
	} else {
		console.log('queing');
		//console.log(message);
		if(self.queue.hasOwnProperty(peer)){
			self.queue[peer].push(message);
		} else {
			self.queue[peer] = [message];
		}
	}
};

Peer.prototype.pex._forward = function(message){
	var self = this;
	var last = message.last;
	//console.log("forward!");
	//console.log(message);
	message.last = self.peer.getId();
	if(self.peer.connections[message.dst]['pex'] === undefined){
		for(var key in self.peer.connections){
			if(key !== message.src && key !== last){
				//send on the pex label
				self._send(key, JSON.stringify(message));
			}
		}
	} else {
		//console.log("trying to send direct");
		self._send(message.dst, JSON.stringify(message));
	}
};

Peer.prototype.pex._handlePEXJSONMessage = function(data) {
  var self = this;
  var message = JSON.parse(data);
  //console.log('message destination: '+message.dst);
  if(message.dst != self.peer.getId()){
  	return self._forward(message);
  }

  //console.log("I'm the dst peer!");
  
  var peer = message.src;
  var manager = self.peer.managers[peer];
  var payload = message.payload;

  // Check that browsers match.
  if (!!payload && !!payload.browserisms && payload.browserisms !== util.browserisms) {
    self.peer._warn('incompatible-peer', 'Peer ' + self.peer + ' is on an incompatible browser. Please clean up this peer.');
  }

  switch (message.type) {
    case 'OFFER':
        var options = {
          sdp: payload.sdp,
          labels: payload.labels,
          config: self.peer._options.config
        };

        var manager = self.peer.managers[peer];
        if (!manager) {
          util.log('creating a pex manager');
          manager = new PeerExchangeManager(self.peer.getId(), peer, self.peer.connections, options);
          self.peer._attachManagerListeners(manager);//are there differenct listeners?
          self.peer.managers[peer] = manager;
          self.peer.connections[peer] = {};
        }
        manager.update(options.labels);
        manager.handleSDP(payload.sdp, message.type);
        break;
      
    case 'EXPIRE':
      if (manager) {
        manager.close();
        manager.emit('error', new Error('Could not connect to peer ' + manager.peer));
      }
      break;
    case 'ANSWER':
      if (manager) {
        manager.handleSDP(payload.sdp, message.type);
      }
      break;
    case 'CANDIDATE':
      if (manager) {
        manager.handleCandidate(payload);
      }
      break;
    case 'LEAVE':
      if (manager) {
        manager.handleLeave();
      }
      break;
    case 'PORT':
      // Firefoxism: exchanging ports.
      if (util.browserisms === 'Firefox' && manager) {
        manager.handlePort(payload);
        break;
      }
    default:
      util.log('Unrecognized message type:', message.type);
      break;
  }
};


/**
 * Manages DataConnections between its peer and one other peer.
 * Internally, manages PeerConnection.
 */
function PeerExchangeManager(id, peer, connections, options) {
  if (!(this instanceof PeerExchangeManager)) return new PeerExchangeManager(id, options);
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

util.inherits(PeerExchangeManager, EventEmitter);

PeerExchangeManager.prototype._send = function(message) {
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

PeerExchangeManager.prototype.initialize = function(id) {
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
PeerExchangeManager.prototype._startPeerConnection = function() {
  util.log('Creating RTCPeerConnection');
  this.pc = new RTCPeerConnection(this._options.config, { optional: [ { RtpDataChannels: true } ]});
};

/** Set up ICE candidate handlers. */
PeerExchangeManager.prototype._setupIce = function() {
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
PeerExchangeManager.prototype._setupDataChannel = function() {
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

PeerExchangeManager.prototype._makeAnswer = function() {
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
PeerExchangeManager.prototype._cleanup = function() {
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

PeerExchangeManager.prototype._attachConnectionListeners = function(connection) {
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

PeerExchangeManager.prototype._processQueue = function() {
  var conn = this._queued.pop();
  if (!!conn) {
    conn.addDC(this.pc.createDataChannel(conn.label, { reliable: false }));
  }
};

/** Set up onnegotiationneeded. */
PeerExchangeManager.prototype._setupNegotiationHandler = function() {
  var self = this;
  util.log('Listening for `negotiationneeded`');
  this.pc.onnegotiationneeded = function() {
    util.log('`negotiationneeded` triggered');
    self._makeOffer();
  };
};

/** Send an offer for peer exchange. */
PeerExchangeManager.prototype._makeOffer = function() {
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
PeerExchangeManager.prototype.handlePort = function(ports) {
  util.log('Received ports, calling connectDataConnection.');
  if (!PeerExchangeManager.usedPorts) {
    PeerExchangeManager.usedPorts = [];
  }
  PeerExchangeManager.usedPorts.push(ports.local);
  PeerExchangeManager.usedPorts.push(ports.remote);
  this.pc.connectDataConnection(ports.local, ports.remote);
};

/** Handle an SDP. */
PeerExchangeManager.prototype.handleSDP = function(sdp, type) {
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
PeerExchangeManager.prototype.handleCandidate = function(message) {
  var candidate = new RTCIceCandidate(message.candidate);
  this.pc.addIceCandidate(candidate);
  util.log('Added ICE candidate.');
};

/** Handle peer leaving. */
PeerExchangeManager.prototype.handleLeave = function() {
  util.log('Peer ' + this.peer + ' disconnected.');
  this.close();
};

/** Closes manager and all related connections. */
PeerExchangeManager.prototype.close = function() {
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
PeerExchangeManager.prototype.connect = function(options) {
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
PeerExchangeManager.prototype.update = function(updates) {
  var labels = Object.keys(updates);
  for (var i = 0, ii = labels.length; i < ii; i += 1) {
    var label = labels[i];
    this.labels[label] = updates[label];
  }
};

/** Exposed connect function for users. Will try to connect later if user
 * is waiting for an ID. */
//This gives you access to the connection info, you can broadcast it however you'd like
Peer.prototype.pex.connect = function(peer, options) {
  util.log("using peer exchange to connect");

  options = util.extend({
    config: this.peer._options.config
  }, options);
  options.originator = true;

  options.metadata = {pex: true};

  var manager = this.peer.managers[peer];
  if(!manager){
    console.log("creating a new pex manager");
    manager = new PeerExchangeManager(this.peer.id, peer, this.peer.connections, options);
    this.peer._attachManagerListeners(manager);
    this.peer.managers[peer] = manager;
    this.peer.connections[peer] = {};
  } else {
  	console.log("what the hell?");
  }

  var connectionInfo = manager.connect(options);
  if (!!connectionInfo) {
    //console.log('heres the new connection by pex');
    //console.log(connectionInfo);
    this.peer.connections[peer][connectionInfo[0]] = connectionInfo[1];
  }

  if (!this.peer.id) {
    this.peer._queued.push(manager);
  }
  /*if(this.broker){
    var self = this;
    connectionInfo[1].on('open', function(){
      self.broker.setupPEXChannel(peer);
    });
  }*/
  return connectionInfo[1];
};