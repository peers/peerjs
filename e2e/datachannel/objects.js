import { commit_data } from "../data.js";
import { expect } from "https://esm.sh/v126/chai@4.3.7/X-dHMvZXhwZWN0/es2021/chai.bundle.mjs";

/** @param {unknown[]} received */
export const check = (received) => {
	expect(received).to.be.an("array").with.lengthOf(commit_data.length);
	expect(received).to.deep.equal(commit_data);
};
/**
 * @param {import("../peerjs").DataConnection} dataConnection
 */
export const send = (dataConnection) => {
	for (const commit of commit_data) {
		dataConnection.send(commit);
	}
};
