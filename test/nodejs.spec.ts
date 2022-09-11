import { polyfills, randomString } from "./setup";
import { expect } from "chai";
import { Peer } from "../lib";

const makePeer = (id?: string) => new Peer(id, { polyfills, debug: 0 });

describe("NodeJS platform", function () {
	describe("basic", function () {
		it(`check features`, function () {
			const features = Peer.getFeatures(polyfills.WebRTC);
			expect(features.webRTC).true;
			expect(features.data).true;
			expect(features.audioVideo).true;
			expect(features.reliable).true;
			expect(features.unifiedPlan).true;
		});

		it(`destroy peer`, function () {
			const peer = makePeer();
			peer.destroy();
			expect(peer.destroyed).true;
			expect(peer.disconnected).true;
		});

		it("send simple message", function (done) {
			const peer1 = makePeer(randomString());

			peer1.on("connection", (conn) => {
				conn.on("data", (data) => {
					expect(data).eq("hi from peer2");
					conn.send(`finished!`);
				});

				conn.on("open", () => {
					conn.send("hello!");
				});
			});

			const peer2 = makePeer();

			const conn = peer2.connect(peer1.id, { serialization: "json" });

			conn.on("open", () => {
				conn.send("hi from peer2");

				const receivedMessage = [];
				conn.on("data", (data) => {
					receivedMessage.push(data);
					if (data === "finished!") {
						expect(receivedMessage).deep.eq(["hello!", "finished!"]);
						done();
						peer1.destroy();
						peer2.destroy();
						peer1.removeAllListeners();
						peer2.removeAllListeners();
					}
				});
			});
		});
	});
});
