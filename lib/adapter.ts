import webrtc from "webrtc-adapter";

export const RTCSessionDescription =
  window.RTCSessionDescription || window.mozRTCSessionDescription;
export const RTCPeerConnection =
  window.RTCPeerConnection ||
  window.mozRTCPeerConnection ||
  window.webkitRTCPeerConnection;
export const RTCIceCandidate =
  window.RTCIceCandidate || window.mozRTCIceCandidate;
