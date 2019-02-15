import { util } from "./util";
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate
} from "./adapter";
import { Socket } from "./socket";
import { MediaConnection } from "./mediaconnection";
import { DataConnection } from "./dataconnection";
import { Peer } from "./peer";
import { Negotiator } from "./negotiator";
import jsBinarypack from "js-binarypack";

window.Socket = Socket;
window.MediaConnection = MediaConnection;
window.DataConnection = DataConnection;
window.Peer = Peer;
window.RTCPeerConnection = RTCPeerConnection;
window.RTCSessionDescription = RTCSessionDescription;
window.RTCIceCandidate = RTCIceCandidate;
window.Negotiator = Negotiator;
window.util = util;
window.BinaryPack = jsBinarypack;

export default Peer