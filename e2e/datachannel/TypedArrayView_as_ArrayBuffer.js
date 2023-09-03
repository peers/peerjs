import { typed_array_view } from "../data.js";
import { expect } from "https://esm.sh/v126/chai@4.3.7/X-dHMvZXhwZWN0/es2021/chai.bundle.mjs";

/** @param {unknown[]} received */
export const check = (received) => {
	const received_typed_array_view = received[0];
	expect(received_typed_array_view).to.be.instanceOf(ArrayBuffer);
	expect(new Uint8Array(received_typed_array_view)).to.deep.equal(
		typed_array_view,
	);
};
/**
 * @param {import("../peerjs").DataConnection} dataConnection
 */
export const send = (dataConnection) => {
	dataConnection.send(typed_array_view);
};
