import { config as sharedConfig } from "./wdio.shared.conf.js";

export const config: WebdriverIO.Config = {
	...sharedConfig,
	...{
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
					browserVersion: "81",
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
				browserName: "Safari",
				"bstack:options": {
					browserVersion: "latest",
					os: "OS X",
					osVersion: "Big Sur",
					localIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
				},
			},
			// {
			// 	browserName: 'Safari',
			// 	'bstack:options': {
			// 		browserVersion: 'latest',
			// 		os: 'OS X',
			// 		osVersion: 'Monterey'
			// 	}
			// },
			// {
			// 	browserName: 'Chrome',
			// 	'bstack:options': {
			// 		browserVersion: 'latest',
			// 		os: 'Windows',
			// 		osVersion: '11'
			// 	}
			// },
			// {
			// 	browserName: 'Firefox',
			// 	'bstack:options': {
			// 		browserVersion: 'latest',
			// 		os: 'OS X',
			// 		osVersion: 'Ventura'
			// 	}
			// }
		],
	},
};
