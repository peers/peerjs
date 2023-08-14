import { typed_array_view } from "../data.js";
import { expect } from "https://esm.sh/v126/chai@4.3.7/X-dHMvZXhwZWN0/es2021/chai.bundle.mjs";

/** @param {unknown[]} received */
export const check = (received) => {
	const received_typed_array_view = received[0];
	expect(received_typed_array_view).to.deep.equal(typed_array_view);
	for (const [i, v] of received_typed_array_view.entries()) {
		expect(v).to.deep.equal(typed_array_view[i]);
	}
};
/**
 * @param {import("../peerjs").DataConnection} dataConnection
 */
export const send = (dataConnection) => {
	dataConnection.send(typed_array_view);
};
