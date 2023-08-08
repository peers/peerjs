import P from "./serialization.page.js";
import { serializationTest } from "./serializationTest.js";
import { browser } from "@wdio/globals";

describe("DataChannel:CBOR", function () {
	beforeAll(async function () {
		await P.init();
	});
	beforeEach(async function () {
		if (
			// @ts-ignore
			browser.capabilities.browserName === "firefox" &&
			// @ts-ignore
			parseInt(browser.capabilities.browserVersion) < 102
		) {
			pending("Firefox 102+ required for Streams");
		}
	});
	it("should transfer numbers", serializationTest("./numbers", "Cbor"));
	it("should transfer strings", serializationTest("./strings", "Cbor"));
	it("should transfer long string", serializationTest("./long_string", "Cbor"));
	it("should transfer objects", serializationTest("./objects", "Cbor"));
	it("should transfer arrays", serializationTest("./arrays", "Cbor"));
	it("should transfer dates", serializationTest("./dates", "Cbor"));
	it(
		"should transfer ArrayBuffers as Uint8Arrays",
		serializationTest("./arraybuffers_as_uint8array", "Cbor"),
	);
	it(
		"should transfer TypedArrayView",
		serializationTest("./typed_array_view", "Cbor"),
	);
	it("should transfer Uint8Arrays", serializationTest("./Uint8Array", "Cbor"));
	it("should transfer Int32Arrays", serializationTest("./Int32Array", "Cbor"));
});
