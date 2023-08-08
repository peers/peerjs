import { Peer, SerializerMapping } from "./peer";
import { Cbor } from "./dataconnection/StreamConnection/Cbor";

export class CborPeer extends Peer {
	override _serializers: SerializerMapping = {
		Cbor,
		default: Cbor,
	};
}
