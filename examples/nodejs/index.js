const peerjs = require('peerjs');
const fetch = require('node-fetch');
const WebSocket = require('ws');
const WebRTC = require('wrtc');
const FileReader = require('filereader');

const { Peer } = peerjs;

const polyfills = { fetch, WebSocket, WebRTC, FileReader };

const peer = new Peer({ polyfills, debug: 3 });

peer.on('open', id => {
  console.log('Server: peer id ', id);
  const peer2 = new Peer({ polyfills, debug: 3 });

  peer2.on('open', id2 => {
    console.log('Client: peer id ', id2);
    const conn = peer2.connect(id, { serialization: 'json' });

    conn.on('open', () => {
      console.log('Client: connection open');
      setInterval(() => {
        conn.send('hi!');
      }, 1000);

      conn.on('data', data => {
        console.log('Client: ', data);
      });
    });
  });
});

peer.on('connection', conn => {
  conn.on('data', data => {
    console.log('Server: ', data);

    conn.send(`now time is ${Date.now()}`);
  });

  conn.on('open', () => {
    conn.send('hello!');
  });
});
