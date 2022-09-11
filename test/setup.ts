import { Utils } from "../lib";

import fetch from "node-fetch";
import * as WebRTC from "wrtc";

export const polyfills = { fetch, WebRTC };

Utils.randomToken = () => "testToken";

export function randomString(length = 10): string {
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const charactersLength = characters.length;

	let result = "";

	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}

	return result;
}

process.on("beforeExit", (code) => process.exit(code));
