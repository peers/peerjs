import { BinaryPackChunker, concatArrayBuffers } from "./binaryPackChunker";
import logger from "../../logger";
import type { Peer } from "../../peer";
import { BufferedConnection } from "./BufferedConnection";
import { SerializationType } from "../../enums";
import { pack, type Packable, unpack } from "peerjs-js-binarypack";

export class BinaryPack extends BufferedConnection {
	private readonly chunker = new BinaryPackChunker();
	readonly serialization = SerializationType.Binary;

	private _chunkedData: {
		[id: number]: {
			data: Uint8Array[];
			count: number;
			total: number;
		};
	} = {};

	public override close(options?: { flush?: boolean }) {
		super.close(options);
		this._chunkedData = {};
	}

	constructor(peerId: string, provider: Peer, options: any) {
		super(peerId, provider, options);
	}

	// Handles a DataChannel message.
	protected override _handleDataMessage({ data }: { data: Uint8Array }): void {
		const deserializedData = unpack(data);

		// PeerJS specific message
		const peerData = deserializedData["__peerData"];
		if (peerData) {
			if (peerData.type === "close") {
				this.close();
				return;
			}

			// Chunked data -- piece things back together.
			// @ts-ignore
			this._handleChunk(deserializedData);
			return;
		}

		this.emit("data", deserializedData);
	}

	private _handleChunk(data: {
		__peerData: number;
		n: number;
		total: number;
		data: ArrayBuffer;
	}): void {
		const id = data.__peerData;
		const chunkInfo = this._chunkedData[id] || {
			data: [],
			count: 0,
			total: data.total,
		};

		chunkInfo.data[data.n] = new Uint8Array(data.data);
		chunkInfo.count++;
		this._chunkedData[id] = chunkInfo;

		if (chunkInfo.total === chunkInfo.count) {
			// Clean up before making the recursive call to `_handleDataMessage`.
			delete this._chunkedData[id];

			// We've received all the chunks--time to construct the complete data.
			// const data = new Blob(chunkInfo.data);
			const data = concatArrayBuffers(chunkInfo.data);
			this._handleDataMessage({ data });
		}
	}

	protected override _send(data: Packable, chunked: boolean) {
		const blob = pack(data);
		if (blob instanceof Promise) {
			return this._send_blob(blob);
		}

		if (!chunked && blob.byteLength > this.chunker.chunkedMTU) {
			this._sendChunks(blob);
			return;
		}

		this._bufferedSend(blob);
	}
	private async _send_blob(blobPromise: Promise<ArrayBufferLike>) {
		const blob = await blobPromise;
		if (blob.byteLength > this.chunker.chunkedMTU) {
			this._sendChunks(blob);
			return;
		}

		this._bufferedSend(blob);
	}

	private _sendChunks(blob: ArrayBuffer) {
		const blobs = this.chunker.chunk(blob);
		logger.log(`DC#${this.connectionId} Try to send ${blobs.length} chunks...`);

		for (const blob of blobs) {
			this.send(blob, true);
		}
	}
}
