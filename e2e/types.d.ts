/* eslint no-unused-vars: 0 */

declare module "https://esm.sh/v126/chai@4.3.7/X-dHMvZXhwZWN0/es2021/chai.bundle.mjs" {
	export = chai;
}

interface Window {
	"connect-btn": HTMLButtonElement;
	send: (dataConnection: import("../../peerjs").DataConnection) => void;
	check: (received: unknown[]) => void;
}
