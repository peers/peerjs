export const Supports = {
  isUnifiedPlanSupported(webRtc: any): boolean {
    if (!webRtc && typeof window !== 'undefined') {
      webRtc = window;
    }

    if (
      typeof webRtc.RTCRtpTransceiver === 'undefined' ||
      !('currentDirection' in webRtc.RTCRtpTransceiver.prototype)
    ) {
      return false;
    }

    let tempPc: RTCPeerConnection;
    let supported = false;

    try {
      tempPc = new webRtc.RTCPeerConnection();
      tempPc.addTransceiver('audio');
      supported = true;
    } catch (e) {
    } finally {
      if (tempPc) {
        tempPc.close();
      }
    }

    return supported;
  },
} as const;
