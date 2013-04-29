if (window.mozRTCPeerConnection) {
  util.browserisms = 'Firefox';
} else if (window.webkitRTCPeerConnection) {
  util.browserisms = 'Webkit';
} else {
  util.browserisms = 'Unknown';
}

exports.RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
exports.RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.RTCPeerConnection;
