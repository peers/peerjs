import { browser, $ } from "@wdio/globals";

const { BYPASS_WAF } = process.env;

class SerializationPage {
	get receiverId() {
		return $("input[id='receiver-id']");
	}
	get callBtn() {
		return $("button[id='call-btn']");
	}

	get messages() {
		return $("div[id='messages']");
	}

	get closeBtn() {
		return $("button[id='close-btn']");
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

	async open() {
		await browser.switchWindow("Alice");
		await browser.url(`/e2e/mediachannel/close.html?key=${BYPASS_WAF}#Alice`);
		await this.callBtn.waitForEnabled();

		await browser.switchWindow("Bob");
		await browser.url(`/e2e/mediachannel/close.html?key=${BYPASS_WAF}#Bob`);
		await this.callBtn.waitForEnabled();
	}
	async init() {
		await browser.url("/e2e/alice.html");
		await browser.waitUntil(async () => {
			const title = await browser.getTitle();
			return title === "Alice";
		});
		await browser.pause(1000);
		await browser.newWindow("/e2e/bob.html");
		await browser.waitUntil(async () => {
			const title = await browser.getTitle();
			return title === "Bob";
		});
		await browser.pause(1000);
	}
}

export default new SerializationPage();
