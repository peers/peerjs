describe('adapter', function() {

  it('sets browerisms', function() {
    expect(exports.util.browserisms).to.match(/^Firefox||Webkit$/);
  })

  it('sets RTCPeerConnection', function() {
    expect(RTCPeerConnection).to.be.a('function');
  })

  it('sets RTCSessionDescription', function() {
    expect(RTCSessionDescription).to.be.a('function');
  })

  it('sets getUserMedia', function() {
    expect(getUserMedia).to.be.a('function');
  })

});
