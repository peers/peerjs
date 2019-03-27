import { expect } from "chai";
import { Peer } from "../lib/peer";
import { util } from '../lib/util';
import { WebSocket } from 'mock-socket';

//enable support for WebRTC
util.supports.audioVideo = true;

//stub WebSocket
//@ts-ignore
global.WebSocket = WebSocket;

describe("Peer", function () {
    describe("after construct without parameters", function () {
        it("shouldn't contains any connection", function () {
            const peer = new Peer();

            expect(peer.connections).to.deep.eq({});
            expect(peer.id).to.be.undefined;
            expect(peer.disconnected).to.be.false;
            expect(peer.destroyed).to.be.false;
        });
    });

    describe("after call to peer #2", function () {
        it("Peer#1 should has id #1", function () {
            const peer = new Peer('1', { key: 'anotherKey' });

            expect(peer.id).to.eq('1');
            expect(peer.options.key).to.eq('anotherKey');
        });
    });
});
