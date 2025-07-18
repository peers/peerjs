import P from "./peer.page.js";
import { browser, expect } from "@wdio/globals";

describe("Peer", () => {
	it("should emit an error, when the ID is already taken", async () => {
		await P.open("id-taken");
		await P.waitForMessage("No ID takeover");
		expect(await P.errorMessage.getText()).toBe("");
	});
	it("should emit an error, when the server is unavailable", async () => {
		await P.open("server-unavailable");
		await P.waitForMessage('{"type":"server-error"}');
		expect(await P.errorMessage.getText()).toBe("");
	});
	it("should emit an error, when it got disconnected from the server", async () => {
		await P.open("disconnected");
		await P.waitForMessage('{"type":"disconnected"}');
		expect(await P.errorMessage.getText()).toBe("");
	});
	it("should emit an error, when the remote peer is unavailable", async () => {
		await P.open("peer-unavailable");
		await P.waitForMessage('{"type":"peer-unavailable"}');
		expect(await P.errorMessage.getText()).toBe('{"type":"peer-unavailable"}');
	});
});
describe("Peer:async", () => {
	it("should emit an error, when the ID is already taken", async () => {
		await P.open("id-taken.await");
		await P.waitForMessage("No ID takeover");
		expect(await P.errorMessage.getText()).toBe("");
	});
	it("should emit an error, when the remote peer is unavailable", async () => {
		await P.open("peer-unavailable.async");
		await P.waitForMessage("Success: Peer unavailable");
		expect(await P.errorMessage.getText()).toBe("");
	});
});
