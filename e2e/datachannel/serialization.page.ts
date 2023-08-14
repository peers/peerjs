import { browser, $ } from "@wdio/globals";
class SerializationPage {
	get sendBtn() {
		return $("button[id='send-btn']");
	}

	get checkBtn() {
		return $("button[id='check-btn']");
	}
	get connectBtn() {
		return $("button[id='connect-btn']");
	}

	get receiverId() {
		return $("input[id='receiver-id']");
	}

	get messages() {
		return $("div[id='messages']");
	}

	get errorMessage() {
		return $("div[id='error-message']");
	}

	get result() {
		return $("div[id='result']");
	}

	waitForMessage(right: string) {
		return browser.waitUntil(
			async () => {
				const messages = await this.messages.getText();
				return messages.startsWith(right);
			},
			{ timeoutMsg: `Expected message to start with ${right}`, timeout: 10000 },
		);
	}

	async open(testFile: string, serialization: string) {
		await browser.switchWindow("Alice");
		await browser.url(
			`/e2e/datachannel/serialization.html?testfile=${testFile}&serialization=${serialization}#Alice`,
		);
		await this.connectBtn.waitForEnabled();

		await browser.switchWindow("Bob");
		await browser.url(
			`/e2e/datachannel/serialization.html?testfile=${testFile}#Bob`,
		);
		await this.connectBtn.waitForEnabled();
	}
	async init() {
		await browser.url("/e2e/alice.html");
		await browser.waitUntil(async () => {
			const title = await browser.getTitle();
			return title === "Alice";
		});
		await browser.newWindow("/e2e/bob.html");
		await browser.waitUntil(async () => {
			const title = await browser.getTitle();
			return title === "Bob";
		});
	}
}

export default new SerializationPage();
