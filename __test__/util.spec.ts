import "./setup";
import { util } from "../lib/util";
import { expect, describe, it } from "@jest/globals";

describe("util", () => {
	describe("#chunkedMTU", () => {
		it("should be 16300", () => {
			expect(util.chunkedMTU).toBe(16300);
		});
	});
});
