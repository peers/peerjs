import Logger, { LogLevel } from "../lib/logger";
import { expect, beforeAll, afterAll, describe, it } from "@jest/globals";

describe("Logger", () => {
	let oldLoggerPrint;
	beforeAll(() => {
		//@ts-ignore
		oldLoggerPrint = Logger._print;
	});

	it("should be disabled by default", () => {
		expect(Logger.logLevel).toBe(LogLevel.Disabled);
	});

	it("should be accept new log level", () => {
		const checkedLevels = [];

		Logger.setLogFunction((logLevel) => {
			checkedLevels.push(logLevel);
		});

		Logger.logLevel = LogLevel.Warnings;

		expect(Logger.logLevel).toBe(LogLevel.Warnings);

		Logger.log("");
		Logger.warn("");
		Logger.error("");

		expect(checkedLevels).toEqual([LogLevel.Warnings, LogLevel.Errors]);
	});

	it("should accept new log function", () => {
		Logger.logLevel = LogLevel.All;

		const checkedLevels = [];
		const testMessage = "test it";

		Logger.setLogFunction((logLevel, ...args) => {
			checkedLevels.push(logLevel);

			expect(args[0]).toBe(testMessage);
		});

		Logger.log(testMessage);
		Logger.warn(testMessage);
		Logger.error(testMessage);

		expect(checkedLevels).toEqual([
			LogLevel.All,
			LogLevel.Warnings,
			LogLevel.Errors,
		]);
	});

	afterAll(() => {
		Logger.setLogFunction(oldLoggerPrint);
	});
});
