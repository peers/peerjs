import { strings, long_string } from "../data.js";
import { expect } from "https://esm.sh/v126/chai@4.3.7/X-dHMvZXhwZWN0/es2021/chai.bundle.mjs";

/** @param {unknown[]} received */
window.check = (received) => {
	expect(received).to.deep.equal([long_string, ...strings]);
};
/**
 * @param {import("../peerjs").DataConnection} dataConnection
 */
window.send = (dataConnection) => {
	dataConnection.send(long_string);
	for (const string of strings) {
		dataConnection.send(string);
	}
};
window["connect-btn"].disabled = false;
