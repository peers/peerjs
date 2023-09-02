import { Peer, type SerializerMapping } from "./peer";
import { MsgPack } from "./exports";

export class MsgPackPeer extends Peer {
	override _serializers: SerializerMapping = {
		MsgPack,
		default: MsgPack,
	};
}
