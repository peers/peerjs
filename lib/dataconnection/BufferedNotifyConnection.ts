import { pack, unpack } from "peerjs-js-binarypack";
import logger from "../logger";
import { DataConnection } from "./DataConnection";
import { BinaryPackChunk, BinaryPackChunker, concatArrayBuffers } from "./BufferedConnection/binaryPackChunker";


export class BufferedNotifyConnection extends DataConnection {
    serialization: 'notify';
    private readonly chunker = new BinaryPackChunker();

    private _chunkedData: {
        [id: number]: {
            data: Uint8Array[];
            count: number;
            total: number;
        };
    } = {};


    protected _send(data: any, chunked: boolean): { __peerData: number, total: number } {

        const blob = pack(data);

        if (!chunked && blob.byteLength > this.chunker.chunkedMTU) {

            const blobs = this.chunker.chunk(blob);
            logger.log(`DC#${this.connectionId} Try to send ${blobs.length} chunks...`);

            for (const blob of blobs) {
                this._bufferedSend(blob);
            }

            return { __peerData: blobs[0].__peerData, total: blobs.length };
        }
        //We send everything in one chunk

        return { __peerData: 0, total: 1 };
    }

    private _buffer: BinaryPackChunk[] = [];
    private _bufferSize = 0;
    private _buffering = false;

    public get bufferSize(): number {
        return this._bufferSize;
    }

    public override _initializeDataChannel(dc: RTCDataChannel) {
        super._initializeDataChannel(dc);
        this.dataChannel.binaryType = "arraybuffer";
        this.dataChannel.addEventListener("message", (e) =>
            this._handleDataMessage(e),
        );
    }


    protected _handleDataMessage({ data }: { data: Uint8Array }): void {
        // Assume we only get BinaryPackChunks
        const deserializedData = unpack(data);

        // PeerJS specific message
        const peerData = deserializedData["__peerData"];
        if (peerData) {
            if (peerData.type === "close") {
                this.close();
                return;
            }

            if (typeof peerData === "number") {
                // @ts-ignore
                this._handleChunk(deserializedData);
                return;
            }

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


    protected _bufferedSend(msg: BinaryPackChunk): void {
        if (this._buffering || !this._trySend(msg)) {
            this._buffer.push(msg);
            this._bufferSize = this._buffer.length;
        }
    }

    // Returns true if the send succeeds.
    private _trySend(msg: BinaryPackChunk): boolean {
        if (!this.open) {
            return false;
        }

        if (this.dataChannel.bufferedAmount > DataConnection.MAX_BUFFERED_AMOUNT) {
            this._buffering = true;
            setTimeout(() => {
                this._buffering = false;
                this._tryBuffer();
            }, 50);

            return false;
        }

        try {
            // Send notification
            this.emit("sentChunk", { __peerData: msg.__peerData, n: msg.n });
            const msgPacked = pack(msg as any);
            this.dataChannel.send(msgPacked);
        } catch (e) {
            logger.error(`DC#:${this.connectionId} Error when sending:`, e);
            this._buffering = true;

            this.close();

            return false;
        }

        return true;
    }

    // Try to send the first message in the buffer.
    private _tryBuffer(): void {
        if (!this.open) {
            return;
        }

        if (this._buffer.length === 0) {
            return;
        }

        const msg = this._buffer[0];

        if (this._trySend(msg)) {
            this._buffer.shift();
            this._bufferSize = this._buffer.length;
            this._tryBuffer();
        }
    }

    public override close(options?: { flush?: boolean }) {
        if (options?.flush) {
            this.send({
                __peerData: {
                    type: "close",
                },
            });
            return;
        }
        this._buffer = [];
        this._bufferSize = 0;
        super.close();
    }
}
