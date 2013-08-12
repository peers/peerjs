describe('Peer', function() {

  describe('constructor', function() {
  });

  it('inherits from EventEmitter');

  describe('.browser', function() {
    it('should be the current browser', function() {
      var browser = window.mozRTCPeerConnection ? 'Firefox' : 'Unknown';
      browser = window.webkitRTCPeerConnection ? 'Webkit' : browser;
      expect(Peer.browser).to.be(browser);
    });
  });

});
