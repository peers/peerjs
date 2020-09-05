let webRTCAdapter = {};

if (typeof window !== 'undefined')
  webRTCAdapter = require('webrtc-adapter').default;


export { webRTCAdapter };
