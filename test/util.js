describe('util', function() {

  it('inherits', function() {

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
    var i = 0
      , ports = {};
    while(i < 25) {
      var p = util.randomPort();
      if (ports[p]) throw new Error('randomPort not so random')
      ports[p] = 1;
      i++;
    }
  })

  it('log')
  it('setZeroTimeout')
  it('blobToArrayBuffer')
  it('blobToBinaryString')
  it('binaryStringToArrayBuffer')
  it('randomToken')

});