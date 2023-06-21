/**
 * JSON transfer does not chunk, large_string is too large to send
 */
import { strings, long_string } from "../data.js";
import { expect } from "https://esm.sh/v126/chai@4.3.7/X-dHMvZXhwZWN0/es2021/chai.bundle.mjs";

/** @param {unknown[]} received */
window.check = (received) => {
	expect(received).to.deep.equal(strings);
};
/**
 * @param {import("../peerjs").DataConnection} dataConnection
 */
window.send = (dataConnection) => {
	for (const string of strings) {
		dataConnection.send(string);
	}
};
window["connect-btn"].disabled = false;
