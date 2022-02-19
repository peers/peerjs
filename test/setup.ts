import './faker';
import { Utils } from '../lib';

//enable support for WebRTC
// @ts-ignore
Utils.supports.audioVideo = true;

Utils.randomToken = () => 'testToken';
