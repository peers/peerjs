import { browser, $ } from "@wdio/globals";
class PeerPage {
	get messages() {
		return $("div[id='messages']");
	}

	get errorMessage() {
		return $("div[id='error-message']");
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

	async open(test: string) {
		await browser.url(`/e2e/peer/${test}.html`);
	}
}

export default new PeerPage();
