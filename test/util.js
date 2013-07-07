describe('util', function() {

  var testRandom = function(fn) {
    var i = 0
      , generated = {};
    while(i < 25) {
      var p = fn();
      if (generated[p]) throw new Error('not so random')
      generated[p] = 1;
      i++;
    }
  }

  describe('.inherits', function() {
    it('should make functions inherit properly', function() {
      function ctor() {}
      function superCtor() {}
      superCtor.prototype.test = function() { return 5; }
      util.inherits(ctor, superCtor);
      expect(new ctor()).to.be.a(superCtor);
      expect(new ctor().test()).to.be.equal(5);
    });
  });

  /*
   *  extend overwrites keys if already exists
   *  leaves existing keys alone otherwise
   */
  describe('.extend', function() {
    it('should copy the properties of b to a', function() {
      var a = {a: 1, b: 2, c: 3, d: 4}
        , b = {d: 2};
      util.extend(b, a);
      expect(b).to.eql(a);
      expect(b.d).to.be.equal(4);
      b = {z: 2};
      util.extend(b, a);
      expect(b.z).to.be.equal(2);
    });
  });

  describe('.pack', function() {
    it('should be BinaryPack\'s `pack` function', function() {
      expect(util.pack).to.be.equal(BinaryPack.pack);
    });
  });

  describe('.unpack', function() {
    it('should be BinaryPack\'s `unpack` function', function() {
      expect(util.unpack).to.be.equal(BinaryPack.unpack);
    });
  });

  // FF no like
  describe('.log', function() {
    it('should log with the PeerJS prefix', function(done) {
      var consolelog = console.log;
      // default is false
      expect(util.debug).to.be.equal(false);
      util.debug = true;
      console.log = function() {
        var arg = Array.prototype.slice.call(arguments);
        expect(arg.join(' ')).to.be.equal('PeerJS:  hi');
        done();
      }
      util.log('hi');
      // reset
      console.log = consolelog;
      util.debug = false;
    });
  });

  describe('.setZeroTimeout', function() {
    it('should call the function after a 0s timeout', function(done) {
      var isdone = false;
      util.setZeroTimeout(function() {
        if (isdone) {
          done();
        }
      });
      isdone = true;
    });
  });

  describe('.blobToArrayBuffer', function() {
    it('should convert a blob to an arraybuffer', function(done) {
      var blob = new Blob(['hi']);
      util.blobToArrayBuffer(blob, function(result) {
        expect(result.byteLength).to.be.equal(2);
        expect(result.slice).to.be.a('function');
        expect(result instanceof ArrayBuffer).to.be.equal(true);
        done();
      });
    });
  });

  describe('blobToBinaryString', function() {
    it('should convert a blob to a binary string', function(done) {
      var blob = new Blob(['hi']);
      util.blobToBinaryString(blob, function(result) {
        expect(result).to.equal('hi');
        done();
      });
    });
  });

  describe('.binaryStringToArrayBuffer', function() {
    it('should convert a binary string to an arraybuffer', function() {
      var ba = util.binaryStringToArrayBuffer('\0\0');
      expect(ba.byteLength).to.be.equal(2);
      expect(ba.slice).to.be.a('function');
      expect(ba instanceof ArrayBuffer).to.be.equal(true);
    });
  });

  describe('.randomToken', function() {
    it('should return a random string', function() {
      testRandom(util.randomToken);
    });
  });

});
