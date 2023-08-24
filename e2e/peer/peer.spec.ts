import P from "./peer.page.js";
import { browser, expect } from "@wdio/globals";

describe("Peer", () => {
	it("should emit an error, when the ID is already taken", async () => {
		await P.open("id-taken");
		await P.waitForMessage('{"type":"unavailable-id"}');
		await P.waitForMessage('{"type":"unavailable-id"}');
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
});
