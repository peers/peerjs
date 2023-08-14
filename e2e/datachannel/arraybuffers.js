import { array_buffers } from "../data.js";
import { expect } from "https://esm.sh/v126/chai@4.3.7/X-dHMvZXhwZWN0/es2021/chai.bundle.mjs";

/** @param {unknown[]} received */
export const check = (received) => {
	for (const [i, array_buffer] of array_buffers.entries()) {
		expect(received[i]).to.be.an.instanceof(ArrayBuffer);
		expect(received[i]).to.deep.equal(array_buffer);
	}
};
/**
 * @param {import("../peerjs").DataConnection} dataConnection
 */
export const send = (dataConnection) => {
	for (const array_buffer of array_buffers) {
		dataConnection.send(array_buffer);
	}
};
