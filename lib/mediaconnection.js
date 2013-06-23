/**
 * Wraps the streaming interface between two Peers.
 */
function MediaConnection(peer, localStream, options) {
  if (!(this instanceof MediaConnection)) return new MediaConnection(peer, localStream, options);
  EventEmitter.call(this);

  options = util.extend({
   
  }, options);

  this.localStream = localStream;
  this.peer = peer;
  
};

util.inherits(MediaConnection, EventEmitter);

MediaConnection.prototype.receiveStream = function(stream) {
  console.log('receiving stream', stream);
  this.remoteStream = stream;
  this.emit('stream', stream);
  //this._cleanup();
};

MediaConnection.prototype.answer = function(stream) {
  this.localStream = stream;
  this.emit('answer', stream);
  //this._cleanup();
};

MediaConnection.prototype.answered = function(stream) {
  this.emit('stream', this.remoteStream);
  //this._cleanup();
};


/**
 * Exposed functionality for users.
 */

/** Allows user to close connection. */
MediaConnection.prototype.close = function() {
  //this._cleanup();
};



/**
 * Gets the brokering ID of the peer that you are connected with.
 * Note that this ID may be out of date if the peer has disconnected from the
 *  server, so it's not recommended that you use this ID to identify this
 *  connection.
 */
MediaConnection.prototype.getPeer = function() {
  return this.peer;
};
