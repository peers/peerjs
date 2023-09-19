import { Peer, } from "./peer";
import { MsgPack} from "./exports";
import { SerializerMapping, defaultSerializers } from "./optionInterfaces";

export class MsgPackPeer extends Peer {
	override _serializers: SerializerMapping = {
		...defaultSerializers,
		default: MsgPack,
	};
}
