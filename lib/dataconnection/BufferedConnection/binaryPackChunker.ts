export class BinaryPackChunker {
	readonly chunkedMTU = 16300; // The original 60000 bytes setting does not work when sending data from Firefox to Chrome, which is "cut off" after 16384 bytes and delivered individually.

	// Binary stuff

	private _dataCount: number = 1;

	chunk = (
		blob: ArrayBuffer,
	): { __peerData: number; n: number; total: number; data: Uint8Array }[] => {
		const chunks = [];
		const size = blob.byteLength;
		const total = Math.ceil(size / this.chunkedMTU);

		let index = 0;
		let start = 0;

		while (start < size) {
			const end = Math.min(size, start + this.chunkedMTU);
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
	};
}

export function concatArrayBuffers(bufs: Uint8Array[]) {
	let size = 0;
	for (const buf of bufs) {
		size += buf.byteLength;
	}
	const result = new Uint8Array(size);
	let offset = 0;
	for (const buf of bufs) {
		result.set(buf, offset);
		offset += buf.byteLength;
	}
	return result;
}
