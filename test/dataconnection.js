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
        pdc._handleDataMessage({ data: msg });
      }
    };

    describe('constructor', function() {
      it('should accept options properly', function() {
        // Test without 'new' keyword.
        dc = DataConnection('peer', null,
          { serialization: 'json',
            metadata: { message: 'I\'m testing!'} });

        expect(dc.peer).to.be('peer');
        expect(dc.serialization).to.be('json');
        expect(dc.metadata.message).to.be('I\'m testing!');

        expect(dc._dc).to.be(null);
        dc._dc = new DataChannelStub();
      });
    });

    it('inherits from EventEmitter');

    before(function() {
      dc = DataConnection('peer', null,
        { serialization: 'json',
          metadata: { message: 'I\'m testing!'} });
      dc._dc = new DataChannelStub();
    });

    describe('#_configureDataChannel', function() {
      it('should set the correct binaryType', function() {
        dc._configureDataChannel();

        if (util.browserisms === 'Firefox') {
          expect(dc._dc.binaryType).to.be('arraybuffer');
        } else {
          expect(dc._reliable).to.be(undefined);
        }
      });

      it('should fire an `open` event', function(done) {
        dc.on('open', function() {
          expect(dc.open).to.be(true)
          done();
        });
        dc._dc.onopen();
      });
    });

    describe('#_handleDataMessage', function() {

    });

    describe('#addDC', function() {
      it('should add a DataConnection properly', function() {
        pdc = new DataConnection('ignore', null, { serialization: 'json', reliable: true });
        pdc.addDC(new DataChannelStub());

        expect(pdc._dc).not.to.be(null);
      });
    });

    describe('#send', function() {
      it('should send data to the peer', function(done) {
        pdc = new DataConnection('ignore', null, { serialization: 'json' });
        pdc.on('data', function(data) {
          expect(data.hello).to.be('peer-tester');
          done();
        });
        dc.send({ hello: 'peer-tester' });
      });
    });

    describe('#_cleanup', function() {
      it('should emit a `close` event', function(done) {
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
    });

    // Hacks hacks
    describe('#close', function() {
      it('should not call _cleanup', function() {
        dc._cleanup = function() {
          throw Error();
        }

        // Should not call _cleanup again.
        dc.close();
      });
    });


  } else {
    it('should not work.', function() {});
  }
});
