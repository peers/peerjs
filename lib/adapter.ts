import { adapter as _ } from "webrtc-adapter";

export const RTCSessionDescription =
  // @ts-ignore
  window.RTCSessionDescription || window.mozRTCSessionDescription;
export const RTCPeerConnection =
  // @ts-ignore
  window.RTCPeerConnection ||
  // @ts-ignore
  window.mozRTCPeerConnection ||
  // @ts-ignore
  window.webkitRTCPeerConnection;
export const RTCIceCandidate =
  // @ts-ignore
  window.RTCIceCandidate || window.mozRTCIceCandidate;
