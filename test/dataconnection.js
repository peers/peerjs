describe('DataConnection', function() {

  // Only run tests on compatible browser.
  if (util.isBrowserCompatible()) {

    var dc, pdc;

    function DataChannelStub() {};
    DataChannelStub.prototype = {
      close: function() {
        if (this.readyState === 'closed') {
          throw Error();
        }
        this.readyState = 'closed';
      },
      // Only sends to peer's dc.
      send: function(msg) {
        pdc._dc.onmessage({ data: msg });
      }
    };

    it('constructor', function() {
      // Test without 'new' keyword.
      dc = DataConnection('peer', null,
        { serialization: 'json',
          metadata: { message: 'I\'m testing!'},
          reliable: true });

      expect(dc.peer).to.be('peer');
      expect(dc.serialization).to.be('json');
      expect(dc.metadata.message).to.be('I\'m testing!');

      expect(dc._dc).to.be(null);
      dc._dc = new DataChannelStub();
    });

    it('inherits from EventEmitter');

    it('_configureDataChannel', function() {
      dc._configureDataChannel();

      if (util.browserisms === 'Firefox') {
        expect(dc._dc.binaryType).to.be('arraybuffer');
      } else {
        expect(dc._reliable).not.to.be(undefined);
      }
    });

    it('should fire an `open` event', function(done) {
      dc.on('open', function() {
        expect(dc.open).to.be(true)
        done();
      });
      dc._dc.onopen();
    });

    it('_handleDataMessage', function() {
       
    });

    it('addDC', function() {
      pdc = new DataConnection('ignore', null, { serialization: 'json', reliable: true });
      pdc.addDC(new DataChannelStub());

      expect(pdc._dc).not.to.be(null);
    });

    it('send', function(done) {
      pdc.on('data', function(data) {
        expect(data.hello).to.be('peer-tester');
        done();
      });
      dc.send({ hello: 'peer-tester' });
    });

    it('_cleanup', function(done) {
      var first = true;
      dc.on('close', function() {
        expect(dc.open).to.be(false)

        // Calling it twice should be fine.
        if (first) {
          first = false;
          dc._cleanup();
        }

        done();
      });

      dc._cleanup();
    });

    it('close', function() {
      dc._cleanup = function() {
        throw Error();
      }

      // Should not call _cleanup again.
      dc.close();
    });


  } else {
    it('should not work.', function() {});
  }
});
