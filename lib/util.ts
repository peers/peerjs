import * as BinaryPack from "js-binarypack";
import { Supports } from './supports';
import { UtilSupportsObj } from '..';

const DEFAULT_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "turn:0.peerjs.com:3478", username: "peerjs", credential: "peerjsp" }
  ],
  sdpSemantics: "unified-plan"
};

export const util = new class {
  noop(): void { }

  readonly CLOUD_HOST = "0.peerjs.com";
  readonly CLOUD_PORT = 443;

  // Browsers that need chunking:
  readonly chunkedBrowsers = { Chrome: 1, chrome: 1 };
  readonly chunkedMTU = 16300; // The original 60000 bytes setting does not work when sending data from Firefox to Chrome, which is "cut off" after 16384 bytes and delivered individually.

  // Returns browser-agnostic default config
  readonly defaultConfig = DEFAULT_CONFIG;

  readonly browser = Supports.getBrowser();
  readonly browserVersion = Supports.getVersion();

  // Lists which features are supported
  readonly supports = (function () {
    const supported: UtilSupportsObj = {
      browser: Supports.isBrowserSupported(),
      webRTC: Supports.isWebRTCSupported(),
      audioVideo: false,
      data: false,
      binaryBlob: false,
      reliable: false,
      sctp: false,
    };

    if (!supported.webRTC) return supported;

    let pc: RTCPeerConnection;

    try {
      pc = new RTCPeerConnection(DEFAULT_CONFIG);

      supported.audioVideo = true;

      let dc: RTCDataChannel;

      try {
        dc = pc.createDataChannel("_PEERJSTEST");
        supported.data = true;
        supported.reliable = !!dc.ordered;
        supported.sctp = !!pc.sctp;

        // Binary test
        try {
          dc.binaryType = "blob";
          supported.binaryBlob = !Supports.isIOS;
        } catch (e) {
        }
      } catch (e) {
      } finally {
        if (dc) {
          dc.close();
        }
      }
    } catch (e) {
    } finally {
      if (pc) {
        pc.close();
      }
    }

    return supported;
  })();

  // Ensure alphanumeric ids
  validateId(id: string): boolean {
    // Allow empty ids
    return !id || /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.test(id);
  }

  pack = BinaryPack.pack;
  unpack = BinaryPack.unpack;

  // Binary stuff

  private _dataCount = 1;

  // chunks a blob.
  chunk(bl: Blob): any[] {
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

  blobToArrayBuffer(blob: Blob, cb: (arg: string | ArrayBuffer | null) => void): void {
    const fr = new FileReader();

    fr.onload = function (evt) {
      if (evt.target) {
        cb(evt.target.result);
      }
    };

    fr.readAsArrayBuffer(blob);
  }

  blobToBinaryString(blob: Blob, cb: (arg: string | ArrayBuffer | null) => void): void {
    const fr = new FileReader();

    fr.onload = function (evt) {
      if (evt.target) {
        cb(evt.target.result);
      }
    };

    fr.readAsBinaryString(blob);
  }

  binaryStringToArrayBuffer(binary: string): ArrayBuffer | SharedArrayBuffer {
    let byteArray = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      byteArray[i] = binary.charCodeAt(i) & 0xff;
    }

    return byteArray.buffer;
  }

  randomToken(): string {
    return Math.random()
      .toString(36)
      .substr(2);
  }

  isSecure(): boolean {
    return location.protocol === "https:";
  }
}
