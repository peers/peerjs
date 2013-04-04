//i guess this doesn't have to be a class
var PEXBroker = function(peer){
	this.peer = peer;
	this._setupListeners(peer);
}

PEXBroker.prototype._setupListeners = function(peer) {
	var self = this;
	//set up listeners on the right channels?
	for(var key in peer.connections){
		if(peer.connections[key]['pex'] === undefined){
			//honest truth is I have no idea how much of this will work when the server is down.. i'd like it all to
			var conn = peer.connect(key, {label: 'pex'});
			conn.on('data', self._handlePEXJSONMessage);
		}
	}
	peer.on('connection', function setupBroker(connection, meta) {
		console.log("setting up broker channel");
		if(peer.connections[connection.getPeer()]['pex'] === undefined){
			var conn = peer.connect(key, {label: 'pex'});
			conn.on('data', self._handlePEXJSONMessage);
		}
	});
};

PEXBroker.prototype._send = function(connection, message){
	if(!connection.isOpen()){
		connection.once('open', function(){
			connection.send(message);
		});
	} else {
		connection.send(message);
	}
};

PEXBroker.prototype._forward = function(message){
	var last = message.last;
	message.last = self.peer.getId();
	if(self.peer.connections[message.dst] === undefined){
		for(var key in self.peer.connections){
			if(key !== message.src && key !== last){
				//send on the pex label
				self._send(self.connections[key]['pex'], message);
			}
		}
	} else {
		self._send(self.connections[message.dst]['pex'], message);
	}
}

PEXBroker.prototype._handlePEXJSONMessage = function(message) {
  var self = this;
  var peer = message.src;
  var manager = this.peer.managers[peer];
  var payload = message.payload;

  // Check that browsers match.
  if (!!payload && !!payload.browserisms && payload.browserisms !== util.browserisms) {
    self.peer._warn('incompatible-peer', 'Peer ' + self.peer + ' is on an incompatible browser. Please clean up this peer.');
  }

  if(message.dst != self.peer.getId())
  	return self._forward(message);

  switch (message.type) {
    case 'OFFER':
        var options = {
          sdp: payload.sdp,
          labels: payload.labels,
          config: self.peer._options.config
        };

        var manager = self.peer.managers[peer];
        if (!manager) {
          manager = new PEXManager(self.peer.getId(), peer, self.peer.connections, options);
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