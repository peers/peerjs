import './setup';
import { expect } from 'chai';
import { Utils } from '../lib';

describe('util', function () {
  describe('#chunkedMTU', function () {
    it('should be 16300', function () {
      expect(Utils.chunkedMTU).to.eq(16300);
    });
  });
});
