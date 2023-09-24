import { Peer, } from "./peer";
import { SerializerMapping, } from "./optionInterfaces";
import { MsgPack } from "./dataconnection/StreamConnection/MsgPack";
import { SerializationType } from "./enums";

export class MsgPackPeer extends Peer {
	protected override _defaultSerialization = SerializationType.CBOR;
	override _serializers: SerializerMapping = {
		msgpack: MsgPack,
	};
}
