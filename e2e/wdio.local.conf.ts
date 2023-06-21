import { config as sharedConfig } from "./wdio.shared.conf.js";

export const config: WebdriverIO.Config = {
	runner: "local",
	...sharedConfig,
	services: ["geckodriver"],
	...{
		capabilities: [
			{
				browserName: "chrome",
				"wdio:devtoolsOptions": {
					headless: true,
				},
			},
			{
				browserName: "firefox",
				"moz:firefoxOptions": {
					args: ["-headless"],
				},
			},
		],
	},
};
