import logger from "../../logger.js";
import type { Peer } from "../../peer.js";
import { DataConnection } from "../DataConnection.js";

export abstract class StreamConnection extends DataConnection {
	private _CHUNK_SIZE = 1024 * 8 * 4;
	private _splitStream = new TransformStream<Uint8Array>({
		transform: (chunk, controller) => {
			for (let split = 0; split < chunk.length; split += this._CHUNK_SIZE) {
				controller.enqueue(chunk.subarray(split, split + this._CHUNK_SIZE));
			}
		},
	});
	private _rawSendStream = new WritableStream<ArrayBuffer>({
		write: async (chunk, controller) => {
			const openEvent = new Promise((resolve) =>
				this.dataChannel.addEventListener("bufferedamountlow", resolve, {
					once: true,
				}),
			);

			// if we can send the chunk now, send it
			// if not, we wait until at least half of the sending buffer is free again
			await (this.dataChannel.bufferedAmount <=
				DataConnection.MAX_BUFFERED_AMOUNT - chunk.byteLength || openEvent);

			// TODO: what can go wrong here?
			try {
				this.dataChannel.send(chunk);
			} catch (e) {
				logger.error(`DC#:${this.connectionId} Error when sending:`, e);
				controller.error(e);
				this.close();
			}
		},
	});
	protected writer = this._splitStream.writable.getWriter();

	protected _rawReadStream = new ReadableStream<ArrayBuffer>({
		start: (controller) => {
			this.once("open", () => {
				this.dataChannel.addEventListener("message", (e) => {
					controller.enqueue(e.data);
				});
			});
		},
	});

	protected constructor(peerId: string, provider: Peer, options: any) {
		super(peerId, provider, { ...options, reliable: true });

		void this._splitStream.readable.pipeTo(this._rawSendStream);
	}

	public override _initializeDataChannel(dc) {
		super._initializeDataChannel(dc);
		this.dataChannel.binaryType = "arraybuffer";
		this.dataChannel.bufferedAmountLowThreshold =
			DataConnection.MAX_BUFFERED_AMOUNT / 2;
	}
}
