import { Utils } from '../lib';

import fetch from 'node-fetch';
import * as WebRTC from 'wrtc';

export const polyfills = { fetch, WebRTC };

Utils.randomToken = () => 'testToken';
