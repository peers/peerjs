import { decodeMultiStream, Encoder } from "@msgpack/msgpack";
import { StreamConnection } from "./StreamConnection.js";
import type { Peer } from "../../peer.js";
import { SerializationType } from "../../enums.js";

export class MsgPack extends StreamConnection {
	readonly serialization = SerializationType.MsgPack;
	private _encoder = new Encoder();

	constructor(peerId: string, provider: Peer, options: any) {
		super(peerId, provider, options);

		(async () => {
			for await (const msg of decodeMultiStream(this._rawReadStream)) {
				// @ts-ignore
				if (msg.__peerData?.type === "close") {
					this.close();
					return;
				}
				this.emit("data", msg);
			}
		})();
	}

	protected override _send(data) {
		return this.writer.write(this._encoder.encode(data));
	}
}
