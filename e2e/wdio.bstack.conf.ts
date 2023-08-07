import { config as sharedConfig } from "./wdio.shared.conf.js";

export const config: WebdriverIO.Config = {
	...sharedConfig,
	...{
		/**
		 * Only allow one instance. We are limited to 5 parallel tests on BrowserStack.
		 */
		maxInstances: 1,
		user: process.env.BROWSERSTACK_USERNAME,
		key: process.env.BROWSERSTACK_ACCESS_KEY,
		hostname: "hub.browserstack.com",
		services: [
			[
				"browserstack",
				{
					browserstackLocal: true,
				},
			],
		],
		capabilities: [
			{
				browserName: "Edge",
				"bstack:options": {
					os: "Windows",
					osVersion: "11",
					browserVersion: "83",
					localIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
				},
			},
			{
				browserName: "Chrome",
				"bstack:options": {
					os: "Windows",
					osVersion: "11",
					browserVersion: "83",
					localIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
				},
			},
			{
				browserName: "Chrome",
				"bstack:options": {
					browserVersion: "latest",
					os: "Windows",
					osVersion: "11",
					localIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
				},
			},
			{
				browserName: "Firefox",
				"bstack:options": {
					os: "Windows",
					osVersion: "7",
					browserVersion: "80.0",
					localIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
				},
			},
			{
				browserName: "Firefox",
				"bstack:options": {
					browserVersion: "105",
					os: "OS X",
					osVersion: "Ventura",
					localIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
				},
			},
			// {
			//     browserName: "Safari",
			//     "bstack:options": {
			//         browserVersion: "latest",
			//         os: "OS X",
			//         osVersion: "Monterey",
			//         localIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
			//     },
			// },
			// {
			//     browserName: 'Safari',
			//     'bstack:options': {
			//         browserVersion: 'latest',
			//         os: 'OS X',
			//         osVersion: 'Ventura',
			//         localIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
			//     }
			// },
		],
	},
};
