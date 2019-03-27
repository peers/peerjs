import "./setup";
import { expect } from "chai";
import { Peer } from "../lib/peer";
import { Server } from 'mock-socket';
import { ConnectionType, ServerMessageType } from "../lib/enums";

describe("Peer", function () {
    describe("after construct without parameters", function () {
        it("shouldn't contains any connection", function () {
            const peer = new Peer();

            expect(peer.connections).to.deep.eq({});
            expect(peer.id).to.be.undefined;
            expect(peer.disconnected).to.be.false;
            expect(peer.destroyed).to.be.false;

            peer.destroy();
        });
    });

    describe("after construct with parameters", function () {
        it("should contains id and key", function (done) {
            const peer = new Peer('1', { key: 'anotherKey' });

            expect(peer.id).to.eq('1');
            expect(peer.options.key).to.eq('anotherKey');

            peer.destroy();

            setTimeout(() => done(), 0);
        });
    });

    describe("after call to peer #2", function () {
        let mockServer;

        before(function () {
            const fakeURL = 'ws://localhost:8080/peerjs?key=peerjs&id=1&token=testToken';
            mockServer = new Server(fakeURL);

            mockServer.on('connection', socket => {
                //@ts-ignore
                socket.on('message', data => {
                    socket.send('test message from mock server');
                });

                socket.send(ServerMessageType.Open);
            });
        });

        it("Peer#1 should has id #1", function (done) {
            const peer1 = new Peer('1', { port: 8080, host: 'localhost' });

            const mediaOptions = {
                metadata: { var: '123' },
                constraints: {
                    mandatory: {
                        OfferToReceiveAudio: true,
                        OfferToReceiveVideo: true
                    }
                }
            };

            const track = new MediaStreamTrack();
            const mediaStream = new MediaStream([track]);

            const mediaConnection = peer1.call('2', mediaStream, { ...mediaOptions });

            expect(mediaConnection.connectionId).to.be.a('string');
            expect(mediaConnection.type).to.eq(ConnectionType.Media);
            expect(mediaConnection.peer).to.eq('2');
            expect(mediaConnection.options).to.include(mediaOptions);
            expect(mediaConnection.metadata).to.deep.eq(mediaOptions.metadata);
            expect(mediaConnection.peerConnection.getSenders()[0].track.id).to.eq(track.id);

            peer1.destroy();

            setTimeout(() => {
                expect(peer1.disconnected).to.be.true;
                expect(peer1.open).to.be.false;

                done();
            }, 0);
        });

        after(function () {
            mockServer.stop();
        });
    });
});
