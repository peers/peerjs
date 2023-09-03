import logger from "../../logger";
import { DataConnection } from "../DataConnection";

export abstract class BufferedConnection extends DataConnection {
	private _buffer: any[] = [];
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

	protected abstract _handleDataMessage(e: MessageEvent): void;

	protected _bufferedSend(msg: ArrayBuffer): void {
		if (this._buffering || !this._trySend(msg)) {
			this._buffer.push(msg);
			this._bufferSize = this._buffer.length;
		}
	}

	// Returns true if the send succeeds.
	private _trySend(msg: ArrayBuffer): boolean {
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
			this.dataChannel.send(msg);
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
