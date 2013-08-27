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

  this.id = this.options._id || MediaConnection._idPrefix + util.randomToken();
  if (this.localStream) {
    this._pc = Negotiator.startConnection(
      this.peer,
      this.id,
      this.provider,
      {_stream: this.localStream, originator: true  }
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

MediaConnection.prototype.answer = function(stream) {
  if (this.localStream) {
    // Throw some error.
    return;
  }

  this.options._payload._stream = stream;

  this.localStream = stream;
  this._pc = Negotiator.startConnection(
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
