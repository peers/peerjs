"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./faker");
var util_1 = require("../lib/util");
//enable support for WebRTC
util_1.util.supports.audioVideo = true;
util_1.util.randomToken = function () { return "testToken"; };
