import { expect } from "chai";
import Logger, { LogLevel } from "../lib/logger";

describe("Logger", function () {
    let oldLoggerPrint;
    before(() => {
        //@ts-ignore
        oldLoggerPrint = Logger._print;
    });

    it("should be disabled by default", function () {
        expect(Logger.logLevel).to.eq(LogLevel.Disabled);
    });

    it("should be accept new log level", function () {
        const checkedLevels = [];

        Logger.setLogFunction((logLevel) => {
            checkedLevels.push(logLevel);
        });

        Logger.logLevel = LogLevel.Warnings;

        expect(Logger.logLevel).to.eq(LogLevel.Warnings);

        Logger.log('');
        Logger.warn('');
        Logger.error('');

        expect(checkedLevels).to.deep.eq([LogLevel.Warnings, LogLevel.Errors]);
    });

    it("should accept new log function", function () {
        Logger.logLevel = LogLevel.All;

        const checkedLevels = [];
        const testMessage = 'test it';

        Logger.setLogFunction((logLevel, ...args) => {
            checkedLevels.push(logLevel);

            expect(args[0]).to.eq(testMessage);
        });

        Logger.log(testMessage);
        Logger.warn(testMessage);
        Logger.error(testMessage);

        expect(checkedLevels).to.deep.eq([LogLevel.All, LogLevel.Warnings, LogLevel.Errors]);
    });

    after(() => {
        Logger.setLogFunction(oldLoggerPrint);
    })
});
