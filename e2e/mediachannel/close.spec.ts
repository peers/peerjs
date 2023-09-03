import P from "./close.page.js";
import { browser } from "@wdio/globals";

describe("MediaStream", () => {
	beforeAll(
		async () => {
			await P.init();
		},
		jasmine.DEFAULT_TIMEOUT_INTERVAL,
		1,
	);
	it(
		"should close the remote stream",
		async () => {
			await P.open();
			await P.waitForMessage("Your Peer ID: ");
			const bobId = (await P.messages.getText()).split("Your Peer ID: ")[1];
			await browser.switchWindow("Alice");
			await P.waitForMessage("Your Peer ID: ");
			await P.receiverId.setValue(bobId);
			await P.callBtn.click();
			await P.waitForMessage("Connected!");
			await browser.switchWindow("Bob");
			await P.waitForMessage("Connected!");
			await P.closeBtn.click();
			await P.waitForMessage("Closed!");
			await browser.switchWindow("Alice");
			await P.waitForMessage("Closed!");
		},
		jasmine.DEFAULT_TIMEOUT_INTERVAL,
		2,
	);
});
