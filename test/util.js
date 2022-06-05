"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./setup");
var chai_1 = require("chai");
var util_1 = require("../lib/util");
describe("util", function () {
    describe("#chunkedMTU", function () {
        it("should be 16300", function () {
            (0, chai_1.expect)(util_1.util.chunkedMTU).to.eq(16300);
        });
    });
});
