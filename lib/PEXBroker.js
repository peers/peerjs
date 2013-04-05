//i guess this doesn't have to be a class
var PEXBroker = function(peer){
	this.peer = peer;
	this._setupListeners(peer);
	this.queue = {};
}

PEXBroker.prototype._setupListeners = function(peer) {
	var self = this;
	//set up listeners on the right channels?
	for(var key in peer.connections){
		self.setupPEXChannel(key);
	}
	peer.on('connection', function setupBroker(connection, meta) {
		if(connection.getLabel() == 'pex'){
			console.log('creating pex connection to '+ connection.getPeer());
			connection.on('data', function(data){
				console.log('pex got: ');
				console.log(data);
				self._handlePEXJSONMessage(data);
			});
			self._unqueue(connection.getPeer());
		}
	});
};

PEXBroker.prototype._unqueue = function(peer){
	var self = this;
	if(self.queue.hasOwnProperty(peer)){
		while(self.queue[peer].length){
			self._send(peer, self.queue[peer].pop());
		}
		delete self.queue[peer]
	}
}

PEXBroker.prototype.setupPEXChannel = function(peer){
	var self = this;
	if(self.peer.connections[peer]['pex'] === undefined){
		console.log('creating pex connection to '+ peer);
		//honest truth is I have no idea how much of this will work when the server is down.. i'd like it all to
		console.log('pex broker trying to setup channel to '+peer);
		var channel = self.peer.connect(peer, {label: 'pex', serialization: 'none', reliable: true});
		channel.on('data', function(data){
			console.log('pex got: ');
			console.log(data);
			self._handlePEXJSONMessage(data);
		});
		self._unqueue(channel.getPeer());
	}
};

PEXBroker.prototype._send = function(peer, message){
	var self = this;
	var connection = self.peer.connections[peer]['pex'];
	if(connection){
		console.log("sending");
		console.log(connection);
		if(!connection.isOpen()){
			connection.once('open', function(){
				console.log("waiting for open");
				console.log(connection);
				connection.send(message);
			});
		} else {
			console.log('already open');
			console.log(connection);
			connection.send(message);
		}
	} else {
		console.log('queing');
		console.log(message);
		if(self.queue.hasOwnProperty(peer)){
			self.queue[peer].push(message);
		} else {
			self.queue[peer] = [message];
		}
	}
};

PEXBroker.prototype._forward = function(message){
	var self = this;
	var last = message.last;
	console.log("forward!");
	console.log(message);
	message.last = self.peer.getId();
	if(self.peer.connections[message.dst]['pex'] === undefined){
		for(var key in self.peer.connections){
			if(key !== message.src && key !== last){
				//send on the pex label
				self._send(key, JSON.stringify(message));
			}
		}
	} else {
		console.log("trying to send direct");
		self._send(message.dst, JSON.stringify(message));
	}
};

PEXBroker.prototype._handlePEXJSONMessage = function(data) {
  var self = this;
  var message = JSON.parse(data);
  console.log('message destination: '+message.dst);
  if(message.dst != self.peer.getId()){
  	return self._forward(message);
  }

  console.log("I'm the dst peer!");
  
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