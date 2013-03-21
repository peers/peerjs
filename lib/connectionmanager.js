/**
 * Manages DataConnections between its peer and one other peer.
 * Internally, manages PeerConnection.
 */
function ConnectionManager(id, peer, socket, options) {
  if (!(this instanceof ConnectionManager)) return new ConnectionManager(id, peer, socket, options);
  // TODO: need eventemitter?
  EventEmitter.call(this);

  options = util.extend({
    config: { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] },
    reliable: false,
    serialization: 'binary'
  }, options);
  this._options = options;

  // PeerConnection is not yet open.
  this.open = false;

  this.id = id;
  this.peer = peer;
  this.pc = null;

  // Mapping labels to metadata and serialization.
  this.metadatas = {};
  this.serializations = {};
  this.reliables = {};

  // DataConnections on this PC.
  this.connections = {};

  this._socket = socket;

  if (!!this.id) {
    this.initialize();
  }
};

util.inherits(ConnectionManager, EventEmitter);

ConnectionManager.prototype.initialize = function(id, socket) {
  if (!!id) {
    this.id = id;
  }
  if (!!socket) {
    this._socket = socket;
  }

  // Set up PeerConnection.
  this._startPeerConnection();

  // Listen for ICE candidates.
  this._setupIce();

  // Listen for negotiation needed.
  // Chrome only **
  this._setupNegotiationHandler();

  // Listen for data channel.
  this._setupDataChannel();

  this.initialize = function() { };
};

// Start a PC.
ConnectionManager.prototype._startPeerConnection = function() {
  util.log('Creating RTCPeerConnection');
  this.pc = new RTCPeerConnection(this._options.config, { optional: [ { rtpDataChannels: true } ]});
};

// Set up ICE candidate handlers.
ConnectionManager.prototype._setupIce = function() {
  util.log('Listening for ICE candidates.');
  var self = this;
  this.pc.onicecandidate = function(evt) {
    if (evt.candidate) {
      util.log('Received ICE candidates.');
      self._socket.send({
        type: 'CANDIDATE',
        payload: {
          candidate: evt.candidate
        },
        dst: self.peer
      });
    }
  };
};

// Set up onnegotiationneeded.
ConnectionManager.prototype._setupNegotiationHandler = function() {
  var self = this;
  util.log('Listening for `negotiationneeded`');
  this.pc.onnegotiationneeded = function() {
    util.log('`negotiationneeded` triggered');
    self._makeOffer();
  };
};

// Set up Data Channel listener.
ConnectionManager.prototype._setupDataChannel = function() {
  var self = this;
  this._pc.ondatachannel = function(evt) {
    util.log('Received data channel');
    // TODO: Create DataConnection object.
  };
};

// Send an offer.
ConnectionManager.prototype._makeOffer = function() {
  var self = this;
  this.pc.createOffer(function(offer) {
    util.log('Created offer.');
    self.pc.setLocalDescription(offer, function() {
      util.log('Set localDescription to offer');
      self._socket.send({
        type: 'OFFER',
        payload: {
          sdp: offer,
          serialization: self.serializations,
          metadata: self.metadatas,
          reliable: self.reliables
        },
        dst: self.peer
      });
    }, function(err) {
      self.emit('error', err);
      util.log('Failed to setLocalDescription, ', err);
    });
  });
};

// Create an answer for PC.
ConnectionManager.prototype._makeAnswer = function() {
  var self = this;
  this.pc.createAnswer(function(answer) {
    util.log('Created answer.');
    self.pc.setLocalDescription(answer, function() {
      util.log('Set localDescription to answer.');
      self._socket.send({
        type: 'ANSWER',
        payload: {
          sdp: answer
        },
        dst: self.peer
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

// Clean up PC, close related DCs.
ConnectionManager.prototype._cleanup = function() {

}

ConnectionManager.prototype.handleSDP = function(sdp) {

};

/** Closes manager and all related connections. */
ConnectionManager.prototype.close = function() {
  this._cleanup();
  var self = this;
  if (this.open) {
    this._socket.send({
      type: 'LEAVE',
      dst: self.peer
    });
  }
  this.open = false;
  this.emit('close', this.peer);
};

/** Create and returns a DataConnection with the peer with the given label. */
ConnectionManager.prototype.connect = function(label) {

};
