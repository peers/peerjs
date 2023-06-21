import { typed_arrays, typed_array_view, array_buffers } from "../data.js";
import { expect } from "https://esm.sh/v126/chai@4.3.7/X-dHMvZXhwZWN0/es2021/chai.bundle.mjs";

/** @param {unknown[]} received */
window.check = (received) => {
	for (const [i, typed_array] of typed_arrays.entries()) {
		expect(received[i]).to.be.an.instanceof(ArrayBuffer);
		expect(received[i]).to.deep.equal(typed_array.buffer);
	}
	for (const [i, array_buffer] of array_buffers.entries()) {
		expect(received[typed_arrays.length + i]).to.be.an.instanceof(ArrayBuffer);
		expect(received[typed_arrays.length + i]).to.deep.equal(array_buffer);
	}

	const received_typed_array_view =
		received[typed_arrays.length + array_buffers.length];
	expect(new Uint8Array(received_typed_array_view)).to.deep.equal(
		typed_array_view,
	);
	for (const [i, v] of new Uint8Array(received_typed_array_view).entries()) {
		expect(v).to.deep.equal(typed_array_view[i]);
	}
};
/**
 * @param {import("../peerjs").DataConnection} dataConnection
 */
window.send = (dataConnection) => {
	for (const typed_array of typed_arrays) {
		dataConnection.send(typed_array);
	}
	for (const array_buffer of array_buffers) {
		dataConnection.send(array_buffer);
	}
	dataConnection.send(typed_array_view);
};

window["connect-btn"].disabled = false;
