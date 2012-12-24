(function(exports) {
  var RTCPeerConnection = null;
  var getUserMedia = null;
  var attachMediaStream = null;
  var browserisms = null;

  if (navigator.mozGetUserMedia) {
    browserisms = 'Firefox'

    RTCPeerConnection = mozRTCPeerConnection;

    getUserMedia = navigator.mozGetUserMedia.bind(navigator);
    attachMediaStream = function(element, stream) {
      console.log("Attaching media stream");
      element.mozSrcObject = stream;
      element.play();
    };
  } else if (navigator.webkitGetUserMedia) {
    browserisms = 'Webkit'

    RTCPeerConnection = webkitRTCPeerConnection;

    getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
    attachMediaStream = function(element, stream) {
      element.src = webkitURL.createObjectURL(stream);
    };
  }

  exports.RTCPeerConnection = RTCPeerConnection;
  exports.getUserMedia = getUserMedia;
  exports.attachMediaStream = attachMediaStream;
  exports.browserisms = browserisms;
})(this);
