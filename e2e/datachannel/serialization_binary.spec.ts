import P from "./serialization.page.js";
import { serializationTest } from "./serializationTest.js";
describe("DataChannel:Binary", () => {
	beforeAll(async () => {
		await P.init();
	});
	it("should transfer numbers", serializationTest("./numbers", "binary"));
	it("should transfer strings", serializationTest("./strings", "binary"));
	it(
		"should transfer long string",
		serializationTest("./long_string", "binary"),
	);
	it("should transfer objects", serializationTest("./objects", "binary"));
	it("should transfer arrays", serializationTest("./arrays", "binary"));
	it(
		"should transfer Dates as strings",
		serializationTest("./dates_as_string", "binary"),
	);
	it(
		"should transfer ArrayBuffers",
		serializationTest("./arraybuffers", "binary"),
	);
	it(
		"should transfer TypedArrayView as ArrayBuffer",
		serializationTest("./TypedArrayView_as_ArrayBuffer", "binary"),
	);
	it(
		"should transfer Uint8Arrays as ArrayBuffer",
		serializationTest("./Uint8Array_as_ArrayBuffer", "binary"),
	);
	it(
		"should transfer Int32Arrays as ArrayBuffer",
		serializationTest("./Int32Array_as_ArrayBuffer", "binary"),
	);
});
