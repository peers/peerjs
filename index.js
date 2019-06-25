import mqtt from 'mqtt'
import uuid from 'uuid/v4'

const ID = uuid()
const separator = '( ͡° ͜ʖ ͡°)'
const RTC = {}
const client = mqtt.connect('wss://broker.peerjs.com')
let localStream

client.on('message', async (topic, message) => {
  const msg = message.toString()
  let cmd
  let payload
  if (msg.includes(separator)) {
    cmd = msg.split(separator)[0]
    payload = msg.split(separator)[1]
  } else {
    cmd = msg
  }
  switch (cmd) {
    case 'joinroom': {
      if (payload !== ID) client.publish(payload, `roomuser${separator}${ID}/${topic}`)
      break
    }
    case 'roomuser':
      console.log('roomuser payload', payload)
      let p = payload.split('/')
      const id = p.shift()
      call(id, p.join('/'))
      break
    case 'ice': {
      const ice = JSON.parse(payload)
      const caller = ice.id
      const room = ice.room
      try {
        console.log('ICE', ice)
        const candidate = new global.RTCIceCandidate(ice.candidate)
        console.log('CANDIDATE', candidate)
        if (candidate) {
          RTC[room][caller].addIceCandidate(candidate)
        }
      } catch (e) {
        console.log(e.message)
      }
      break
    }
    case 'answer': {
      console.log('ANSWER')
      const a = JSON.parse(payload)
      const caller = a.id
      const room = a.room
      const answer = a.answer
      try {
        await RTC[room][caller].setRemoteDescription(answer)
      } catch (e) {
        console.log(e.message)
      }
      break
    }
    case 'offer': {
      console.log('OFFER')
      const p = JSON.parse(payload)
      const caller = p.id
      const room = p.room
      const offer = p.offer
      const peerconn = new global.RTCPeerConnection({
        iceServers: [
          { urls: 'stun:0.peerjs.com:3478' },
          { urls: 'turn:0.peerjs.com:3478', username: 'peerjs', credential: 'peerjsp' }
        ]
      })
      RTC[room][caller] = peerconn
      peerconn.onicecandidate = event => {
        console.log('local ice', event)
        if (event.candidate) {
          client.publish(caller, `ice${separator}${JSON.stringify({
            id: ID,
            room,
            candidate: event.candidate
          })}`)
        }
      }
      peerconn.onsignalingstatechange = event => {
        console.log('STATE', peerconn.signalingState)
      }
      peerconn.oniceconnectionstatechange = event => {
        console.log('ICE STATE', peerconn.iceConnectionState)
      }
      peerconn.ontrack = event => {
        RTC[room].onRemoteStream(event.streams[0])
      }
      peerconn.onremovetrack = event => {
        console.log('ON REMOVE TRACK', event)
      }
      peerconn.ondatachannel = dataChannel => {
        RTC[room].onDataStream(dataChannel.channel)
      }
      try {
        const desc = new global.RTCSessionDescription(offer)
        await peerconn.setRemoteDescription(desc)
        // dataChannel comes from the offer, must not create one
        if (room.split('/')[0] !== 'data') {
          await processMedia(caller, room.split('/')[0], room, peerconn)
        }
        const answer = await peerconn.createAnswer()
        await peerconn.setLocalDescription(answer)
        client.publish(caller, `answer${separator}${JSON.stringify({
          id: ID,
          room: room,
          answer: peerconn.localDescription
        })}`)
      } catch (e) {
        console.log('setRemoteDescription', e.message)
      }
    }
  }
})

client.on('connect', () => {
  client.subscribe(ID, err => {
    if (err) console.error(err)
  })
})

function Call (room, onRemoteStream, onLocalStream, onDataStream) {
  RTC[room] = {
    onRemoteStream,
    onLocalStream,
    onDataStream
  }
  client.subscribe(room, err => {
    if (err) console.error(err)
  })
  console.log('publish to', room, `joinroom${separator}${ID}`)
  client.publish(room, `joinroom${separator}${ID}`)
}

export default class Peer {
  constructor (room, { mode, secret, onRemoteStream, onLocalStream, onDataStream }) {
    const _room = `${mode || 'video'}/${room}${secret}`
    this.room = _room
    Call(_room, onRemoteStream, onLocalStream, onDataStream)
  }

  video (yes) {
    const videoTrack = localStream.getVideoTracks()
    videoTrack[0].enabled = yes
  }

  close () {
    for (let k of Object.keys(RTC[this.room])) {
      close(RTC[this.room][k])
    }
    delete RTC[this.room]
  }
}

window.Peer = Peer

async function call (id, room) {
  const peerconn = new global.RTCPeerConnection({
    iceServers: [
      { urls: 'stun:0.peerjs.com:3478' },
      { urls: 'turn:0.peerjs.com:3478', username: 'peerjs', credential: 'peerjsp' }
    ]
  })

  console.log('ROOM', room)

  RTC[room][id] = peerconn

  peerconn.onnegotiationneeded = async () => {
    const offer = await peerconn.createOffer()
    try {
      await peerconn.setLocalDescription(offer)
    } catch (e) {
      console.log('setLocalDescription', e.message)
    }
    client.publish(id, `offer${separator}${JSON.stringify({
      id: ID,
      room,
      offer: peerconn.localDescription
    })}`)
  }
  peerconn.oniceconnectionstatechange = event => {
    if (peerconn.iceConnectionState === 'disconnected') {
      console.error('iceConnectionState disconnected')
    }
  }
  peerconn.ontrack = event => {
    console.log('new track', event.streams[0])
    RTC[room].onRemoteStream(event.streams[0])
  }
  peerconn.onremovetrack = event => {
    console.log('ON REMOVE TRACK', event)
  }
  peerconn.onicecandidate = (event) => {
    if (event.candidate) {
      client.publish(id, `ice${separator}${JSON.stringify({
        id: ID,
        room: room,
        candidate: event.candidate
      })}`)
    }
  }

  const mode = room.split('/')[0]
  processMedia(id, mode, room, peerconn)
}

async function processMedia (id, mode, room, peerconn) {
  switch (mode) {
    case 'audio': {
      if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true
        })
        RTC[room].onLocalStream(localStream)
      }
      const tracks = localStream.getTracks()
      for (let t of tracks) {
        peerconn.addTrack(t, localStream)
      }
      break
    }
    case 'video': {
      if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })
        RTC[room].onLocalStream(localStream)
      }
      const videoTracks = localStream.getVideoTracks()
      RTC[room].videoSender = peerconn.addTrack(videoTracks[0], localStream)
      const audioTracks = localStream.getAudioTracks()
      RTC[room].audioSender = peerconn.addTrack(audioTracks[0], localStream)
      break
    }
    case 'data':
      let dataChannel = peerconn.createDataChannel(id)
      dataChannel.addEventListener('open', () => {
        RTC[room].onDataStream(dataChannel)
      })
  }
}

function close (mediaConnection) {
  try {
    mediaConnection.ontrack = null
    mediaConnection.onremovetrack = null
    mediaConnection.onremovestream = null
    mediaConnection.onicecandidate = null
    mediaConnection.oniceconnectionstatechange = null
    mediaConnection.onsignalingstatechange = null
    mediaConnection.onicegatheringstatechange = null
    mediaConnection.onnegotiationneeded = null
    mediaConnection.close()
    mediaConnection = null
  } catch (e) {
    console.log('Trying to close', mediaConnection)
  }
}
