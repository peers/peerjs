import { decodeMultiStream, Encoder } from "@msgpack/msgpack";
import { StreamConnection } from "./StreamConnection";
import { Peer } from "../../peer";

export class MsgPackConnection extends StreamConnection {
	readonly serialization = "msgpack";
	private _encoder = new Encoder();

	constructor(peerId: string, provider: Peer, options: any) {
		super(peerId, provider, options);

		(async () => {
			for await (const msg of decodeMultiStream(this._rawReadStream)) {
				this.emit("data", msg);
			}
		})();
	}

	protected override _send(data) {
		this.writer.write(this._encoder.encode(data));
	}
}
