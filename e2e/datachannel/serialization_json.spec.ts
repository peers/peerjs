import P from "./serialization.page.js";
import { serializationTest } from "./serializationTest.js";

describe("DataChannel:JSON", () => {
	beforeAll(async () => {
		await P.init();
	});
	it("should transfer numbers", serializationTest("./numbers", "json"));
	it("should transfer strings", serializationTest("./strings", "json"));
	// it("should transfer long string", serializationTest("./long_string", "json"));
	it("should transfer objects", serializationTest("./objects", "json"));
	it(
		"should transfer arrays (no chunks)",
		serializationTest("./arrays_unchunked", "json"),
	);
	it(
		"should transfer Dates as strings",
		serializationTest("./dates_as_json_string", "json"),
	);
	// it("should transfer ArrayBuffers", serializationTest("./arraybuffers", "json"));
	// it("should transfer TypedArrayView", serializationTest("./typed_array_view", "json"));
	// it(
	// 	"should transfer Uint8Arrays",
	// 	serializationTest("./Uint8Array", "json"),
	// );
	// it(
	// 	"should transfer Int32Arrays",
	// 	serializationTest("./Int32Array", "json"),
	// );
});
