import "./setup";
import { expect } from "chai";
import { util } from "../lib/util";

describe("util", function () {
  describe("#chunkedMTU", function () {
    it("should be 16300", function () {
      expect(util.chunkedMTU).to.eq(16300);
    });
  });
});
