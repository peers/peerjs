import { expect } from "chai";
import { Peer } from "../lib/peer";

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
});
