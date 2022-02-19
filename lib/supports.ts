export const Supports = new (class {
  isWebRTCSupported(): boolean {
    return typeof RTCPeerConnection !== 'undefined';
  }

  isUnifiedPlanSupported(): boolean {
    if (!window.RTCRtpTransceiver || !('currentDirection' in RTCRtpTransceiver.prototype)) return false;

    let tempPc: RTCPeerConnection;
    let supported = false;

    try {
      tempPc = new RTCPeerConnection();
      tempPc.addTransceiver('audio');
      supported = true;
    } catch (e) {
    } finally {
      if (tempPc) {
        tempPc.close();
      }
    }

    return supported;
  }

  toString(): string {
    return `Supports:
isWebRTCSupported:${this.isWebRTCSupported()}
isUnifiedPlanSupported:${this.isUnifiedPlanSupported()}`;
  }
})();
