"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var mock_socket_1 = require("mock-socket");
require("webrtc-adapter");
var fakeGlobals = {
    WebSocket: mock_socket_1.WebSocket,
    MediaStream: /** @class */ (function () {
        function MediaStream(tracks) {
            this._tracks = [];
            if (tracks) {
                this._tracks = tracks;
            }
        }
        MediaStream.prototype.getTracks = function () {
            return this._tracks;
        };
        MediaStream.prototype.addTrack = function (track) {
            this._tracks.push(track);
        };
        return MediaStream;
    }()),
    MediaStreamTrack: (_a = /** @class */ (function () {
            function MediaStreamTrack() {
                this.id = "track#".concat(fakeGlobals.MediaStreamTrack._idCounter++);
            }
            return MediaStreamTrack;
        }()),
        _a._idCounter = 0,
        _a),
    RTCPeerConnection: /** @class */ (function () {
        function RTCPeerConnection() {
            this._senders = [];
        }
        RTCPeerConnection.prototype.close = function () { };
        RTCPeerConnection.prototype.addTrack = function (track) {
            var _stream = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                _stream[_i - 1] = arguments[_i];
            }
            var newSender = new RTCRtpSender();
            newSender.replaceTrack(track);
            this._senders.push(newSender);
            return newSender;
        };
        // removeTrack(_: RTCRtpSender): void { }
        RTCPeerConnection.prototype.getSenders = function () {
            return this._senders;
        };
        return RTCPeerConnection;
    }()),
    RTCRtpSender: /** @class */ (function () {
        function RTCRtpSender() {
        }
        RTCRtpSender.prototype.replaceTrack = function (withTrack) {
            this.track = withTrack;
            return Promise.resolve();
        };
        return RTCRtpSender;
    }()),
};
Object.assign(global, fakeGlobals);
Object.assign(window, fakeGlobals);
