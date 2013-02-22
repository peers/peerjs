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

  it('inherits', function() {
    function ctor() {}
    function superCtor() {}
    superCtor.prototype.test = function() { return 5; }
    util.inherits(ctor, superCtor);
    expect(new ctor()).to.be.a(superCtor);
    expect(new ctor().test()).to.be.equal(5);
  })

  /*
   *  extend overwrites keys if already exists
   *  leaves existing keys alone otherwise
   */
  it('extend', function() {
    var a = {a: 1, b: 2, c: 3, d: 4}
      , b = {d: 2};
    util.extend(b, a);
    expect(b).to.eql(a);
    expect(b.d).to.be.equal(4);
    b = {z: 2};
    util.extend(b, a);
    expect(b.z).to.be.equal(2);
  })

  it('pack', function() {
    expect(util.pack).to.be.equal(BinaryPack.pack);
  })

  it('unpack', function() {
    expect(util.unpack).to.be.equal(BinaryPack.unpack);
  })

  it('randomPort', function() {
    testRandom(util.randomPort);
  })

  it('log', function() {
    var called = false
      , consolelog = console.log;
    // default is false
    expect(util.debug).to.be.equal(false);
    util.debug = true;
    console.log = function() {
      var arg = Array.prototype.slice.call(arguments);
      called = true;
      expect(arg.join(' ')).to.be.equal('PeerJS:  hi');
    }
    util.log('hi');
    expect(called).to.be.equal(true);
    // reset
    console.log = consolelog;
    util.debug = false;
  })

  it('setZeroTimeout')
  it('blobToArrayBuffer')
  it('blobToBinaryString')
  it('binaryStringToArrayBuffer')

  it('randomToken', function() {
    testRandom(util.randomToken);
  })

});