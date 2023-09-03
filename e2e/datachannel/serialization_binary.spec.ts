import P from "./serialization.page.js";
import { serializationTest } from "./serializationTest.js";
describe("DataChannel:Binary", () => {
	beforeAll(
		async () => {
			await P.init();
		},
		jasmine.DEFAULT_TIMEOUT_INTERVAL,
		2,
	);
	it(
		"should transfer numbers",
		serializationTest("./numbers", "binary"),
		jasmine.DEFAULT_TIMEOUT_INTERVAL,
		2,
	);
	it(
		"should transfer strings",
		serializationTest("./strings", "binary"),
		jasmine.DEFAULT_TIMEOUT_INTERVAL,
		2,
	);
	it(
		"should transfer long string",
		serializationTest("./long_string", "binary"),
		jasmine.DEFAULT_TIMEOUT_INTERVAL,
		2,
	);
	it(
		"should transfer objects",
		serializationTest("./objects", "binary"),
		jasmine.DEFAULT_TIMEOUT_INTERVAL,
		2,
	);
	it(
		"should transfer arrays",
		serializationTest("./arrays", "binary"),
		jasmine.DEFAULT_TIMEOUT_INTERVAL,
		2,
	);
	it(
		"should transfer Dates as strings",
		serializationTest("./dates_as_string", "binary"),
		jasmine.DEFAULT_TIMEOUT_INTERVAL,
		2,
	);
	it(
		"should transfer ArrayBuffers",
		serializationTest("./arraybuffers", "binary"),
		jasmine.DEFAULT_TIMEOUT_INTERVAL,
		2,
	);
	it(
		"should transfer TypedArrayView as ArrayBuffer",
		serializationTest("./TypedArrayView_as_ArrayBuffer", "binary"),
		jasmine.DEFAULT_TIMEOUT_INTERVAL,
		2,
	);
	it(
		"should transfer Uint8Arrays as ArrayBuffer",
		serializationTest("./Uint8Array_as_ArrayBuffer", "binary"),
		jasmine.DEFAULT_TIMEOUT_INTERVAL,
		2,
	);
	it(
		"should transfer Int32Arrays as ArrayBuffer",
		serializationTest("./Int32Array_as_ArrayBuffer", "binary"),
		jasmine.DEFAULT_TIMEOUT_INTERVAL,
		2,
	);
});
