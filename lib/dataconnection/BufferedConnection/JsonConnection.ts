import { BufferedConnection } from "./BufferedConnection";
import { SerializationType } from "../../enums";

export class JsonConnection extends BufferedConnection {
	readonly serialization = SerializationType.JSON;

	stringify: (data: any) => string = JSON.stringify;
	parse: (data: string) => any = JSON.parse;

	protected _handleDataMessage({ data }) {
		super.emit("data", this.parse(data.toString()));
	}

	override _send(data, _chunked) {
		this._bufferedSend(this.stringify(data));
	}
}
