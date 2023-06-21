import { numbers } from "../data.js";
import { expect } from "https://esm.sh/v126/chai@4.3.7/X-dHMvZXhwZWN0/es2021/chai.bundle.mjs";

/** @param {unknown[]} received */
window.check = (received) => {
	expect(received).to.deep.equal(numbers);
};
/**
 * @param {import("../peerjs").DataConnection} dataConnection
 */
window.send = (dataConnection) => {
	for (const number of numbers) {
		dataConnection.send(number);
	}
};
window["connect-btn"].disabled = false;
