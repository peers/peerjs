import { Peer, } from "./peer";
import { Cbor } from "./dataconnection/StreamConnection/Cbor";
import { SerializerMapping, defaultSerializers } from "./optionInterfaces";

export class CborPeer extends Peer {
	override _serializers: SerializerMapping = {
		...defaultSerializers,
		default: Cbor,
	};
}
