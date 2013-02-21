var RTCPeerConnection = null;
var getUserMedia = null;
var attachMediaStream = null;

if (navigator.mozGetUserMedia) {
  util.browserisms = 'Firefox';

  RTCSessionDescription = window.mozRTCSessionDescription;
  RTCPeerConnection = window.mozRTCPeerConnection;
  getUserMedia = navigator.mozGetUserMedia.bind(navigator);
} else if (navigator.webkitGetUserMedia) {
  util.browserisms = 'Webkit';

  RTCPeerConnection = window.webkitRTCPeerConnection;
  getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
}

exports.RTCSessionDescription = RTCSessionDescription;
exports.RTCPeerConnection = RTCPeerConnection;
exports.getUserMedia = getUserMedia;
