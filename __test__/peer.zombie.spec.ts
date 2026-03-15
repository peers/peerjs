import "./setup";
import { Peer } from "../lib/peer";
import { API } from "../lib/api";
import { Socket } from "../lib/socket";
import {
	expect,
	describe,
	it,
	beforeEach,
	afterEach,
	jest,
} from "@jest/globals";

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("Peer", () => {
	describe("zombie WebSocket after destroy (F1)", () => {
		let resolveId: (id: string) => void;
		let rejectId: (error: Error) => void;
		let retrieveIdSpy: ReturnType<typeof jest.spyOn>;
		let socketStartSpy: ReturnType<typeof jest.spyOn>;

		beforeEach(() => {
			retrieveIdSpy = jest
				.spyOn(API.prototype, "retrieveId")
				.mockImplementation(
					() =>
						new Promise<string>((resolve, reject) => {
							resolveId = resolve;
							rejectId = reject;
						}),
				);
			socketStartSpy = jest.spyOn(Socket.prototype, "start");
		});

		afterEach(() => {
			retrieveIdSpy.mockRestore();
			socketStartSpy.mockRestore();
		});

		it("should not start socket after destroy()", async () => {
			const peer = new Peer();
			expect(socketStartSpy).not.toHaveBeenCalled();

			peer.destroy();
			expect(peer.destroyed).toBe(true);

			resolveId("server-assigned-id");
			await flushPromises();

			expect(socketStartSpy).not.toHaveBeenCalled();
		});

		it("should not emit error when retrieveId rejects after destroy()", async () => {
			const peer = new Peer();
			const errorHandler = jest.fn();
			peer.on("error", errorHandler);

			peer.destroy();

			rejectId(new Error("network failure"));
			await flushPromises();

			expect(errorHandler).not.toHaveBeenCalled();
		});

		it("reconnect() still works with the guard in _initialize()", async () => {
			const peer = new Peer();

			resolveId("original-id");
			await flushPromises();

			expect(socketStartSpy).toHaveBeenCalledTimes(1);

			peer.disconnect();
			expect(peer.disconnected).toBe(true);

			socketStartSpy.mockClear();
			peer.reconnect();

			expect(socketStartSpy).toHaveBeenCalledTimes(1);

			peer.destroy();
		});

		it("normal flow: resolve before destroy — no zombie", async () => {
			const peer = new Peer();

			resolveId("server-assigned-id");
			await flushPromises();

			expect(socketStartSpy).toHaveBeenCalledTimes(1);
			expect(peer.destroyed).toBe(false);

			peer.destroy();
			expect(peer.destroyed).toBe(true);
		});
	});
});
