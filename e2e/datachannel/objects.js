import { commit_data } from "../data.js";
import { expect } from "https://esm.sh/v126/chai@4.3.7/X-dHMvZXhwZWN0/es2021/chai.bundle.mjs";

/** @param {unknown[]} received */
window.check = (received) => {
	expect(received).to.deep.equal(commit_data);
};
/**
 * @param {import("../peerjs").DataConnection} dataConnection
 */
window.send = (dataConnection) => {
	for (const commit of commit_data) {
		dataConnection.send(commit);
	}
};
window["connect-btn"].disabled = false;
