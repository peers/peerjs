import { util } from "./util";
import { PeerErrorType, PeerEventType } from "./enums";

export class ApiError {
  type: PeerErrorType;
  message: string = "";
}
export class API {
  constructor(private readonly _options: any) {}

  private _buildUrl(method: string): string {
    const protocol = this._options.secure ? "https://" : "http://";
    let url =
      protocol +
      this._options.host +
      ":" +
      this._options.port +
      this._options.path +
      this._options.key +
      "/" +
      method;
    const queryString = "?ts=" + new Date().getTime() + "" + Math.random();
    url += queryString;

    return url;
  }

  /** Get a unique ID from the server via XHR and initialize with it. */
  retrieveId(cb = (error: ApiError, id?: string) => {}): void {
    const http = new XMLHttpRequest();
    const url = this._buildUrl("id");
    // If there's no ID we need to wait for one before trying to init socket.
    http.open("get", url, true);

    const self = this;

    http.onerror = function(e) {
      util.error("Error retrieving ID", e);
      let pathError = "";

      if (
        self._options.path === "/" &&
        self._options.host !== util.CLOUD_HOST
      ) {
        pathError =
          " If you passed in a `path` to your self-hosted PeerServer, " +
          "you'll also need to pass in that same path when creating a new " +
          "Peer.";
      }

      cb({
        type: PeerErrorType.ServerError,
        message: "Could not get an ID from the server." + pathError
      });
    };

    http.onreadystatechange = function() {
      if (http.readyState !== 4 || http.status === 0) {
        return;
      }

      if (http.status !== 200) {
        http.onerror(new ProgressEvent(`status === ${http.status}`));
        return;
      }

      cb(null, http.responseText);
    };

    http.send(null);
  }

  listAllPeers(cb = (error: ApiError, peers?: any[]) => {}): void {
    const http = new XMLHttpRequest();
    let url = this._buildUrl("peers");

    // If there's no ID we need to wait for one before trying to init socket.
    http.open("get", url, true);

    const self = this;

    http.onerror = function(e) {
      util.error("Error retrieving list of peers", e);

      cb({
        type: PeerErrorType.ServerError,
        message: "Could not get peers from the server."
      });
    };

    http.onreadystatechange = function() {
      if (http.readyState !== 4) {
        return;
      }

      if (http.status === 401) {
        let helpfulError = "";
        if (self._options.host !== util.CLOUD_HOST) {
          helpfulError =
            "It looks like you're using the cloud server. You can email " +
            "team@peerjs.com to enable peer listing for your API key.";
        } else {
          helpfulError =
            "You need to enable `allow_discovery` on your self-hosted " +
            "PeerServer to use this feature.";
        }

        cb({
          type: PeerErrorType.ServerError,
          message:
            "It doesn't look like you have permission to list peers IDs. " +
            helpfulError
        });
      } else if (http.status !== 200) {
        cb(null, []);
      } else {
        cb(JSON.parse(http.responseText));
      }
    };

    http.send(null);
  }
}
