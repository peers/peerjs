var defaultConfig = {'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }]};
var util = {
  noop: function() {},

  CLOUD_HOST: '0.peerjs.com',
  CLOUD_PORT: 9000,
  
  // Logging logic
  logLevel: 0,
  setLogLevel: function(level) {
    var debugLevel = parseInt(level, 10);
    if (!isNaN(parseInt(level, 10))) {
      util.logLevel = debugLevel;
    } else {
      // If they are using truthy/falsy values for debug
      util.logLevel = (!!level) ? 3 : 0;
    }
    util.log = util.warn = util.error = util.noop;
    if (util.logLevel > 0) {
      util.error = util._printWith('ERROR');
    }
    if (util.logLevel > 1) {
      util.warn = util._printWith('WARNING');
    }
    if (util.logLevel > 2) {
      util.log = util._print;
    }
  },
  setLogFunction: function(fn) {
    if (fn.constructor !== Function) {
      util.warn('The log function you passed in is not a function. Defaulting to regular logs.');
    } else {
      util._print = fn;
    }
  },

  _printWith: function(prefix) {
    return function() {
      var copy = Array.prototype.slice.call(arguments);
      copy.unshift(prefix);
      util._print.apply(util, copy);
    };
  },
  _print: function () {
    var err = false;
    var copy = Array.prototype.slice.call(arguments);
    copy.unshift('PeerJS: ');
    for (var i = 0, l = copy.length; i < l; i++){
      if (copy[i] instanceof Error) {
        copy[i] = '(' + copy[i].name + ') ' + copy[i].message;
        err = true;
      }
    }
    err ? console.error.apply(console, copy) : console.log.apply(console, copy);  
  },
  //

  // Returns browser-agnostic default config
  defaultConfig: defaultConfig,
  //

  // Lists which features are supported
  // Temporarily set everything to true
  supports: (function() {
    var data = true;
    var audioVideo = true;

    var pc, dc;
    try {
      pc = new RTCPeerConnection(defaultConfig, {optional: [{RtpDataChannels: true}]});
    } catch (e) {
      data = false;
      audioVideo = false;
    }

    if (data) {
      try {
        dc = pc.createDataChannel('_PEERJSDATATEST');
      } catch (e) {
        data = false;
      }
    }
    // FIXME: not really the best check...
    if (audioVideo) {
      audioVideo = !!pc.addStream;
    }

    pc.close();
    dc.close();

    return {
      audioVideo: audioVideo,
      data: data,
      binary: data && (function() {
        var pc = new RTCPeerConnection(defaultConfig, {optional: [{RtpDataChannels: true}]});
        var dc = pc.createDataChannel('_PEERJSBINARYTEST');

        try {
          dc.binaryType = 'blob';
        } catch (e) {
          pc.close();
          if (e.name === 'NotSupportedError') {
            return false
          }
        }
        pc.close();
        dc.close();

        return true;
      })(),

      reliable: data && (function() {
        // Reliable (not RTP).
        var pc = new RTCPeerConnection(defaultConfig, {});
        var dc;
        try {
          dc = pc.createDataChannel('_PEERJSRELIABLETEST');
        } catch (e) {
          pc.close();
          if (e.name === 'NotSupportedError') {
            return false
          }
        }
        pc.close();
        dc.close();

        return true;
      })(),

      onnegotiationneeded: (data || audioVideo) && (function() {
        var pc = new RTCPeerConnection(defaultConfig, {});
        // sync default check.
        var called = false;
        var pc = new RTCPeerConnection(defaultConfig, {optional: [{RtpDataChannels: true}]});
        pc.onnegotiationneeded = function() {
          called = true;
          // async check.
          if (util && util.supports) {
            util.supports.onnegotiationneeded = true;
          }
        };
        // FIXME: this is not great because in theory it doesn't work for
        // av-only browsers (?).
        var dc = pc.createDataChannel('_PEERJSRELIABLETEST');

        pc.close();
        dc.close();

        return called;
      })(),

      // TODO(michelle): whether this browser can interop with a different
      // browser. But the two browsers both have to support interop.
      interop: false
    };
  }()),
  //

  // Ensure alphanumeric ids
  validateId: function(id) {
    // Allow empty ids
    return !id || /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(id);
  },

  validateKey: function(key) {
    // Allow empty keys
    return !key || /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.exec(key);
  },


  // OLD
  chromeCompatible: true,
  firefoxCompatible: true,
  chromeVersion: 26,
  firefoxVersion: 22,

  debug: false,
  browserisms: '',

  inherits: function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  },
  extend: function(dest, source) {
    for(var key in source) {
      if(source.hasOwnProperty(key)) {
        dest[key] = source[key];
      }
    }
    return dest;
  },
  pack: BinaryPack.pack,
  unpack: BinaryPack.unpack,

  log: function () {
    if (util.debug) {
      var err = false;
      var copy = Array.prototype.slice.call(arguments);
      copy.unshift('PeerJS: ');
      for (var i = 0, l = copy.length; i < l; i++){
        if (copy[i] instanceof Error) {
          copy[i] = '(' + copy[i].name + ') ' + copy[i].message;
          err = true;
        }
      }
      err ? console.error.apply(console, copy) : console.log.apply(console, copy);
    }
  },

  setZeroTimeout: (function(global) {
    var timeouts = [];
    var messageName = 'zero-timeout-message';

    // Like setTimeout, but only takes a function argument.	 There's
    // no time argument (always zero) and no arguments (you have to
    // use a closure).
    function setZeroTimeoutPostMessage(fn) {
      timeouts.push(fn);
      global.postMessage(messageName, '*');
    }

    function handleMessage(event) {
      if (event.source == global && event.data == messageName) {
        if (event.stopPropagation) {
          event.stopPropagation();
        }
        if (timeouts.length) {
          timeouts.shift()();
        }
      }
    }
    if (global.addEventListener) {
      global.addEventListener('message', handleMessage, true);
    } else if (global.attachEvent) {
      global.attachEvent('onmessage', handleMessage);
    }
    return setZeroTimeoutPostMessage;
  }(this)),

  // Binary stuff
  blobToArrayBuffer: function(blob, cb){
    var fr = new FileReader();
    fr.onload = function(evt) {
      cb(evt.target.result);
    };
    fr.readAsArrayBuffer(blob);
  },
  blobToBinaryString: function(blob, cb){
    var fr = new FileReader();
    fr.onload = function(evt) {
      cb(evt.target.result);
    };
    fr.readAsBinaryString(blob);
  },
  binaryStringToArrayBuffer: function(binary) {
    var byteArray = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      byteArray[i] = binary.charCodeAt(i) & 0xff;
    }
    return byteArray.buffer;
  },
  randomToken: function () {
    return Math.random().toString(36).substr(2);
  },
  //

  // When we have proper version/feature mappings we can remove this
  isBrowserCompatible: function() {
    var c, f;
    if (this.chromeCompatible) {
      if ((c = navigator.userAgent.split('Chrome/')) && c.length > 1) {
        // Get version #.
        var v = c[1].split('.')[0];
        return parseInt(v) >= this.chromeVersion;
      }
    }
    if (this.firefoxCompatible) {
      if ((f = navigator.userAgent.split('Firefox/')) && f.length > 1) {
        // Get version #.
        var v = f[1].split('.')[0];
        return parseInt(v) >= this.firefoxVersion;
      }
    }
    return false;
  },

  isSecure: function() {
    return location.protocol === 'https:';
  }
};

exports.util = util;
