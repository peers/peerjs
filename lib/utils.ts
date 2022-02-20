import * as BinaryPack from 'peerjs-js-binarypack';

const DEFAULT_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:0.peerjs.com:3478', username: 'peerjs', credential: 'peerjsp' },
  ],
  sdpSemantics: 'unified-plan',
};

export const Utils = new (class {
  readonly CLOUD_HOST = '0.peerjs.com';
  readonly CLOUD_PORT = 443;

  readonly chunkedMTU = 16300; // The original 60000 bytes setting does not work when sending data from Firefox to Chrome, which is "cut off" after 16384 bytes and delivered individually.

  // Returns browser-agnostic default config
  readonly defaultConfig = DEFAULT_CONFIG;

  // Ensure alphanumeric ids
  validateId(id: string): boolean {
    // Allow empty ids
    return !id || /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.test(id);
  }

  pack = BinaryPack.pack;
  unpack = BinaryPack.unpack;

  // Binary stuff

  private _dataCount: number = 1;

  chunk(blob: Blob): { __peerData: number; n: number; total: number; data: Blob }[] {
    const chunks = [];
    const size = blob.size;
    const total = Math.ceil(size / Utils.chunkedMTU);

    let index = 0;
    let start = 0;

    while (start < size) {
      const end = Math.min(size, start + Utils.chunkedMTU);
      const b = blob.slice(start, end);

      const chunk = {
        __peerData: this._dataCount,
        n: index,
        data: b,
        total,
      };

      chunks.push(chunk);

      start = end;
      index++;
    }

    this._dataCount++;

    return chunks;
  }

  blobToArrayBuffer(FileReaderCtr: typeof FileReader, blob: Blob, cb: (arg: ArrayBuffer | null) => void): FileReader {
    const fr = new FileReaderCtr();

    fr.onload = function (evt) {
      if (evt.target) {
        cb(evt.target.result as ArrayBuffer);
      }
    };

    fr.readAsArrayBuffer(blob);

    return fr;
  }

  binaryStringToArrayBuffer(binary: string): ArrayBuffer | SharedArrayBuffer {
    const byteArray = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      byteArray[i] = binary.charCodeAt(i) & 0xff;
    }

    return byteArray.buffer;
  }

  randomToken(): string {
    return Math.random().toString(36).substr(2);
  }

  isSecure(): boolean {
    return location.protocol === 'https:';
  }
})();
