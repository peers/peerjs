/**
 * Wraps the streaming interface between two Peers.
 */
function MediaConnection(peer, provider, options) {
  if (!(this instanceof MediaConnection)) return new MediaConnection(peer, provider, options);
  EventEmitter.call(this);

  this.options = util.extend({}, options);

  this.open = false;
  this.type = 'media';
  this.peer = peer;
  this.provider = provider;

  this.metadata = this.options.metadata;
  this.localStream = this.options._stream;

  this.id = this.options.connection_id || MediaConnection._idPrefix + util.randomToken();
  if (this.localStream) {
    this.pc = Negotiator.startConnection(
      this,
      {_stream: this.localStream, originator: true}
    )
  }
};

util.inherits(MediaConnection, EventEmitter);

MediaConnection._idPrefix = 'mc_';

MediaConnection.prototype.addStream = function(remoteStream) {
  util.log('Receiving stream', remoteStream);

  this.remoteStream = remoteStream;
  this.emit('stream', remoteStream); // Should we call this `open`?
  this.open = true;
};

MediaConnection.prototype.handleMessage = function(message) {
  var payload = message.payload;

  switch (message.type) {
    case 'ANSWER':
      // TODO: assert sdp exists.
      // Should we pass `this`?
      // Forward to negotiator
      Negotiator.handleSDP(message.type, this, payload.sdp);
      break;
    case 'CANDIDATE':
      // TODO
      Negotiator.handleCandidate(this, payload.candidate);
      break;
    default:
      util.warn('Unrecognized message type:', message.type, 'from peer:', this.peer);
      break;
  }
}

MediaConnection.prototype.answer = function(stream) {
  if (this.localStream) {
    // Throw some error.
    return;
  }

  this.options._payload._stream = stream;

  this.localStream = stream;
  this._pc = Negotiator.startConnection(
    this.type,
    this.peer,
    this.id,
    this.provider,
    this.options._payload
  )
};

/**
 * Exposed functionality for users.
 */

/** Allows user to close connection. */
MediaConnection.prototype.close = function() {
  if (this.open) {
    this.open = false;
    this.emit('close')
  }
};
