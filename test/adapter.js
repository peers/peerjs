describe('adapter', function() {

  it('sets RTCPeerConnection', function() {
    expect(RTCPeerConnection).to.be.a('function');
  });

  it('sets RTCSessionDescription', function() {
    expect(RTCSessionDescription).to.be.a('function');
  });


});
