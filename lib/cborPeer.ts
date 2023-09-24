import { Peer, } from "./peer";
import { Cbor } from "./dataconnection/StreamConnection/Cbor";
import { SerializerMapping, } from "./optionInterfaces";
import { SerializationType } from "./enums";

export class CborPeer extends Peer {
	protected override _defaultSerialization = SerializationType.CBOR;
	override _serializers: SerializerMapping = {
		cbor: Cbor,
	};
}
