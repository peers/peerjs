import './setup';
import { expect } from 'chai';
import { util } from '../src/peer/util';

describe('util', function () {
  describe('#chunkedMTU', function () {
    it('should be 16300', function () {
      expect(util.chunkedMTU).to.eq(16300);
    });
  });
});
