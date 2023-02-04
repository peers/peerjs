import { Peer } from "../../peer";
import { Encoder, Decoder } from "cbor-x";
import { StreamConnection } from "./StreamConnection";
import { TransformStream } from "web-streams-polyfill/ponyfill/es2018";

const NullValue = Symbol.for(null);

function concatUint8Array(buffer1: Uint8Array, buffer2: Uint8Array) {
	const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
	tmp.set(buffer1, 0);
	tmp.set(buffer2, buffer1.byteLength);
	return new Uint8Array(tmp.buffer);
}

export class CborConnection extends StreamConnection {
	readonly serialization = "cbor";
	private _encoder = new Encoder();
	private _decoder = new Decoder();
	private _inc;
	private _decoderStream = new TransformStream<ArrayBuffer, unknown>({
		transform: (abchunk, controller) => {
			let chunk = new Uint8Array(abchunk);
			if (this._inc) {
				chunk = concatUint8Array(this._inc, chunk);
				this._inc = null;
			}
			let values;
			try {
				values = this._decoder.decodeMultiple(chunk);
			} catch (error) {
				if (error.incomplete) {
					this._inc = chunk.subarray(error.lastPosition);
					values = error.values;
				} else throw error;
			} finally {
				for (let value of values || []) {
					if (value === null) value = NullValue;
					controller.enqueue(value);
				}
			}
		},
	});

	constructor(peerId: string, provider: Peer, options: any) {
		super(peerId, provider, { ...options, reliable: true });

		this._rawReadStream.pipeTo(this._decoderStream.writable);

		(async () => {
			for await (const msg of this._decoderStream.readable) {
				this.emit("data", msg);
			}
		})();
	}

	protected override async _send(data) {
		this.writer.write(this._encoder.encode(data));
	}
}
