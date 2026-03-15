import "./setup";
import { Peer } from "../lib/peer";
import { API } from "../lib/api";
import { PeerErrorType } from "../lib/enums";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

describe("Peer identity mismatch on reconnect", () => {
	let peer: Peer;

	afterEach(() => {
		peer?.destroy();
	});

	it("disconnect+reconnect during retrieveId should not open socket with null id", async () => {
		// retrieveId returns a promise that never resolves (simulates in-flight)
		let resolveId: (id: string) => void;
		jest
			.spyOn(API.prototype, "retrieveId")
			.mockImplementation(
				() => new Promise<string>((resolve) => (resolveId = resolve)),
			);

		peer = new Peer({ host: "localhost", port: 8080 });

		const socketStartSpy = jest.spyOn(peer.socket, "start");

		// disconnect before retrieveId resolves
		peer.disconnect();

		// now reconnect — _lastServerId is null
		peer.reconnect();

		// socket.start should NOT have been called with null id
		for (const call of socketStartSpy.mock.calls) {
			expect(call[0]).not.toBeNull();
			expect(call[0]).not.toBe("null");
			expect(call[0]).toBeTruthy();
		}

		socketStartSpy.mockRestore();
	});

	it("late retrieveId resolve after disconnect should not initialize", async () => {
		let resolveId: (id: string) => void;
		jest
			.spyOn(API.prototype, "retrieveId")
			.mockImplementation(
				() => new Promise<string>((resolve) => (resolveId = resolve)),
			);

		peer = new Peer({ host: "localhost", port: 8080 });

		const socketStartSpy = jest.spyOn(peer.socket, "start");

		// disconnect before retrieveId resolves
		peer.disconnect();

		// now resolve the id — _initialize should be guarded
		resolveId!("late-id");

		// wait for microtask to flush
		await Promise.resolve();

		// socket.start should NOT have been called after disconnect
		expect(socketStartSpy).not.toHaveBeenCalled();

		socketStartSpy.mockRestore();
	});

	it("reconnect with null _lastServerId should emit error", () => {
		let resolveId: (id: string) => void;
		jest
			.spyOn(API.prototype, "retrieveId")
			.mockImplementation(
				() => new Promise<string>((resolve) => (resolveId = resolve)),
			);

		peer = new Peer({ host: "localhost", port: 8080 });

		const socketStartSpy = jest.spyOn(peer.socket, "start");

		peer.disconnect();

		const errors: { type: string }[] = [];
		peer.on("error", (err) => errors.push(err));

		peer.reconnect();

		expect(errors.length).toBe(1);
		expect(errors[0].type).toBe(PeerErrorType.Disconnected);
		expect(socketStartSpy).not.toHaveBeenCalled();

		socketStartSpy.mockRestore();
	});

	it("retrieveId rejection after disconnect should not emit error", async () => {
		let rejectId: (err: Error) => void;
		jest
			.spyOn(API.prototype, "retrieveId")
			.mockImplementation(
				() => new Promise<string>((_, reject) => (rejectId = reject)),
			);

		peer = new Peer({ host: "localhost", port: 8080 });

		peer.disconnect();

		const errors: { type: string }[] = [];
		peer.on("error", (err) => errors.push(err));

		// reject the retrieveId — should be swallowed since peer is disconnected
		rejectId!(new Error("aborted"));

		// wait for microtask
		await Promise.resolve();
		await Promise.resolve();

		expect(errors.length).toBe(0);
	});

	it("normal reconnect still works", async () => {
		jest.spyOn(API.prototype, "retrieveId").mockResolvedValue("server-id-123");

		peer = new Peer({ host: "localhost", port: 8080 });

		// wait for retrieveId to resolve and _initialize to run
		await Promise.resolve();
		await Promise.resolve();

		expect(peer.id).toBe("server-id-123");

		const socketStartSpy = jest.spyOn(peer.socket, "start");

		peer.disconnect();

		expect(peer.disconnected).toBe(true);
		// @ts-ignore — access private field
		expect(peer._lastServerId).toBe("server-id-123");

		peer.reconnect();

		expect(socketStartSpy).toHaveBeenCalledWith(
			"server-id-123",
			expect.any(String),
		);

		socketStartSpy.mockRestore();
	});

	it("destroy during retrieveId + reconnect throws", async () => {
		jest
			.spyOn(API.prototype, "retrieveId")
			.mockImplementation(() => new Promise<string>(() => {}));

		peer = new Peer({ host: "localhost", port: 8080 });

		peer.destroy();

		expect(() => peer.reconnect()).toThrow(
			"This peer cannot reconnect to the server. It has already been destroyed.",
		);
	});
});
