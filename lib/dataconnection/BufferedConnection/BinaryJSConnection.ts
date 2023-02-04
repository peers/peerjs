import { util } from "../../util";
import logger from "../../logger";
import { Peer } from "../../peer";
import { EncodingQueue } from "../../encodingQueue";
import { BufferedConnection } from "./BufferedConnection";
import { SerializationType } from "../../enums";

export class BinaryJSConnection extends BufferedConnection {
	readonly serialization = SerializationType.Binary;

	private _chunkedData: {
		[id: number]: {
			data: Blob[];
			count: number;
			total: number;
		};
	} = {};

	public override close() {
		this._chunkedData = {};
		if (this._encodingQueue) {
			this._encodingQueue.destroy();
			this._encodingQueue.removeAllListeners();
			this._encodingQueue = null;
		}
		super.close();
	}

	private _encodingQueue = new EncodingQueue();

	constructor(peerId: string, provider: Peer, options: any) {
		super(peerId, provider, options);

		this._encodingQueue.on("done", (ab: ArrayBuffer) => {
			this._bufferedSend(ab);
		});

		this._encodingQueue.on("error", () => {
			logger.error(
				`DC#${this.connectionId}: Error occured in encoding from blob to arraybuffer, close DC`,
			);
			this.close();
		});
	}

	// Handles a DataChannel message.
	protected override _handleDataMessage({
		data,
	}: {
		data: Blob | ArrayBuffer | string;
	}): void {
		const datatype = data.constructor;

		let deserializedData: any = data;

		if (datatype === Blob) {
			// Datatype should never be blob
			util.blobToArrayBuffer(data as Blob, (ab) => {
				const unpackedData = util.unpack(ab);
				this.emit("data", unpackedData);
			});
			return;
		} else if (datatype === ArrayBuffer) {
			deserializedData = util.unpack(data as ArrayBuffer);
		} else if (datatype === String) {
			// String fallback for binary data for browsers that don't support binary yet
			const ab = util.binaryStringToArrayBuffer(data as string);
			deserializedData = util.unpack(ab);
		}

		// Check if we've chunked--if so, piece things back together.
		// We're guaranteed that this isn't 0.
		if (deserializedData.__peerData) {
			this._handleChunk(deserializedData);
			return;
		}

		this.emit("data", deserializedData);
	}

	private _handleChunk(data: {
		__peerData: number;
		n: number;
		total: number;
		data: Blob;
	}): void {
		const id = data.__peerData;
		const chunkInfo = this._chunkedData[id] || {
			data: [],
			count: 0,
			total: data.total,
		};

		chunkInfo.data[data.n] = data.data;
		chunkInfo.count++;
		this._chunkedData[id] = chunkInfo;

		if (chunkInfo.total === chunkInfo.count) {
			// Clean up before making the recursive call to `_handleDataMessage`.
			delete this._chunkedData[id];

			// We've received all the chunks--time to construct the complete data.
			const data = new Blob(chunkInfo.data);
			this._handleDataMessage({ data });
		}
	}

	protected override _send(data: any, chunked: boolean): void | Promise<void> {
		const blob = util.pack(data);

		if (!chunked && blob.size > util.chunkedMTU) {
			this._sendChunks(blob);
			return;
		}

		if (!util.supports.binaryBlob) {
			// We only do this if we really need to (e.g. blobs are not supported),
			// because this conversion is costly.
			this._encodingQueue.enque(blob);
		} else {
			this._bufferedSend(blob);
		}
	}

	private _sendChunks(blob: Blob) {
		const blobs = util.chunk(blob);
		logger.log(`DC#${this.connectionId} Try to send ${blobs.length} chunks...`);

		for (let blob of blobs) {
			this.send(blob, true);
		}
	}
}
