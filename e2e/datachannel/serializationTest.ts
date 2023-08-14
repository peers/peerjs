import P from "./serialization.page.js";
import { browser, expect } from "@wdio/globals";

export const serializationTest =
	(testFile: string, serialization: string) => async () => {
		await P.open(testFile, serialization);
		await P.waitForMessage("Your Peer ID: ");
		const bobId = (await P.messages.getText()).split("Your Peer ID: ")[1];
		await browser.switchWindow("Alice");
		await P.waitForMessage("Your Peer ID: ");
		await P.receiverId.setValue(bobId);
		await P.connectBtn.click();
		await P.waitForMessage("Connected!");
		await P.sendBtn.click();
		await P.waitForMessage("Sent!");
		await browser.switchWindow("Bob");
		await P.waitForMessage("Closed!");
		await P.checkBtn.click();
		await P.waitForMessage("Checked!");

		await expect(await P.errorMessage.getText()).toBe("");
		await expect(await P.result.getText()).toBe("Success!");
	};
