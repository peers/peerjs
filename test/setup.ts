import './faker';
import { util } from '../src/peer/util';

//enable support for WebRTC
util.supports.audioVideo = true;
util.randomToken = () => 'testToken';
