import { commit_data } from "../data.js";
import { expect } from "https://esm.sh/v126/chai@4.3.7/X-dHMvZXhwZWN0/es2021/chai.bundle.mjs";

const Encoder = new TextEncoder();
const Decoder = new TextDecoder();

/** @param {unknown[]} received */
export const check = (received) => {
	expect(received).to.be.an("array").with.lengthOf(commit_data.length);
	const commits_as_arraybuffer = commit_data.map(
		(blob) => Encoder.encode(JSON.stringify(blob)).buffer,
	);
	expect(received).to.deep.equal(commits_as_arraybuffer);
	const parsed_received = received.map((r) => JSON.parse(Decoder.decode(r)));
	expect(parsed_received).to.deep.equal(commit_data);
};
/**
 * @param {import("../peerjs").DataConnection} dataConnection
 */
export const send = async (dataConnection) => {
	for (const commit of commit_data) {
		await dataConnection.send(new Blob([JSON.stringify(commit)]));
	}
};
