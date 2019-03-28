import { WebSocket } from 'mock-socket';
import { adapter as _ } from 'webrtc-adapter';

const fakeGlobals = {
    WebSocket,
    MediaStream: class MediaStream {
        private _tracks: MediaStreamTrack[] = [];

        constructor(tracks?: MediaStreamTrack[]) {
            if (tracks) {
                this._tracks = tracks;
            }
        }

        getTracks(): MediaStreamTrack[] {
            return this._tracks;
        }

        addTrack(track: MediaStreamTrack) {
            this._tracks.push(track);
        }
    },
    MediaStreamTrack: class MediaStreamTrack {
        kind: string;
        id: string;

        private static _idCounter = 0;

        constructor() {
            this.id = `track#${fakeGlobals.MediaStreamTrack._idCounter++}`;
        }
    },
    RTCPeerConnection: class RTCPeerConnection {
        private _senders: RTCRtpSender[] = [];

        close() { }

        addTrack(track: MediaStreamTrack, ..._stream: MediaStream[]): RTCRtpSender {
            const newSender = new RTCRtpSender();
            newSender.replaceTrack(track);

            this._senders.push(newSender);

            return newSender;
        }

        // removeTrack(_: RTCRtpSender): void { }

        getSenders(): RTCRtpSender[] { return this._senders; }
    },
    RTCRtpSender: class RTCRtpSender {
        readonly dtmf: RTCDTMFSender | null;
        readonly rtcpTransport: RTCDtlsTransport | null;
        track: MediaStreamTrack | null;
        readonly transport: RTCDtlsTransport | null;

        replaceTrack(withTrack: MediaStreamTrack | null): Promise<void> {
            this.track = withTrack;

            return Promise.resolve();
        }
    }
}

Object.assign(global, fakeGlobals);
Object.assign(window, fakeGlobals);