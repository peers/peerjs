import { util } from "./util";
import logger from "./logger";
import { PeerJSOption } from "./optionInterfaces";
import { version } from "../package.json";

export class API {
	constructor(private readonly _options: PeerJSOption) {}

	private _buildRequest(method: string): Promise<Response> {
		const protocol = this._options.secure ? "https" : "http";
		const { host, port, path, key } = this._options;
		const url = new URL(`${protocol}://${host}:${port}${path}${key}/${method}`);
		// TODO: Why timestamp, why random?
		url.searchParams.set("ts", `${Date.now()}${Math.random()}`);
		url.searchParams.set("version", version);
		return fetch(url.href, {
			referrerPolicy: "strict-origin-when-cross-origin",
		});
	}

	/** Get a unique ID from the server via XHR and initialize with it. */
	async retrieveId(): Promise<string> {
		try {
			const response = await this._buildRequest("id");

			if (response.status !== 200) {
				throw new Error(`Error. Status:${response.status}`);
			}

			return response.text();
		} catch (error) {
			logger.error("Error retrieving ID", error);

			let pathError = "";

			if (
				this._options.path === "/" &&
				this._options.host !== util.CLOUD_HOST
			) {
				pathError =
					" If you passed in a `path` to your self-hosted PeerServer, " +
					"you'll also need to pass in that same path when creating a new " +
					"Peer.";
			}

			throw new Error("Could not get an ID from the server." + pathError);
		}
	}

	/** @deprecated */
	async listAllPeers(): Promise<any[]> {
		try {
			const response = await this._buildRequest("peers");

			if (response.status !== 200) {
				if (response.status === 401) {
					let helpfulError = "";

					if (this._options.host === util.CLOUD_HOST) {
						helpfulError =
							"It looks like you're using the cloud server. You can email " +
							"team@peerjs.com to enable peer listing for your API key.";
					} else {
						helpfulError =
							"You need to enable `allow_discovery` on your self-hosted " +
							"PeerServer to use this feature.";
					}

					throw new Error(
						"It doesn't look like you have permission to list peers IDs. " +
							helpfulError,
					);
				}

				throw new Error(`Error. Status:${response.status}`);
			}

			return response.json();
		} catch (error) {
			logger.error("Error retrieving list peers", error);

			throw new Error("Could not get list peers from the server." + error);
		}
	}
}
