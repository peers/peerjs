import P from "./serialization.page.js";
import { serializationTest } from "./serializationTest.js";
import { browser } from "@wdio/globals";

describe("DataChannel:MsgPack", function () {
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
	it("should transfer numbers", serializationTest("./numbers", "MsgPack"));
	it("should transfer strings", serializationTest("./strings", "MsgPack"));
	it(
		"should transfer long string",
		serializationTest("./long_string", "MsgPack"),
	);
	it("should transfer objects", serializationTest("./objects", "MsgPack"));
	it("should transfer arrays", serializationTest("./arrays", "MsgPack"));
	it(
		"should transfer Dates as strings",
		serializationTest("./dates", "MsgPack"),
	);
	// it("should transfer ArrayBuffers", serializationTest("./arraybuffers", "MsgPack"));
	it(
		"should transfer TypedArrayView",
		serializationTest("./typed_array_view", "MsgPack"),
	);
	it(
		"should transfer Uint8Arrays",
		serializationTest("./Uint8Array", "MsgPack"),
	);
	it(
		"should transfer Int32Arrays as Uint8Arrays",
		serializationTest("./Int32Array_as_Uint8Array", "MsgPack"),
	);
});
