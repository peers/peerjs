var RTCPeerConnection = null;
var getUserMedia = null;
var attachMediaStream = null;

if (navigator.mozGetUserMedia) {
  util.browserisms = 'Firefox'

  RTCPeerConnection = mozRTCPeerConnection;
  getUserMedia = navigator.mozGetUserMedia.bind(navigator);
} else if (navigator.webkitGetUserMedia) {
  util.browserisms = 'Webkit'

  RTCPeerConnection = webkitRTCPeerConnection;
  getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
}

exports.RTCPeerConnection = RTCPeerConnection;
exports.getUserMedia = getUserMedia;
