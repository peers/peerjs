import * as BinaryPack from "js-binarypack";
import { RTCPeerConnection } from "./adapter";

const DEFAULT_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  sdpSemantics: "unified-plan"
};

export class util {
  static noop(): void { }

  static readonly CLOUD_HOST = "0.peerjs.com";
  static readonly CLOUD_PORT = 443;

  // Browsers that need chunking:
  static readonly chunkedBrowsers = { Chrome: 1 };
  static readonly chunkedMTU = 16300; // The original 60000 bytes setting does not work when sending data from Firefox to Chrome, which is "cut off" after 16384 bytes and delivered individually.

  // Returns browser-agnostic default config
  static readonly defaultConfig = DEFAULT_CONFIG;

  // Returns the current browser.
  static readonly browser: string = (function (global) {
    // @ts-ignore
    if (global.mozRTCPeerConnection) {
      return "Firefox";
    }
    // @ts-ignore
    if (global.webkitRTCPeerConnection) {
      return "Chrome";
    }

    if (global.RTCPeerConnection) {
      return "Supported";
    }

    return "Unsupported";
  })(window);

  // Lists which features are supported
  static readonly supports = (function () {
    if (typeof RTCPeerConnection === "undefined") {
      return {};
    }

    let data = true;
    let audioVideo = true;

    let binaryBlob = false;
    let sctp = false;
    // @ts-ignore
    const onnegotiationneeded = !!window.webkitRTCPeerConnection;

    let pc, dc;

    try {
      pc = new RTCPeerConnection(DEFAULT_CONFIG, {
        optional: [{ RtpDataChannels: true }]
      });
    } catch (e) {
      data = false;
      audioVideo = false;
    }

    if (data) {
      try {
        dc = pc.createDataChannel("_PEERJSTEST");
      } catch (e) {
        data = false;
      }
    }

    if (data) {
      // Binary test
      try {
        dc.binaryType = "blob";
        binaryBlob = true;
      } catch (e) { }

      // Reliable test.
      // Unfortunately Chrome is a bit unreliable about whether or not they
      // support reliable.
      const reliablePC = new RTCPeerConnection(DEFAULT_CONFIG, {});
      try {
        const reliableDC = reliablePC.createDataChannel(
          "_PEERJSRELIABLETEST",
          {}
        );
        sctp = reliableDC.ordered;
      } catch (e) { }
      reliablePC.close();
    }

    // FIXME: not really the best check...
    if (audioVideo) {
      audioVideo = !!pc.addStream;
    }

    if (pc) {
      pc.close();
    }

    return {
      audioVideo: audioVideo,
      data: data,
      binaryBlob: binaryBlob,
      binary: sctp, // deprecated; sctp implies binary support.
      reliable: sctp, // deprecated; sctp implies reliable data.
      sctp: sctp,
      onnegotiationneeded: onnegotiationneeded
    };
  })();

  // Ensure alphanumeric ids
  static validateId(id: string): boolean {
    // Allow empty ids
    return !id || /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.test(id);
  }

  static pack = BinaryPack.pack;
  static unpack = BinaryPack.unpack;

  // Binary stuff

  private static _dataCount = 1;

  // chunks a blob.
  static chunk(bl: Blob): any[] {
    const chunks = [];
    const size = bl.size;
    const total = Math.ceil(size / util.chunkedMTU);

    let index;
    let start = (index = 0);

    while (start < size) {
      const end = Math.min(size, start + util.chunkedMTU);
      const b = bl.slice(start, end);

      const chunk = {
        __peerData: this._dataCount,
        n: index,
        data: b,
        total: total
      };

      chunks.push(chunk);

      start = end;
      index++;
    }

    this._dataCount++;

    return chunks;
  }

  static blobToArrayBuffer(blob: Blob, cb: (arg: any) => void): void {
    const fr = new FileReader();

    fr.onload = function (evt) {
      // @ts-ignore
      cb(evt.target.result);
    };

    fr.readAsArrayBuffer(blob);
  }

  static blobToBinaryString(blob: Blob, cb: (arg: any) => void): void {
    const fr = new FileReader();

    fr.onload = function (evt) {
      // @ts-ignore
      cb(evt.target.result);
    };

    fr.readAsBinaryString(blob);
  }

  static binaryStringToArrayBuffer(binary): ArrayBuffer | SharedArrayBuffer {
    let byteArray = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      byteArray[i] = binary.charCodeAt(i) & 0xff;
    }

    return byteArray.buffer;
  }

  static randomToken(): string {
    return Math.random()
      .toString(36)
      .substr(2);
  }

  static isSecure(): boolean {
    return location.protocol === "https:";
  }
}
