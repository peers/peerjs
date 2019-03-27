import "./faker";
import { util } from '../lib/util';

//enable support for WebRTC
util.supports.audioVideo = true;
util.randomToken = () => 'testToken';
