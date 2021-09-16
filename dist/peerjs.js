(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["peerjs"] = factory();
	else
		root["peerjs"] = factory();
})(self, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/eventemitter3/index.js":
/*!*********************************************!*\
  !*** ./node_modules/eventemitter3/index.js ***!
  \*********************************************/
/***/ ((module) => {

"use strict";


var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  var listener = new EE(fn, context || emitter, once)
    , evt = prefix ? prefix + event : event;

  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [emitter._events[evt], listener];

  return emitter;
}

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new Events();
  else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  var evt = prefix ? prefix + event : event
    , handlers = this._events[evt];

  if (!handlers) return [];
  if (handlers.fn) return [handlers.fn];

  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
    ee[i] = handlers[i].fn;
  }

  return ee;
};

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = prefix ? prefix + event : event
    , listeners = this._events[evt];

  if (!listeners) return 0;
  if (listeners.fn) return 1;
  return listeners.length;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    clearEvent(this, evt);
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
      listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
    ) {
      clearEvent(this, evt);
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else clearEvent(this, evt);
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) clearEvent(this, evt);
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if (true) {
  module.exports = EventEmitter;
}


/***/ }),

/***/ "./node_modules/peerjs-js-binarypack/lib/binarypack.js":
/*!*************************************************************!*\
  !*** ./node_modules/peerjs-js-binarypack/lib/binarypack.js ***!
  \*************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var BufferBuilder = __webpack_require__(/*! ./bufferbuilder */ "./node_modules/peerjs-js-binarypack/lib/bufferbuilder.js").BufferBuilder;
var binaryFeatures = __webpack_require__(/*! ./bufferbuilder */ "./node_modules/peerjs-js-binarypack/lib/bufferbuilder.js").binaryFeatures;

var BinaryPack = {
  unpack: function (data) {
    var unpacker = new Unpacker(data);
    return unpacker.unpack();
  },
  pack: function (data) {
    var packer = new Packer();
    packer.pack(data);
    var buffer = packer.getBuffer();
    return buffer;
  }
};

module.exports = BinaryPack;

function Unpacker (data) {
  // Data is ArrayBuffer
  this.index = 0;
  this.dataBuffer = data;
  this.dataView = new Uint8Array(this.dataBuffer);
  this.length = this.dataBuffer.byteLength;
}

Unpacker.prototype.unpack = function () {
  var type = this.unpack_uint8();
  if (type < 0x80) {
    return type;
  } else if ((type ^ 0xe0) < 0x20) {
    return (type ^ 0xe0) - 0x20;
  }

  var size;
  if ((size = type ^ 0xa0) <= 0x0f) {
    return this.unpack_raw(size);
  } else if ((size = type ^ 0xb0) <= 0x0f) {
    return this.unpack_string(size);
  } else if ((size = type ^ 0x90) <= 0x0f) {
    return this.unpack_array(size);
  } else if ((size = type ^ 0x80) <= 0x0f) {
    return this.unpack_map(size);
  }

  switch (type) {
    case 0xc0:
      return null;
    case 0xc1:
      return undefined;
    case 0xc2:
      return false;
    case 0xc3:
      return true;
    case 0xca:
      return this.unpack_float();
    case 0xcb:
      return this.unpack_double();
    case 0xcc:
      return this.unpack_uint8();
    case 0xcd:
      return this.unpack_uint16();
    case 0xce:
      return this.unpack_uint32();
    case 0xcf:
      return this.unpack_uint64();
    case 0xd0:
      return this.unpack_int8();
    case 0xd1:
      return this.unpack_int16();
    case 0xd2:
      return this.unpack_int32();
    case 0xd3:
      return this.unpack_int64();
    case 0xd4:
      return undefined;
    case 0xd5:
      return undefined;
    case 0xd6:
      return undefined;
    case 0xd7:
      return undefined;
    case 0xd8:
      size = this.unpack_uint16();
      return this.unpack_string(size);
    case 0xd9:
      size = this.unpack_uint32();
      return this.unpack_string(size);
    case 0xda:
      size = this.unpack_uint16();
      return this.unpack_raw(size);
    case 0xdb:
      size = this.unpack_uint32();
      return this.unpack_raw(size);
    case 0xdc:
      size = this.unpack_uint16();
      return this.unpack_array(size);
    case 0xdd:
      size = this.unpack_uint32();
      return this.unpack_array(size);
    case 0xde:
      size = this.unpack_uint16();
      return this.unpack_map(size);
    case 0xdf:
      size = this.unpack_uint32();
      return this.unpack_map(size);
  }
};

Unpacker.prototype.unpack_uint8 = function () {
  var byte = this.dataView[this.index] & 0xff;
  this.index++;
  return byte;
};

Unpacker.prototype.unpack_uint16 = function () {
  var bytes = this.read(2);
  var uint16 =
    ((bytes[0] & 0xff) * 256) + (bytes[1] & 0xff);
  this.index += 2;
  return uint16;
};

Unpacker.prototype.unpack_uint32 = function () {
  var bytes = this.read(4);
  var uint32 =
    ((bytes[0] * 256 +
      bytes[1]) * 256 +
      bytes[2]) * 256 +
    bytes[3];
  this.index += 4;
  return uint32;
};

Unpacker.prototype.unpack_uint64 = function () {
  var bytes = this.read(8);
  var uint64 =
    ((((((bytes[0] * 256 +
      bytes[1]) * 256 +
      bytes[2]) * 256 +
      bytes[3]) * 256 +
      bytes[4]) * 256 +
      bytes[5]) * 256 +
      bytes[6]) * 256 +
    bytes[7];
  this.index += 8;
  return uint64;
};

Unpacker.prototype.unpack_int8 = function () {
  var uint8 = this.unpack_uint8();
  return (uint8 < 0x80) ? uint8 : uint8 - (1 << 8);
};

Unpacker.prototype.unpack_int16 = function () {
  var uint16 = this.unpack_uint16();
  return (uint16 < 0x8000) ? uint16 : uint16 - (1 << 16);
};

Unpacker.prototype.unpack_int32 = function () {
  var uint32 = this.unpack_uint32();
  return (uint32 < Math.pow(2, 31)) ? uint32
    : uint32 - Math.pow(2, 32);
};

Unpacker.prototype.unpack_int64 = function () {
  var uint64 = this.unpack_uint64();
  return (uint64 < Math.pow(2, 63)) ? uint64
    : uint64 - Math.pow(2, 64);
};

Unpacker.prototype.unpack_raw = function (size) {
  if (this.length < this.index + size) {
    throw new Error('BinaryPackFailure: index is out of range' +
      ' ' + this.index + ' ' + size + ' ' + this.length);
  }
  var buf = this.dataBuffer.slice(this.index, this.index + size);
  this.index += size;

  // buf = util.bufferToString(buf);

  return buf;
};

Unpacker.prototype.unpack_string = function (size) {
  var bytes = this.read(size);
  var i = 0;
  var str = '';
  var c;
  var code;

  while (i < size) {
    c = bytes[i];
    if (c < 128) {
      str += String.fromCharCode(c);
      i++;
    } else if ((c ^ 0xc0) < 32) {
      code = ((c ^ 0xc0) << 6) | (bytes[i + 1] & 63);
      str += String.fromCharCode(code);
      i += 2;
    } else {
      code = ((c & 15) << 12) | ((bytes[i + 1] & 63) << 6) |
        (bytes[i + 2] & 63);
      str += String.fromCharCode(code);
      i += 3;
    }
  }

  this.index += size;
  return str;
};

Unpacker.prototype.unpack_array = function (size) {
  var objects = new Array(size);
  for (var i = 0; i < size; i++) {
    objects[i] = this.unpack();
  }
  return objects;
};

Unpacker.prototype.unpack_map = function (size) {
  var map = {};
  for (var i = 0; i < size; i++) {
    var key = this.unpack();
    var value = this.unpack();
    map[key] = value;
  }
  return map;
};

Unpacker.prototype.unpack_float = function () {
  var uint32 = this.unpack_uint32();
  var sign = uint32 >> 31;
  var exp = ((uint32 >> 23) & 0xff) - 127;
  var fraction = (uint32 & 0x7fffff) | 0x800000;
  return (sign === 0 ? 1 : -1) *
    fraction * Math.pow(2, exp - 23);
};

Unpacker.prototype.unpack_double = function () {
  var h32 = this.unpack_uint32();
  var l32 = this.unpack_uint32();
  var sign = h32 >> 31;
  var exp = ((h32 >> 20) & 0x7ff) - 1023;
  var hfrac = (h32 & 0xfffff) | 0x100000;
  var frac = hfrac * Math.pow(2, exp - 20) +
    l32 * Math.pow(2, exp - 52);
  return (sign === 0 ? 1 : -1) * frac;
};

Unpacker.prototype.read = function (length) {
  var j = this.index;
  if (j + length <= this.length) {
    return this.dataView.subarray(j, j + length);
  } else {
    throw new Error('BinaryPackFailure: read index out of range');
  }
};

function Packer () {
  this.bufferBuilder = new BufferBuilder();
}

Packer.prototype.getBuffer = function () {
  return this.bufferBuilder.getBuffer();
};

Packer.prototype.pack = function (value) {
  var type = typeof (value);
  if (type === 'string') {
    this.pack_string(value);
  } else if (type === 'number') {
    if (Math.floor(value) === value) {
      this.pack_integer(value);
    } else {
      this.pack_double(value);
    }
  } else if (type === 'boolean') {
    if (value === true) {
      this.bufferBuilder.append(0xc3);
    } else if (value === false) {
      this.bufferBuilder.append(0xc2);
    }
  } else if (type === 'undefined') {
    this.bufferBuilder.append(0xc0);
  } else if (type === 'object') {
    if (value === null) {
      this.bufferBuilder.append(0xc0);
    } else {
      var constructor = value.constructor;
      if (constructor == Array) {
        this.pack_array(value);
      } else if (constructor == Blob || constructor == File || value instanceof Blob || value instanceof File) {
        this.pack_bin(value);
      } else if (constructor == ArrayBuffer) {
        if (binaryFeatures.useArrayBufferView) {
          this.pack_bin(new Uint8Array(value));
        } else {
          this.pack_bin(value);
        }
      } else if ('BYTES_PER_ELEMENT' in value) {
        if (binaryFeatures.useArrayBufferView) {
          this.pack_bin(new Uint8Array(value.buffer));
        } else {
          this.pack_bin(value.buffer);
        }
      } else if ((constructor == Object) || (constructor.toString().startsWith('class'))) {
        this.pack_object(value);
      } else if (constructor == Date) {
        this.pack_string(value.toString());
      } else if (typeof value.toBinaryPack === 'function') {
        this.bufferBuilder.append(value.toBinaryPack());
      } else {
        throw new Error('Type "' + constructor.toString() + '" not yet supported');
      }
    }
  } else {
    throw new Error('Type "' + type + '" not yet supported');
  }
  this.bufferBuilder.flush();
};

Packer.prototype.pack_bin = function (blob) {
  var length = blob.length || blob.byteLength || blob.size;
  if (length <= 0x0f) {
    this.pack_uint8(0xa0 + length);
  } else if (length <= 0xffff) {
    this.bufferBuilder.append(0xda);
    this.pack_uint16(length);
  } else if (length <= 0xffffffff) {
    this.bufferBuilder.append(0xdb);
    this.pack_uint32(length);
  } else {
    throw new Error('Invalid length');
  }
  this.bufferBuilder.append(blob);
};

Packer.prototype.pack_string = function (str) {
  var length = utf8Length(str);

  if (length <= 0x0f) {
    this.pack_uint8(0xb0 + length);
  } else if (length <= 0xffff) {
    this.bufferBuilder.append(0xd8);
    this.pack_uint16(length);
  } else if (length <= 0xffffffff) {
    this.bufferBuilder.append(0xd9);
    this.pack_uint32(length);
  } else {
    throw new Error('Invalid length');
  }
  this.bufferBuilder.append(str);
};

Packer.prototype.pack_array = function (ary) {
  var length = ary.length;
  if (length <= 0x0f) {
    this.pack_uint8(0x90 + length);
  } else if (length <= 0xffff) {
    this.bufferBuilder.append(0xdc);
    this.pack_uint16(length);
  } else if (length <= 0xffffffff) {
    this.bufferBuilder.append(0xdd);
    this.pack_uint32(length);
  } else {
    throw new Error('Invalid length');
  }
  for (var i = 0; i < length; i++) {
    this.pack(ary[i]);
  }
};

Packer.prototype.pack_integer = function (num) {
  if (num >= -0x20 && num <= 0x7f) {
    this.bufferBuilder.append(num & 0xff);
  } else if (num >= 0x00 && num <= 0xff) {
    this.bufferBuilder.append(0xcc);
    this.pack_uint8(num);
  } else if (num >= -0x80 && num <= 0x7f) {
    this.bufferBuilder.append(0xd0);
    this.pack_int8(num);
  } else if (num >= 0x0000 && num <= 0xffff) {
    this.bufferBuilder.append(0xcd);
    this.pack_uint16(num);
  } else if (num >= -0x8000 && num <= 0x7fff) {
    this.bufferBuilder.append(0xd1);
    this.pack_int16(num);
  } else if (num >= 0x00000000 && num <= 0xffffffff) {
    this.bufferBuilder.append(0xce);
    this.pack_uint32(num);
  } else if (num >= -0x80000000 && num <= 0x7fffffff) {
    this.bufferBuilder.append(0xd2);
    this.pack_int32(num);
  } else if (num >= -0x8000000000000000 && num <= 0x7FFFFFFFFFFFFFFF) {
    this.bufferBuilder.append(0xd3);
    this.pack_int64(num);
  } else if (num >= 0x0000000000000000 && num <= 0xFFFFFFFFFFFFFFFF) {
    this.bufferBuilder.append(0xcf);
    this.pack_uint64(num);
  } else {
    throw new Error('Invalid integer');
  }
};

Packer.prototype.pack_double = function (num) {
  var sign = 0;
  if (num < 0) {
    sign = 1;
    num = -num;
  }
  var exp = Math.floor(Math.log(num) / Math.LN2);
  var frac0 = num / Math.pow(2, exp) - 1;
  var frac1 = Math.floor(frac0 * Math.pow(2, 52));
  var b32 = Math.pow(2, 32);
  var h32 = (sign << 31) | ((exp + 1023) << 20) |
    (frac1 / b32) & 0x0fffff;
  var l32 = frac1 % b32;
  this.bufferBuilder.append(0xcb);
  this.pack_int32(h32);
  this.pack_int32(l32);
};

Packer.prototype.pack_object = function (obj) {
  var keys = Object.keys(obj);
  var length = keys.length;
  if (length <= 0x0f) {
    this.pack_uint8(0x80 + length);
  } else if (length <= 0xffff) {
    this.bufferBuilder.append(0xde);
    this.pack_uint16(length);
  } else if (length <= 0xffffffff) {
    this.bufferBuilder.append(0xdf);
    this.pack_uint32(length);
  } else {
    throw new Error('Invalid length');
  }
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      this.pack(prop);
      this.pack(obj[prop]);
    }
  }
};

Packer.prototype.pack_uint8 = function (num) {
  this.bufferBuilder.append(num);
};

Packer.prototype.pack_uint16 = function (num) {
  this.bufferBuilder.append(num >> 8);
  this.bufferBuilder.append(num & 0xff);
};

Packer.prototype.pack_uint32 = function (num) {
  var n = num & 0xffffffff;
  this.bufferBuilder.append((n & 0xff000000) >>> 24);
  this.bufferBuilder.append((n & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((n & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((n & 0x000000ff));
};

Packer.prototype.pack_uint64 = function (num) {
  var high = num / Math.pow(2, 32);
  var low = num % Math.pow(2, 32);
  this.bufferBuilder.append((high & 0xff000000) >>> 24);
  this.bufferBuilder.append((high & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((high & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((high & 0x000000ff));
  this.bufferBuilder.append((low & 0xff000000) >>> 24);
  this.bufferBuilder.append((low & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((low & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((low & 0x000000ff));
};

Packer.prototype.pack_int8 = function (num) {
  this.bufferBuilder.append(num & 0xff);
};

Packer.prototype.pack_int16 = function (num) {
  this.bufferBuilder.append((num & 0xff00) >> 8);
  this.bufferBuilder.append(num & 0xff);
};

Packer.prototype.pack_int32 = function (num) {
  this.bufferBuilder.append((num >>> 24) & 0xff);
  this.bufferBuilder.append((num & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((num & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((num & 0x000000ff));
};

Packer.prototype.pack_int64 = function (num) {
  var high = Math.floor(num / Math.pow(2, 32));
  var low = num % Math.pow(2, 32);
  this.bufferBuilder.append((high & 0xff000000) >>> 24);
  this.bufferBuilder.append((high & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((high & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((high & 0x000000ff));
  this.bufferBuilder.append((low & 0xff000000) >>> 24);
  this.bufferBuilder.append((low & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((low & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((low & 0x000000ff));
};

function _utf8Replace (m) {
  var code = m.charCodeAt(0);

  if (code <= 0x7ff) return '00';
  if (code <= 0xffff) return '000';
  if (code <= 0x1fffff) return '0000';
  if (code <= 0x3ffffff) return '00000';
  return '000000';
}

function utf8Length (str) {
  if (str.length > 600) {
    // Blob method faster for large strings
    return (new Blob([str])).size;
  } else {
    return str.replace(/[^\u0000-\u007F]/g, _utf8Replace).length;
  }
}


/***/ }),

/***/ "./node_modules/peerjs-js-binarypack/lib/bufferbuilder.js":
/*!****************************************************************!*\
  !*** ./node_modules/peerjs-js-binarypack/lib/bufferbuilder.js ***!
  \****************************************************************/
/***/ ((module) => {

var binaryFeatures = {};
binaryFeatures.useBlobBuilder = (function () {
  try {
    new Blob([]);
    return false;
  } catch (e) {
    return true;
  }
})();

binaryFeatures.useArrayBufferView = !binaryFeatures.useBlobBuilder && (function () {
  try {
    return (new Blob([new Uint8Array([])])).size === 0;
  } catch (e) {
    return true;
  }
})();

module.exports.binaryFeatures = binaryFeatures;
var BlobBuilder = module.exports.BlobBuilder;
if (typeof window !== 'undefined') {
  BlobBuilder = module.exports.BlobBuilder = window.WebKitBlobBuilder ||
    window.MozBlobBuilder || window.MSBlobBuilder || window.BlobBuilder;
}

function BufferBuilder () {
  this._pieces = [];
  this._parts = [];
}

BufferBuilder.prototype.append = function (data) {
  if (typeof data === 'number') {
    this._pieces.push(data);
  } else {
    this.flush();
    this._parts.push(data);
  }
};

BufferBuilder.prototype.flush = function () {
  if (this._pieces.length > 0) {
    var buf = new Uint8Array(this._pieces);
    if (!binaryFeatures.useArrayBufferView) {
      buf = buf.buffer;
    }
    this._parts.push(buf);
    this._pieces = [];
  }
};

BufferBuilder.prototype.getBuffer = function () {
  this.flush();
  if (binaryFeatures.useBlobBuilder) {
    var builder = new BlobBuilder();
    for (var i = 0, ii = this._parts.length; i < ii; i++) {
      builder.append(this._parts[i]);
    }
    return builder.getBlob();
  } else {
    return new Blob(this._parts);
  }
};

module.exports.BufferBuilder = BufferBuilder;


/***/ }),

/***/ "./node_modules/rtcpeerconnection-shim/rtcpeerconnection.js":
/*!******************************************************************!*\
  !*** ./node_modules/rtcpeerconnection-shim/rtcpeerconnection.js ***!
  \******************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */


var SDPUtils = __webpack_require__(/*! sdp */ "./node_modules/sdp/sdp.js");

function fixStatsType(stat) {
  return {
    inboundrtp: 'inbound-rtp',
    outboundrtp: 'outbound-rtp',
    candidatepair: 'candidate-pair',
    localcandidate: 'local-candidate',
    remotecandidate: 'remote-candidate'
  }[stat.type] || stat.type;
}

function writeMediaSection(transceiver, caps, type, stream, dtlsRole) {
  var sdp = SDPUtils.writeRtpDescription(transceiver.kind, caps);

  // Map ICE parameters (ufrag, pwd) to SDP.
  sdp += SDPUtils.writeIceParameters(
      transceiver.iceGatherer.getLocalParameters());

  // Map DTLS parameters to SDP.
  sdp += SDPUtils.writeDtlsParameters(
      transceiver.dtlsTransport.getLocalParameters(),
      type === 'offer' ? 'actpass' : dtlsRole || 'active');

  sdp += 'a=mid:' + transceiver.mid + '\r\n';

  if (transceiver.rtpSender && transceiver.rtpReceiver) {
    sdp += 'a=sendrecv\r\n';
  } else if (transceiver.rtpSender) {
    sdp += 'a=sendonly\r\n';
  } else if (transceiver.rtpReceiver) {
    sdp += 'a=recvonly\r\n';
  } else {
    sdp += 'a=inactive\r\n';
  }

  if (transceiver.rtpSender) {
    var trackId = transceiver.rtpSender._initialTrackId ||
        transceiver.rtpSender.track.id;
    transceiver.rtpSender._initialTrackId = trackId;
    // spec.
    var msid = 'msid:' + (stream ? stream.id : '-') + ' ' +
        trackId + '\r\n';
    sdp += 'a=' + msid;
    // for Chrome. Legacy should no longer be required.
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
        ' ' + msid;

    // RTX
    if (transceiver.sendEncodingParameters[0].rtx) {
      sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
          ' ' + msid;
      sdp += 'a=ssrc-group:FID ' +
          transceiver.sendEncodingParameters[0].ssrc + ' ' +
          transceiver.sendEncodingParameters[0].rtx.ssrc +
          '\r\n';
    }
  }
  // FIXME: this should be written by writeRtpDescription.
  sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
      ' cname:' + SDPUtils.localCName + '\r\n';
  if (transceiver.rtpSender && transceiver.sendEncodingParameters[0].rtx) {
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
        ' cname:' + SDPUtils.localCName + '\r\n';
  }
  return sdp;
}

// Edge does not like
// 1) stun: filtered after 14393 unless ?transport=udp is present
// 2) turn: that does not have all of turn:host:port?transport=udp
// 3) turn: with ipv6 addresses
// 4) turn: occurring muliple times
function filterIceServers(iceServers, edgeVersion) {
  var hasTurn = false;
  iceServers = JSON.parse(JSON.stringify(iceServers));
  return iceServers.filter(function(server) {
    if (server && (server.urls || server.url)) {
      var urls = server.urls || server.url;
      if (server.url && !server.urls) {
        console.warn('RTCIceServer.url is deprecated! Use urls instead.');
      }
      var isString = typeof urls === 'string';
      if (isString) {
        urls = [urls];
      }
      urls = urls.filter(function(url) {
        var validTurn = url.indexOf('turn:') === 0 &&
            url.indexOf('transport=udp') !== -1 &&
            url.indexOf('turn:[') === -1 &&
            !hasTurn;

        if (validTurn) {
          hasTurn = true;
          return true;
        }
        return url.indexOf('stun:') === 0 && edgeVersion >= 14393 &&
            url.indexOf('?transport=udp') === -1;
      });

      delete server.url;
      server.urls = isString ? urls[0] : urls;
      return !!urls.length;
    }
  });
}

// Determines the intersection of local and remote capabilities.
function getCommonCapabilities(localCapabilities, remoteCapabilities) {
  var commonCapabilities = {
    codecs: [],
    headerExtensions: [],
    fecMechanisms: []
  };

  var findCodecByPayloadType = function(pt, codecs) {
    pt = parseInt(pt, 10);
    for (var i = 0; i < codecs.length; i++) {
      if (codecs[i].payloadType === pt ||
          codecs[i].preferredPayloadType === pt) {
        return codecs[i];
      }
    }
  };

  var rtxCapabilityMatches = function(lRtx, rRtx, lCodecs, rCodecs) {
    var lCodec = findCodecByPayloadType(lRtx.parameters.apt, lCodecs);
    var rCodec = findCodecByPayloadType(rRtx.parameters.apt, rCodecs);
    return lCodec && rCodec &&
        lCodec.name.toLowerCase() === rCodec.name.toLowerCase();
  };

  localCapabilities.codecs.forEach(function(lCodec) {
    for (var i = 0; i < remoteCapabilities.codecs.length; i++) {
      var rCodec = remoteCapabilities.codecs[i];
      if (lCodec.name.toLowerCase() === rCodec.name.toLowerCase() &&
          lCodec.clockRate === rCodec.clockRate) {
        if (lCodec.name.toLowerCase() === 'rtx' &&
            lCodec.parameters && rCodec.parameters.apt) {
          // for RTX we need to find the local rtx that has a apt
          // which points to the same local codec as the remote one.
          if (!rtxCapabilityMatches(lCodec, rCodec,
              localCapabilities.codecs, remoteCapabilities.codecs)) {
            continue;
          }
        }
        rCodec = JSON.parse(JSON.stringify(rCodec)); // deepcopy
        // number of channels is the highest common number of channels
        rCodec.numChannels = Math.min(lCodec.numChannels,
            rCodec.numChannels);
        // push rCodec so we reply with offerer payload type
        commonCapabilities.codecs.push(rCodec);

        // determine common feedback mechanisms
        rCodec.rtcpFeedback = rCodec.rtcpFeedback.filter(function(fb) {
          for (var j = 0; j < lCodec.rtcpFeedback.length; j++) {
            if (lCodec.rtcpFeedback[j].type === fb.type &&
                lCodec.rtcpFeedback[j].parameter === fb.parameter) {
              return true;
            }
          }
          return false;
        });
        // FIXME: also need to determine .parameters
        //  see https://github.com/openpeer/ortc/issues/569
        break;
      }
    }
  });

  localCapabilities.headerExtensions.forEach(function(lHeaderExtension) {
    for (var i = 0; i < remoteCapabilities.headerExtensions.length;
         i++) {
      var rHeaderExtension = remoteCapabilities.headerExtensions[i];
      if (lHeaderExtension.uri === rHeaderExtension.uri) {
        commonCapabilities.headerExtensions.push(rHeaderExtension);
        break;
      }
    }
  });

  // FIXME: fecMechanisms
  return commonCapabilities;
}

// is action=setLocalDescription with type allowed in signalingState
function isActionAllowedInSignalingState(action, type, signalingState) {
  return {
    offer: {
      setLocalDescription: ['stable', 'have-local-offer'],
      setRemoteDescription: ['stable', 'have-remote-offer']
    },
    answer: {
      setLocalDescription: ['have-remote-offer', 'have-local-pranswer'],
      setRemoteDescription: ['have-local-offer', 'have-remote-pranswer']
    }
  }[type][action].indexOf(signalingState) !== -1;
}

function maybeAddCandidate(iceTransport, candidate) {
  // Edge's internal representation adds some fields therefore
  // not all fieldѕ are taken into account.
  var alreadyAdded = iceTransport.getRemoteCandidates()
      .find(function(remoteCandidate) {
        return candidate.foundation === remoteCandidate.foundation &&
            candidate.ip === remoteCandidate.ip &&
            candidate.port === remoteCandidate.port &&
            candidate.priority === remoteCandidate.priority &&
            candidate.protocol === remoteCandidate.protocol &&
            candidate.type === remoteCandidate.type;
      });
  if (!alreadyAdded) {
    iceTransport.addRemoteCandidate(candidate);
  }
  return !alreadyAdded;
}


function makeError(name, description) {
  var e = new Error(description);
  e.name = name;
  // legacy error codes from https://heycam.github.io/webidl/#idl-DOMException-error-names
  e.code = {
    NotSupportedError: 9,
    InvalidStateError: 11,
    InvalidAccessError: 15,
    TypeError: undefined,
    OperationError: undefined
  }[name];
  return e;
}

module.exports = function(window, edgeVersion) {
  // https://w3c.github.io/mediacapture-main/#mediastream
  // Helper function to add the track to the stream and
  // dispatch the event ourselves.
  function addTrackToStreamAndFireEvent(track, stream) {
    stream.addTrack(track);
    stream.dispatchEvent(new window.MediaStreamTrackEvent('addtrack',
        {track: track}));
  }

  function removeTrackFromStreamAndFireEvent(track, stream) {
    stream.removeTrack(track);
    stream.dispatchEvent(new window.MediaStreamTrackEvent('removetrack',
        {track: track}));
  }

  function fireAddTrack(pc, track, receiver, streams) {
    var trackEvent = new Event('track');
    trackEvent.track = track;
    trackEvent.receiver = receiver;
    trackEvent.transceiver = {receiver: receiver};
    trackEvent.streams = streams;
    window.setTimeout(function() {
      pc._dispatchEvent('track', trackEvent);
    });
  }

  var RTCPeerConnection = function(config) {
    var pc = this;

    var _eventTarget = document.createDocumentFragment();
    ['addEventListener', 'removeEventListener', 'dispatchEvent']
        .forEach(function(method) {
          pc[method] = _eventTarget[method].bind(_eventTarget);
        });

    this.canTrickleIceCandidates = null;

    this.needNegotiation = false;

    this.localStreams = [];
    this.remoteStreams = [];

    this._localDescription = null;
    this._remoteDescription = null;

    this.signalingState = 'stable';
    this.iceConnectionState = 'new';
    this.connectionState = 'new';
    this.iceGatheringState = 'new';

    config = JSON.parse(JSON.stringify(config || {}));

    this.usingBundle = config.bundlePolicy === 'max-bundle';
    if (config.rtcpMuxPolicy === 'negotiate') {
      throw(makeError('NotSupportedError',
          'rtcpMuxPolicy \'negotiate\' is not supported'));
    } else if (!config.rtcpMuxPolicy) {
      config.rtcpMuxPolicy = 'require';
    }

    switch (config.iceTransportPolicy) {
      case 'all':
      case 'relay':
        break;
      default:
        config.iceTransportPolicy = 'all';
        break;
    }

    switch (config.bundlePolicy) {
      case 'balanced':
      case 'max-compat':
      case 'max-bundle':
        break;
      default:
        config.bundlePolicy = 'balanced';
        break;
    }

    config.iceServers = filterIceServers(config.iceServers || [], edgeVersion);

    this._iceGatherers = [];
    if (config.iceCandidatePoolSize) {
      for (var i = config.iceCandidatePoolSize; i > 0; i--) {
        this._iceGatherers.push(new window.RTCIceGatherer({
          iceServers: config.iceServers,
          gatherPolicy: config.iceTransportPolicy
        }));
      }
    } else {
      config.iceCandidatePoolSize = 0;
    }

    this._config = config;

    // per-track iceGathers, iceTransports, dtlsTransports, rtpSenders, ...
    // everything that is needed to describe a SDP m-line.
    this.transceivers = [];

    this._sdpSessionId = SDPUtils.generateSessionId();
    this._sdpSessionVersion = 0;

    this._dtlsRole = undefined; // role for a=setup to use in answers.

    this._isClosed = false;
  };

  Object.defineProperty(RTCPeerConnection.prototype, 'localDescription', {
    configurable: true,
    get: function() {
      return this._localDescription;
    }
  });
  Object.defineProperty(RTCPeerConnection.prototype, 'remoteDescription', {
    configurable: true,
    get: function() {
      return this._remoteDescription;
    }
  });

  // set up event handlers on prototype
  RTCPeerConnection.prototype.onicecandidate = null;
  RTCPeerConnection.prototype.onaddstream = null;
  RTCPeerConnection.prototype.ontrack = null;
  RTCPeerConnection.prototype.onremovestream = null;
  RTCPeerConnection.prototype.onsignalingstatechange = null;
  RTCPeerConnection.prototype.oniceconnectionstatechange = null;
  RTCPeerConnection.prototype.onconnectionstatechange = null;
  RTCPeerConnection.prototype.onicegatheringstatechange = null;
  RTCPeerConnection.prototype.onnegotiationneeded = null;
  RTCPeerConnection.prototype.ondatachannel = null;

  RTCPeerConnection.prototype._dispatchEvent = function(name, event) {
    if (this._isClosed) {
      return;
    }
    this.dispatchEvent(event);
    if (typeof this['on' + name] === 'function') {
      this['on' + name](event);
    }
  };

  RTCPeerConnection.prototype._emitGatheringStateChange = function() {
    var event = new Event('icegatheringstatechange');
    this._dispatchEvent('icegatheringstatechange', event);
  };

  RTCPeerConnection.prototype.getConfiguration = function() {
    return this._config;
  };

  RTCPeerConnection.prototype.getLocalStreams = function() {
    return this.localStreams;
  };

  RTCPeerConnection.prototype.getRemoteStreams = function() {
    return this.remoteStreams;
  };

  // internal helper to create a transceiver object.
  // (which is not yet the same as the WebRTC 1.0 transceiver)
  RTCPeerConnection.prototype._createTransceiver = function(kind, doNotAdd) {
    var hasBundleTransport = this.transceivers.length > 0;
    var transceiver = {
      track: null,
      iceGatherer: null,
      iceTransport: null,
      dtlsTransport: null,
      localCapabilities: null,
      remoteCapabilities: null,
      rtpSender: null,
      rtpReceiver: null,
      kind: kind,
      mid: null,
      sendEncodingParameters: null,
      recvEncodingParameters: null,
      stream: null,
      associatedRemoteMediaStreams: [],
      wantReceive: true
    };
    if (this.usingBundle && hasBundleTransport) {
      transceiver.iceTransport = this.transceivers[0].iceTransport;
      transceiver.dtlsTransport = this.transceivers[0].dtlsTransport;
    } else {
      var transports = this._createIceAndDtlsTransports();
      transceiver.iceTransport = transports.iceTransport;
      transceiver.dtlsTransport = transports.dtlsTransport;
    }
    if (!doNotAdd) {
      this.transceivers.push(transceiver);
    }
    return transceiver;
  };

  RTCPeerConnection.prototype.addTrack = function(track, stream) {
    if (this._isClosed) {
      throw makeError('InvalidStateError',
          'Attempted to call addTrack on a closed peerconnection.');
    }

    var alreadyExists = this.transceivers.find(function(s) {
      return s.track === track;
    });

    if (alreadyExists) {
      throw makeError('InvalidAccessError', 'Track already exists.');
    }

    var transceiver;
    for (var i = 0; i < this.transceivers.length; i++) {
      if (!this.transceivers[i].track &&
          this.transceivers[i].kind === track.kind) {
        transceiver = this.transceivers[i];
      }
    }
    if (!transceiver) {
      transceiver = this._createTransceiver(track.kind);
    }

    this._maybeFireNegotiationNeeded();

    if (this.localStreams.indexOf(stream) === -1) {
      this.localStreams.push(stream);
    }

    transceiver.track = track;
    transceiver.stream = stream;
    transceiver.rtpSender = new window.RTCRtpSender(track,
        transceiver.dtlsTransport);
    return transceiver.rtpSender;
  };

  RTCPeerConnection.prototype.addStream = function(stream) {
    var pc = this;
    if (edgeVersion >= 15025) {
      stream.getTracks().forEach(function(track) {
        pc.addTrack(track, stream);
      });
    } else {
      // Clone is necessary for local demos mostly, attaching directly
      // to two different senders does not work (build 10547).
      // Fixed in 15025 (or earlier)
      var clonedStream = stream.clone();
      stream.getTracks().forEach(function(track, idx) {
        var clonedTrack = clonedStream.getTracks()[idx];
        track.addEventListener('enabled', function(event) {
          clonedTrack.enabled = event.enabled;
        });
      });
      clonedStream.getTracks().forEach(function(track) {
        pc.addTrack(track, clonedStream);
      });
    }
  };

  RTCPeerConnection.prototype.removeTrack = function(sender) {
    if (this._isClosed) {
      throw makeError('InvalidStateError',
          'Attempted to call removeTrack on a closed peerconnection.');
    }

    if (!(sender instanceof window.RTCRtpSender)) {
      throw new TypeError('Argument 1 of RTCPeerConnection.removeTrack ' +
          'does not implement interface RTCRtpSender.');
    }

    var transceiver = this.transceivers.find(function(t) {
      return t.rtpSender === sender;
    });

    if (!transceiver) {
      throw makeError('InvalidAccessError',
          'Sender was not created by this connection.');
    }
    var stream = transceiver.stream;

    transceiver.rtpSender.stop();
    transceiver.rtpSender = null;
    transceiver.track = null;
    transceiver.stream = null;

    // remove the stream from the set of local streams
    var localStreams = this.transceivers.map(function(t) {
      return t.stream;
    });
    if (localStreams.indexOf(stream) === -1 &&
        this.localStreams.indexOf(stream) > -1) {
      this.localStreams.splice(this.localStreams.indexOf(stream), 1);
    }

    this._maybeFireNegotiationNeeded();
  };

  RTCPeerConnection.prototype.removeStream = function(stream) {
    var pc = this;
    stream.getTracks().forEach(function(track) {
      var sender = pc.getSenders().find(function(s) {
        return s.track === track;
      });
      if (sender) {
        pc.removeTrack(sender);
      }
    });
  };

  RTCPeerConnection.prototype.getSenders = function() {
    return this.transceivers.filter(function(transceiver) {
      return !!transceiver.rtpSender;
    })
    .map(function(transceiver) {
      return transceiver.rtpSender;
    });
  };

  RTCPeerConnection.prototype.getReceivers = function() {
    return this.transceivers.filter(function(transceiver) {
      return !!transceiver.rtpReceiver;
    })
    .map(function(transceiver) {
      return transceiver.rtpReceiver;
    });
  };


  RTCPeerConnection.prototype._createIceGatherer = function(sdpMLineIndex,
      usingBundle) {
    var pc = this;
    if (usingBundle && sdpMLineIndex > 0) {
      return this.transceivers[0].iceGatherer;
    } else if (this._iceGatherers.length) {
      return this._iceGatherers.shift();
    }
    var iceGatherer = new window.RTCIceGatherer({
      iceServers: this._config.iceServers,
      gatherPolicy: this._config.iceTransportPolicy
    });
    Object.defineProperty(iceGatherer, 'state',
        {value: 'new', writable: true}
    );

    this.transceivers[sdpMLineIndex].bufferedCandidateEvents = [];
    this.transceivers[sdpMLineIndex].bufferCandidates = function(event) {
      var end = !event.candidate || Object.keys(event.candidate).length === 0;
      // polyfill since RTCIceGatherer.state is not implemented in
      // Edge 10547 yet.
      iceGatherer.state = end ? 'completed' : 'gathering';
      if (pc.transceivers[sdpMLineIndex].bufferedCandidateEvents !== null) {
        pc.transceivers[sdpMLineIndex].bufferedCandidateEvents.push(event);
      }
    };
    iceGatherer.addEventListener('localcandidate',
      this.transceivers[sdpMLineIndex].bufferCandidates);
    return iceGatherer;
  };

  // start gathering from an RTCIceGatherer.
  RTCPeerConnection.prototype._gather = function(mid, sdpMLineIndex) {
    var pc = this;
    var iceGatherer = this.transceivers[sdpMLineIndex].iceGatherer;
    if (iceGatherer.onlocalcandidate) {
      return;
    }
    var bufferedCandidateEvents =
      this.transceivers[sdpMLineIndex].bufferedCandidateEvents;
    this.transceivers[sdpMLineIndex].bufferedCandidateEvents = null;
    iceGatherer.removeEventListener('localcandidate',
      this.transceivers[sdpMLineIndex].bufferCandidates);
    iceGatherer.onlocalcandidate = function(evt) {
      if (pc.usingBundle && sdpMLineIndex > 0) {
        // if we know that we use bundle we can drop candidates with
        // ѕdpMLineIndex > 0. If we don't do this then our state gets
        // confused since we dispose the extra ice gatherer.
        return;
      }
      var event = new Event('icecandidate');
      event.candidate = {sdpMid: mid, sdpMLineIndex: sdpMLineIndex};

      var cand = evt.candidate;
      // Edge emits an empty object for RTCIceCandidateComplete‥
      var end = !cand || Object.keys(cand).length === 0;
      if (end) {
        // polyfill since RTCIceGatherer.state is not implemented in
        // Edge 10547 yet.
        if (iceGatherer.state === 'new' || iceGatherer.state === 'gathering') {
          iceGatherer.state = 'completed';
        }
      } else {
        if (iceGatherer.state === 'new') {
          iceGatherer.state = 'gathering';
        }
        // RTCIceCandidate doesn't have a component, needs to be added
        cand.component = 1;
        // also the usernameFragment. TODO: update SDP to take both variants.
        cand.ufrag = iceGatherer.getLocalParameters().usernameFragment;

        var serializedCandidate = SDPUtils.writeCandidate(cand);
        event.candidate = Object.assign(event.candidate,
            SDPUtils.parseCandidate(serializedCandidate));

        event.candidate.candidate = serializedCandidate;
        event.candidate.toJSON = function() {
          return {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            usernameFragment: event.candidate.usernameFragment
          };
        };
      }

      // update local description.
      var sections = SDPUtils.getMediaSections(pc._localDescription.sdp);
      if (!end) {
        sections[event.candidate.sdpMLineIndex] +=
            'a=' + event.candidate.candidate + '\r\n';
      } else {
        sections[event.candidate.sdpMLineIndex] +=
            'a=end-of-candidates\r\n';
      }
      pc._localDescription.sdp =
          SDPUtils.getDescription(pc._localDescription.sdp) +
          sections.join('');
      var complete = pc.transceivers.every(function(transceiver) {
        return transceiver.iceGatherer &&
            transceiver.iceGatherer.state === 'completed';
      });

      if (pc.iceGatheringState !== 'gathering') {
        pc.iceGatheringState = 'gathering';
        pc._emitGatheringStateChange();
      }

      // Emit candidate. Also emit null candidate when all gatherers are
      // complete.
      if (!end) {
        pc._dispatchEvent('icecandidate', event);
      }
      if (complete) {
        pc._dispatchEvent('icecandidate', new Event('icecandidate'));
        pc.iceGatheringState = 'complete';
        pc._emitGatheringStateChange();
      }
    };

    // emit already gathered candidates.
    window.setTimeout(function() {
      bufferedCandidateEvents.forEach(function(e) {
        iceGatherer.onlocalcandidate(e);
      });
    }, 0);
  };

  // Create ICE transport and DTLS transport.
  RTCPeerConnection.prototype._createIceAndDtlsTransports = function() {
    var pc = this;
    var iceTransport = new window.RTCIceTransport(null);
    iceTransport.onicestatechange = function() {
      pc._updateIceConnectionState();
      pc._updateConnectionState();
    };

    var dtlsTransport = new window.RTCDtlsTransport(iceTransport);
    dtlsTransport.ondtlsstatechange = function() {
      pc._updateConnectionState();
    };
    dtlsTransport.onerror = function() {
      // onerror does not set state to failed by itself.
      Object.defineProperty(dtlsTransport, 'state',
          {value: 'failed', writable: true});
      pc._updateConnectionState();
    };

    return {
      iceTransport: iceTransport,
      dtlsTransport: dtlsTransport
    };
  };

  // Destroy ICE gatherer, ICE transport and DTLS transport.
  // Without triggering the callbacks.
  RTCPeerConnection.prototype._disposeIceAndDtlsTransports = function(
      sdpMLineIndex) {
    var iceGatherer = this.transceivers[sdpMLineIndex].iceGatherer;
    if (iceGatherer) {
      delete iceGatherer.onlocalcandidate;
      delete this.transceivers[sdpMLineIndex].iceGatherer;
    }
    var iceTransport = this.transceivers[sdpMLineIndex].iceTransport;
    if (iceTransport) {
      delete iceTransport.onicestatechange;
      delete this.transceivers[sdpMLineIndex].iceTransport;
    }
    var dtlsTransport = this.transceivers[sdpMLineIndex].dtlsTransport;
    if (dtlsTransport) {
      delete dtlsTransport.ondtlsstatechange;
      delete dtlsTransport.onerror;
      delete this.transceivers[sdpMLineIndex].dtlsTransport;
    }
  };

  // Start the RTP Sender and Receiver for a transceiver.
  RTCPeerConnection.prototype._transceive = function(transceiver,
      send, recv) {
    var params = getCommonCapabilities(transceiver.localCapabilities,
        transceiver.remoteCapabilities);
    if (send && transceiver.rtpSender) {
      params.encodings = transceiver.sendEncodingParameters;
      params.rtcp = {
        cname: SDPUtils.localCName,
        compound: transceiver.rtcpParameters.compound
      };
      if (transceiver.recvEncodingParameters.length) {
        params.rtcp.ssrc = transceiver.recvEncodingParameters[0].ssrc;
      }
      transceiver.rtpSender.send(params);
    }
    if (recv && transceiver.rtpReceiver && params.codecs.length > 0) {
      // remove RTX field in Edge 14942
      if (transceiver.kind === 'video'
          && transceiver.recvEncodingParameters
          && edgeVersion < 15019) {
        transceiver.recvEncodingParameters.forEach(function(p) {
          delete p.rtx;
        });
      }
      if (transceiver.recvEncodingParameters.length) {
        params.encodings = transceiver.recvEncodingParameters;
      } else {
        params.encodings = [{}];
      }
      params.rtcp = {
        compound: transceiver.rtcpParameters.compound
      };
      if (transceiver.rtcpParameters.cname) {
        params.rtcp.cname = transceiver.rtcpParameters.cname;
      }
      if (transceiver.sendEncodingParameters.length) {
        params.rtcp.ssrc = transceiver.sendEncodingParameters[0].ssrc;
      }
      transceiver.rtpReceiver.receive(params);
    }
  };

  RTCPeerConnection.prototype.setLocalDescription = function(description) {
    var pc = this;

    // Note: pranswer is not supported.
    if (['offer', 'answer'].indexOf(description.type) === -1) {
      return Promise.reject(makeError('TypeError',
          'Unsupported type "' + description.type + '"'));
    }

    if (!isActionAllowedInSignalingState('setLocalDescription',
        description.type, pc.signalingState) || pc._isClosed) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not set local ' + description.type +
          ' in state ' + pc.signalingState));
    }

    var sections;
    var sessionpart;
    if (description.type === 'offer') {
      // VERY limited support for SDP munging. Limited to:
      // * changing the order of codecs
      sections = SDPUtils.splitSections(description.sdp);
      sessionpart = sections.shift();
      sections.forEach(function(mediaSection, sdpMLineIndex) {
        var caps = SDPUtils.parseRtpParameters(mediaSection);
        pc.transceivers[sdpMLineIndex].localCapabilities = caps;
      });

      pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
        pc._gather(transceiver.mid, sdpMLineIndex);
      });
    } else if (description.type === 'answer') {
      sections = SDPUtils.splitSections(pc._remoteDescription.sdp);
      sessionpart = sections.shift();
      var isIceLite = SDPUtils.matchPrefix(sessionpart,
          'a=ice-lite').length > 0;
      sections.forEach(function(mediaSection, sdpMLineIndex) {
        var transceiver = pc.transceivers[sdpMLineIndex];
        var iceGatherer = transceiver.iceGatherer;
        var iceTransport = transceiver.iceTransport;
        var dtlsTransport = transceiver.dtlsTransport;
        var localCapabilities = transceiver.localCapabilities;
        var remoteCapabilities = transceiver.remoteCapabilities;

        // treat bundle-only as not-rejected.
        var rejected = SDPUtils.isRejected(mediaSection) &&
            SDPUtils.matchPrefix(mediaSection, 'a=bundle-only').length === 0;

        if (!rejected && !transceiver.rejected) {
          var remoteIceParameters = SDPUtils.getIceParameters(
              mediaSection, sessionpart);
          var remoteDtlsParameters = SDPUtils.getDtlsParameters(
              mediaSection, sessionpart);
          if (isIceLite) {
            remoteDtlsParameters.role = 'server';
          }

          if (!pc.usingBundle || sdpMLineIndex === 0) {
            pc._gather(transceiver.mid, sdpMLineIndex);
            if (iceTransport.state === 'new') {
              iceTransport.start(iceGatherer, remoteIceParameters,
                  isIceLite ? 'controlling' : 'controlled');
            }
            if (dtlsTransport.state === 'new') {
              dtlsTransport.start(remoteDtlsParameters);
            }
          }

          // Calculate intersection of capabilities.
          var params = getCommonCapabilities(localCapabilities,
              remoteCapabilities);

          // Start the RTCRtpSender. The RTCRtpReceiver for this
          // transceiver has already been started in setRemoteDescription.
          pc._transceive(transceiver,
              params.codecs.length > 0,
              false);
        }
      });
    }

    pc._localDescription = {
      type: description.type,
      sdp: description.sdp
    };
    if (description.type === 'offer') {
      pc._updateSignalingState('have-local-offer');
    } else {
      pc._updateSignalingState('stable');
    }

    return Promise.resolve();
  };

  RTCPeerConnection.prototype.setRemoteDescription = function(description) {
    var pc = this;

    // Note: pranswer is not supported.
    if (['offer', 'answer'].indexOf(description.type) === -1) {
      return Promise.reject(makeError('TypeError',
          'Unsupported type "' + description.type + '"'));
    }

    if (!isActionAllowedInSignalingState('setRemoteDescription',
        description.type, pc.signalingState) || pc._isClosed) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not set remote ' + description.type +
          ' in state ' + pc.signalingState));
    }

    var streams = {};
    pc.remoteStreams.forEach(function(stream) {
      streams[stream.id] = stream;
    });
    var receiverList = [];
    var sections = SDPUtils.splitSections(description.sdp);
    var sessionpart = sections.shift();
    var isIceLite = SDPUtils.matchPrefix(sessionpart,
        'a=ice-lite').length > 0;
    var usingBundle = SDPUtils.matchPrefix(sessionpart,
        'a=group:BUNDLE ').length > 0;
    pc.usingBundle = usingBundle;
    var iceOptions = SDPUtils.matchPrefix(sessionpart,
        'a=ice-options:')[0];
    if (iceOptions) {
      pc.canTrickleIceCandidates = iceOptions.substr(14).split(' ')
          .indexOf('trickle') >= 0;
    } else {
      pc.canTrickleIceCandidates = false;
    }

    sections.forEach(function(mediaSection, sdpMLineIndex) {
      var lines = SDPUtils.splitLines(mediaSection);
      var kind = SDPUtils.getKind(mediaSection);
      // treat bundle-only as not-rejected.
      var rejected = SDPUtils.isRejected(mediaSection) &&
          SDPUtils.matchPrefix(mediaSection, 'a=bundle-only').length === 0;
      var protocol = lines[0].substr(2).split(' ')[2];

      var direction = SDPUtils.getDirection(mediaSection, sessionpart);
      var remoteMsid = SDPUtils.parseMsid(mediaSection);

      var mid = SDPUtils.getMid(mediaSection) || SDPUtils.generateIdentifier();

      // Reject datachannels which are not implemented yet.
      if (rejected || (kind === 'application' && (protocol === 'DTLS/SCTP' ||
          protocol === 'UDP/DTLS/SCTP'))) {
        // TODO: this is dangerous in the case where a non-rejected m-line
        //     becomes rejected.
        pc.transceivers[sdpMLineIndex] = {
          mid: mid,
          kind: kind,
          protocol: protocol,
          rejected: true
        };
        return;
      }

      if (!rejected && pc.transceivers[sdpMLineIndex] &&
          pc.transceivers[sdpMLineIndex].rejected) {
        // recycle a rejected transceiver.
        pc.transceivers[sdpMLineIndex] = pc._createTransceiver(kind, true);
      }

      var transceiver;
      var iceGatherer;
      var iceTransport;
      var dtlsTransport;
      var rtpReceiver;
      var sendEncodingParameters;
      var recvEncodingParameters;
      var localCapabilities;

      var track;
      // FIXME: ensure the mediaSection has rtcp-mux set.
      var remoteCapabilities = SDPUtils.parseRtpParameters(mediaSection);
      var remoteIceParameters;
      var remoteDtlsParameters;
      if (!rejected) {
        remoteIceParameters = SDPUtils.getIceParameters(mediaSection,
            sessionpart);
        remoteDtlsParameters = SDPUtils.getDtlsParameters(mediaSection,
            sessionpart);
        remoteDtlsParameters.role = 'client';
      }
      recvEncodingParameters =
          SDPUtils.parseRtpEncodingParameters(mediaSection);

      var rtcpParameters = SDPUtils.parseRtcpParameters(mediaSection);

      var isComplete = SDPUtils.matchPrefix(mediaSection,
          'a=end-of-candidates', sessionpart).length > 0;
      var cands = SDPUtils.matchPrefix(mediaSection, 'a=candidate:')
          .map(function(cand) {
            return SDPUtils.parseCandidate(cand);
          })
          .filter(function(cand) {
            return cand.component === 1;
          });

      // Check if we can use BUNDLE and dispose transports.
      if ((description.type === 'offer' || description.type === 'answer') &&
          !rejected && usingBundle && sdpMLineIndex > 0 &&
          pc.transceivers[sdpMLineIndex]) {
        pc._disposeIceAndDtlsTransports(sdpMLineIndex);
        pc.transceivers[sdpMLineIndex].iceGatherer =
            pc.transceivers[0].iceGatherer;
        pc.transceivers[sdpMLineIndex].iceTransport =
            pc.transceivers[0].iceTransport;
        pc.transceivers[sdpMLineIndex].dtlsTransport =
            pc.transceivers[0].dtlsTransport;
        if (pc.transceivers[sdpMLineIndex].rtpSender) {
          pc.transceivers[sdpMLineIndex].rtpSender.setTransport(
              pc.transceivers[0].dtlsTransport);
        }
        if (pc.transceivers[sdpMLineIndex].rtpReceiver) {
          pc.transceivers[sdpMLineIndex].rtpReceiver.setTransport(
              pc.transceivers[0].dtlsTransport);
        }
      }
      if (description.type === 'offer' && !rejected) {
        transceiver = pc.transceivers[sdpMLineIndex] ||
            pc._createTransceiver(kind);
        transceiver.mid = mid;

        if (!transceiver.iceGatherer) {
          transceiver.iceGatherer = pc._createIceGatherer(sdpMLineIndex,
              usingBundle);
        }

        if (cands.length && transceiver.iceTransport.state === 'new') {
          if (isComplete && (!usingBundle || sdpMLineIndex === 0)) {
            transceiver.iceTransport.setRemoteCandidates(cands);
          } else {
            cands.forEach(function(candidate) {
              maybeAddCandidate(transceiver.iceTransport, candidate);
            });
          }
        }

        localCapabilities = window.RTCRtpReceiver.getCapabilities(kind);

        // filter RTX until additional stuff needed for RTX is implemented
        // in adapter.js
        if (edgeVersion < 15019) {
          localCapabilities.codecs = localCapabilities.codecs.filter(
              function(codec) {
                return codec.name !== 'rtx';
              });
        }

        sendEncodingParameters = transceiver.sendEncodingParameters || [{
          ssrc: (2 * sdpMLineIndex + 2) * 1001
        }];

        // TODO: rewrite to use http://w3c.github.io/webrtc-pc/#set-associated-remote-streams
        var isNewTrack = false;
        if (direction === 'sendrecv' || direction === 'sendonly') {
          isNewTrack = !transceiver.rtpReceiver;
          rtpReceiver = transceiver.rtpReceiver ||
              new window.RTCRtpReceiver(transceiver.dtlsTransport, kind);

          if (isNewTrack) {
            var stream;
            track = rtpReceiver.track;
            // FIXME: does not work with Plan B.
            if (remoteMsid && remoteMsid.stream === '-') {
              // no-op. a stream id of '-' means: no associated stream.
            } else if (remoteMsid) {
              if (!streams[remoteMsid.stream]) {
                streams[remoteMsid.stream] = new window.MediaStream();
                Object.defineProperty(streams[remoteMsid.stream], 'id', {
                  get: function() {
                    return remoteMsid.stream;
                  }
                });
              }
              Object.defineProperty(track, 'id', {
                get: function() {
                  return remoteMsid.track;
                }
              });
              stream = streams[remoteMsid.stream];
            } else {
              if (!streams.default) {
                streams.default = new window.MediaStream();
              }
              stream = streams.default;
            }
            if (stream) {
              addTrackToStreamAndFireEvent(track, stream);
              transceiver.associatedRemoteMediaStreams.push(stream);
            }
            receiverList.push([track, rtpReceiver, stream]);
          }
        } else if (transceiver.rtpReceiver && transceiver.rtpReceiver.track) {
          transceiver.associatedRemoteMediaStreams.forEach(function(s) {
            var nativeTrack = s.getTracks().find(function(t) {
              return t.id === transceiver.rtpReceiver.track.id;
            });
            if (nativeTrack) {
              removeTrackFromStreamAndFireEvent(nativeTrack, s);
            }
          });
          transceiver.associatedRemoteMediaStreams = [];
        }

        transceiver.localCapabilities = localCapabilities;
        transceiver.remoteCapabilities = remoteCapabilities;
        transceiver.rtpReceiver = rtpReceiver;
        transceiver.rtcpParameters = rtcpParameters;
        transceiver.sendEncodingParameters = sendEncodingParameters;
        transceiver.recvEncodingParameters = recvEncodingParameters;

        // Start the RTCRtpReceiver now. The RTPSender is started in
        // setLocalDescription.
        pc._transceive(pc.transceivers[sdpMLineIndex],
            false,
            isNewTrack);
      } else if (description.type === 'answer' && !rejected) {
        transceiver = pc.transceivers[sdpMLineIndex];
        iceGatherer = transceiver.iceGatherer;
        iceTransport = transceiver.iceTransport;
        dtlsTransport = transceiver.dtlsTransport;
        rtpReceiver = transceiver.rtpReceiver;
        sendEncodingParameters = transceiver.sendEncodingParameters;
        localCapabilities = transceiver.localCapabilities;

        pc.transceivers[sdpMLineIndex].recvEncodingParameters =
            recvEncodingParameters;
        pc.transceivers[sdpMLineIndex].remoteCapabilities =
            remoteCapabilities;
        pc.transceivers[sdpMLineIndex].rtcpParameters = rtcpParameters;

        if (cands.length && iceTransport.state === 'new') {
          if ((isIceLite || isComplete) &&
              (!usingBundle || sdpMLineIndex === 0)) {
            iceTransport.setRemoteCandidates(cands);
          } else {
            cands.forEach(function(candidate) {
              maybeAddCandidate(transceiver.iceTransport, candidate);
            });
          }
        }

        if (!usingBundle || sdpMLineIndex === 0) {
          if (iceTransport.state === 'new') {
            iceTransport.start(iceGatherer, remoteIceParameters,
                'controlling');
          }
          if (dtlsTransport.state === 'new') {
            dtlsTransport.start(remoteDtlsParameters);
          }
        }

        // If the offer contained RTX but the answer did not,
        // remove RTX from sendEncodingParameters.
        var commonCapabilities = getCommonCapabilities(
          transceiver.localCapabilities,
          transceiver.remoteCapabilities);

        var hasRtx = commonCapabilities.codecs.filter(function(c) {
          return c.name.toLowerCase() === 'rtx';
        }).length;
        if (!hasRtx && transceiver.sendEncodingParameters[0].rtx) {
          delete transceiver.sendEncodingParameters[0].rtx;
        }

        pc._transceive(transceiver,
            direction === 'sendrecv' || direction === 'recvonly',
            direction === 'sendrecv' || direction === 'sendonly');

        // TODO: rewrite to use http://w3c.github.io/webrtc-pc/#set-associated-remote-streams
        if (rtpReceiver &&
            (direction === 'sendrecv' || direction === 'sendonly')) {
          track = rtpReceiver.track;
          if (remoteMsid) {
            if (!streams[remoteMsid.stream]) {
              streams[remoteMsid.stream] = new window.MediaStream();
            }
            addTrackToStreamAndFireEvent(track, streams[remoteMsid.stream]);
            receiverList.push([track, rtpReceiver, streams[remoteMsid.stream]]);
          } else {
            if (!streams.default) {
              streams.default = new window.MediaStream();
            }
            addTrackToStreamAndFireEvent(track, streams.default);
            receiverList.push([track, rtpReceiver, streams.default]);
          }
        } else {
          // FIXME: actually the receiver should be created later.
          delete transceiver.rtpReceiver;
        }
      }
    });

    if (pc._dtlsRole === undefined) {
      pc._dtlsRole = description.type === 'offer' ? 'active' : 'passive';
    }

    pc._remoteDescription = {
      type: description.type,
      sdp: description.sdp
    };
    if (description.type === 'offer') {
      pc._updateSignalingState('have-remote-offer');
    } else {
      pc._updateSignalingState('stable');
    }
    Object.keys(streams).forEach(function(sid) {
      var stream = streams[sid];
      if (stream.getTracks().length) {
        if (pc.remoteStreams.indexOf(stream) === -1) {
          pc.remoteStreams.push(stream);
          var event = new Event('addstream');
          event.stream = stream;
          window.setTimeout(function() {
            pc._dispatchEvent('addstream', event);
          });
        }

        receiverList.forEach(function(item) {
          var track = item[0];
          var receiver = item[1];
          if (stream.id !== item[2].id) {
            return;
          }
          fireAddTrack(pc, track, receiver, [stream]);
        });
      }
    });
    receiverList.forEach(function(item) {
      if (item[2]) {
        return;
      }
      fireAddTrack(pc, item[0], item[1], []);
    });

    // check whether addIceCandidate({}) was called within four seconds after
    // setRemoteDescription.
    window.setTimeout(function() {
      if (!(pc && pc.transceivers)) {
        return;
      }
      pc.transceivers.forEach(function(transceiver) {
        if (transceiver.iceTransport &&
            transceiver.iceTransport.state === 'new' &&
            transceiver.iceTransport.getRemoteCandidates().length > 0) {
          console.warn('Timeout for addRemoteCandidate. Consider sending ' +
              'an end-of-candidates notification');
          transceiver.iceTransport.addRemoteCandidate({});
        }
      });
    }, 4000);

    return Promise.resolve();
  };

  RTCPeerConnection.prototype.close = function() {
    this.transceivers.forEach(function(transceiver) {
      /* not yet
      if (transceiver.iceGatherer) {
        transceiver.iceGatherer.close();
      }
      */
      if (transceiver.iceTransport) {
        transceiver.iceTransport.stop();
      }
      if (transceiver.dtlsTransport) {
        transceiver.dtlsTransport.stop();
      }
      if (transceiver.rtpSender) {
        transceiver.rtpSender.stop();
      }
      if (transceiver.rtpReceiver) {
        transceiver.rtpReceiver.stop();
      }
    });
    // FIXME: clean up tracks, local streams, remote streams, etc
    this._isClosed = true;
    this._updateSignalingState('closed');
  };

  // Update the signaling state.
  RTCPeerConnection.prototype._updateSignalingState = function(newState) {
    this.signalingState = newState;
    var event = new Event('signalingstatechange');
    this._dispatchEvent('signalingstatechange', event);
  };

  // Determine whether to fire the negotiationneeded event.
  RTCPeerConnection.prototype._maybeFireNegotiationNeeded = function() {
    var pc = this;
    if (this.signalingState !== 'stable' || this.needNegotiation === true) {
      return;
    }
    this.needNegotiation = true;
    window.setTimeout(function() {
      if (pc.needNegotiation) {
        pc.needNegotiation = false;
        var event = new Event('negotiationneeded');
        pc._dispatchEvent('negotiationneeded', event);
      }
    }, 0);
  };

  // Update the ice connection state.
  RTCPeerConnection.prototype._updateIceConnectionState = function() {
    var newState;
    var states = {
      'new': 0,
      closed: 0,
      checking: 0,
      connected: 0,
      completed: 0,
      disconnected: 0,
      failed: 0
    };
    this.transceivers.forEach(function(transceiver) {
      if (transceiver.iceTransport && !transceiver.rejected) {
        states[transceiver.iceTransport.state]++;
      }
    });

    newState = 'new';
    if (states.failed > 0) {
      newState = 'failed';
    } else if (states.checking > 0) {
      newState = 'checking';
    } else if (states.disconnected > 0) {
      newState = 'disconnected';
    } else if (states.new > 0) {
      newState = 'new';
    } else if (states.connected > 0) {
      newState = 'connected';
    } else if (states.completed > 0) {
      newState = 'completed';
    }

    if (newState !== this.iceConnectionState) {
      this.iceConnectionState = newState;
      var event = new Event('iceconnectionstatechange');
      this._dispatchEvent('iceconnectionstatechange', event);
    }
  };

  // Update the connection state.
  RTCPeerConnection.prototype._updateConnectionState = function() {
    var newState;
    var states = {
      'new': 0,
      closed: 0,
      connecting: 0,
      connected: 0,
      completed: 0,
      disconnected: 0,
      failed: 0
    };
    this.transceivers.forEach(function(transceiver) {
      if (transceiver.iceTransport && transceiver.dtlsTransport &&
          !transceiver.rejected) {
        states[transceiver.iceTransport.state]++;
        states[transceiver.dtlsTransport.state]++;
      }
    });
    // ICETransport.completed and connected are the same for this purpose.
    states.connected += states.completed;

    newState = 'new';
    if (states.failed > 0) {
      newState = 'failed';
    } else if (states.connecting > 0) {
      newState = 'connecting';
    } else if (states.disconnected > 0) {
      newState = 'disconnected';
    } else if (states.new > 0) {
      newState = 'new';
    } else if (states.connected > 0) {
      newState = 'connected';
    }

    if (newState !== this.connectionState) {
      this.connectionState = newState;
      var event = new Event('connectionstatechange');
      this._dispatchEvent('connectionstatechange', event);
    }
  };

  RTCPeerConnection.prototype.createOffer = function() {
    var pc = this;

    if (pc._isClosed) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not call createOffer after close'));
    }

    var numAudioTracks = pc.transceivers.filter(function(t) {
      return t.kind === 'audio';
    }).length;
    var numVideoTracks = pc.transceivers.filter(function(t) {
      return t.kind === 'video';
    }).length;

    // Determine number of audio and video tracks we need to send/recv.
    var offerOptions = arguments[0];
    if (offerOptions) {
      // Reject Chrome legacy constraints.
      if (offerOptions.mandatory || offerOptions.optional) {
        throw new TypeError(
            'Legacy mandatory/optional constraints not supported.');
      }
      if (offerOptions.offerToReceiveAudio !== undefined) {
        if (offerOptions.offerToReceiveAudio === true) {
          numAudioTracks = 1;
        } else if (offerOptions.offerToReceiveAudio === false) {
          numAudioTracks = 0;
        } else {
          numAudioTracks = offerOptions.offerToReceiveAudio;
        }
      }
      if (offerOptions.offerToReceiveVideo !== undefined) {
        if (offerOptions.offerToReceiveVideo === true) {
          numVideoTracks = 1;
        } else if (offerOptions.offerToReceiveVideo === false) {
          numVideoTracks = 0;
        } else {
          numVideoTracks = offerOptions.offerToReceiveVideo;
        }
      }
    }

    pc.transceivers.forEach(function(transceiver) {
      if (transceiver.kind === 'audio') {
        numAudioTracks--;
        if (numAudioTracks < 0) {
          transceiver.wantReceive = false;
        }
      } else if (transceiver.kind === 'video') {
        numVideoTracks--;
        if (numVideoTracks < 0) {
          transceiver.wantReceive = false;
        }
      }
    });

    // Create M-lines for recvonly streams.
    while (numAudioTracks > 0 || numVideoTracks > 0) {
      if (numAudioTracks > 0) {
        pc._createTransceiver('audio');
        numAudioTracks--;
      }
      if (numVideoTracks > 0) {
        pc._createTransceiver('video');
        numVideoTracks--;
      }
    }

    var sdp = SDPUtils.writeSessionBoilerplate(pc._sdpSessionId,
        pc._sdpSessionVersion++);
    pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
      // For each track, create an ice gatherer, ice transport,
      // dtls transport, potentially rtpsender and rtpreceiver.
      var track = transceiver.track;
      var kind = transceiver.kind;
      var mid = transceiver.mid || SDPUtils.generateIdentifier();
      transceiver.mid = mid;

      if (!transceiver.iceGatherer) {
        transceiver.iceGatherer = pc._createIceGatherer(sdpMLineIndex,
            pc.usingBundle);
      }

      var localCapabilities = window.RTCRtpSender.getCapabilities(kind);
      // filter RTX until additional stuff needed for RTX is implemented
      // in adapter.js
      if (edgeVersion < 15019) {
        localCapabilities.codecs = localCapabilities.codecs.filter(
            function(codec) {
              return codec.name !== 'rtx';
            });
      }
      localCapabilities.codecs.forEach(function(codec) {
        // work around https://bugs.chromium.org/p/webrtc/issues/detail?id=6552
        // by adding level-asymmetry-allowed=1
        if (codec.name === 'H264' &&
            codec.parameters['level-asymmetry-allowed'] === undefined) {
          codec.parameters['level-asymmetry-allowed'] = '1';
        }

        // for subsequent offers, we might have to re-use the payload
        // type of the last offer.
        if (transceiver.remoteCapabilities &&
            transceiver.remoteCapabilities.codecs) {
          transceiver.remoteCapabilities.codecs.forEach(function(remoteCodec) {
            if (codec.name.toLowerCase() === remoteCodec.name.toLowerCase() &&
                codec.clockRate === remoteCodec.clockRate) {
              codec.preferredPayloadType = remoteCodec.payloadType;
            }
          });
        }
      });
      localCapabilities.headerExtensions.forEach(function(hdrExt) {
        var remoteExtensions = transceiver.remoteCapabilities &&
            transceiver.remoteCapabilities.headerExtensions || [];
        remoteExtensions.forEach(function(rHdrExt) {
          if (hdrExt.uri === rHdrExt.uri) {
            hdrExt.id = rHdrExt.id;
          }
        });
      });

      // generate an ssrc now, to be used later in rtpSender.send
      var sendEncodingParameters = transceiver.sendEncodingParameters || [{
        ssrc: (2 * sdpMLineIndex + 1) * 1001
      }];
      if (track) {
        // add RTX
        if (edgeVersion >= 15019 && kind === 'video' &&
            !sendEncodingParameters[0].rtx) {
          sendEncodingParameters[0].rtx = {
            ssrc: sendEncodingParameters[0].ssrc + 1
          };
        }
      }

      if (transceiver.wantReceive) {
        transceiver.rtpReceiver = new window.RTCRtpReceiver(
            transceiver.dtlsTransport, kind);
      }

      transceiver.localCapabilities = localCapabilities;
      transceiver.sendEncodingParameters = sendEncodingParameters;
    });

    // always offer BUNDLE and dispose on return if not supported.
    if (pc._config.bundlePolicy !== 'max-compat') {
      sdp += 'a=group:BUNDLE ' + pc.transceivers.map(function(t) {
        return t.mid;
      }).join(' ') + '\r\n';
    }
    sdp += 'a=ice-options:trickle\r\n';

    pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
      sdp += writeMediaSection(transceiver, transceiver.localCapabilities,
          'offer', transceiver.stream, pc._dtlsRole);
      sdp += 'a=rtcp-rsize\r\n';

      if (transceiver.iceGatherer && pc.iceGatheringState !== 'new' &&
          (sdpMLineIndex === 0 || !pc.usingBundle)) {
        transceiver.iceGatherer.getLocalCandidates().forEach(function(cand) {
          cand.component = 1;
          sdp += 'a=' + SDPUtils.writeCandidate(cand) + '\r\n';
        });

        if (transceiver.iceGatherer.state === 'completed') {
          sdp += 'a=end-of-candidates\r\n';
        }
      }
    });

    var desc = new window.RTCSessionDescription({
      type: 'offer',
      sdp: sdp
    });
    return Promise.resolve(desc);
  };

  RTCPeerConnection.prototype.createAnswer = function() {
    var pc = this;

    if (pc._isClosed) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not call createAnswer after close'));
    }

    if (!(pc.signalingState === 'have-remote-offer' ||
        pc.signalingState === 'have-local-pranswer')) {
      return Promise.reject(makeError('InvalidStateError',
          'Can not call createAnswer in signalingState ' + pc.signalingState));
    }

    var sdp = SDPUtils.writeSessionBoilerplate(pc._sdpSessionId,
        pc._sdpSessionVersion++);
    if (pc.usingBundle) {
      sdp += 'a=group:BUNDLE ' + pc.transceivers.map(function(t) {
        return t.mid;
      }).join(' ') + '\r\n';
    }
    sdp += 'a=ice-options:trickle\r\n';

    var mediaSectionsInOffer = SDPUtils.getMediaSections(
        pc._remoteDescription.sdp).length;
    pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
      if (sdpMLineIndex + 1 > mediaSectionsInOffer) {
        return;
      }
      if (transceiver.rejected) {
        if (transceiver.kind === 'application') {
          if (transceiver.protocol === 'DTLS/SCTP') { // legacy fmt
            sdp += 'm=application 0 DTLS/SCTP 5000\r\n';
          } else {
            sdp += 'm=application 0 ' + transceiver.protocol +
                ' webrtc-datachannel\r\n';
          }
        } else if (transceiver.kind === 'audio') {
          sdp += 'm=audio 0 UDP/TLS/RTP/SAVPF 0\r\n' +
              'a=rtpmap:0 PCMU/8000\r\n';
        } else if (transceiver.kind === 'video') {
          sdp += 'm=video 0 UDP/TLS/RTP/SAVPF 120\r\n' +
              'a=rtpmap:120 VP8/90000\r\n';
        }
        sdp += 'c=IN IP4 0.0.0.0\r\n' +
            'a=inactive\r\n' +
            'a=mid:' + transceiver.mid + '\r\n';
        return;
      }

      // FIXME: look at direction.
      if (transceiver.stream) {
        var localTrack;
        if (transceiver.kind === 'audio') {
          localTrack = transceiver.stream.getAudioTracks()[0];
        } else if (transceiver.kind === 'video') {
          localTrack = transceiver.stream.getVideoTracks()[0];
        }
        if (localTrack) {
          // add RTX
          if (edgeVersion >= 15019 && transceiver.kind === 'video' &&
              !transceiver.sendEncodingParameters[0].rtx) {
            transceiver.sendEncodingParameters[0].rtx = {
              ssrc: transceiver.sendEncodingParameters[0].ssrc + 1
            };
          }
        }
      }

      // Calculate intersection of capabilities.
      var commonCapabilities = getCommonCapabilities(
          transceiver.localCapabilities,
          transceiver.remoteCapabilities);

      var hasRtx = commonCapabilities.codecs.filter(function(c) {
        return c.name.toLowerCase() === 'rtx';
      }).length;
      if (!hasRtx && transceiver.sendEncodingParameters[0].rtx) {
        delete transceiver.sendEncodingParameters[0].rtx;
      }

      sdp += writeMediaSection(transceiver, commonCapabilities,
          'answer', transceiver.stream, pc._dtlsRole);
      if (transceiver.rtcpParameters &&
          transceiver.rtcpParameters.reducedSize) {
        sdp += 'a=rtcp-rsize\r\n';
      }
    });

    var desc = new window.RTCSessionDescription({
      type: 'answer',
      sdp: sdp
    });
    return Promise.resolve(desc);
  };

  RTCPeerConnection.prototype.addIceCandidate = function(candidate) {
    var pc = this;
    var sections;
    if (candidate && !(candidate.sdpMLineIndex !== undefined ||
        candidate.sdpMid)) {
      return Promise.reject(new TypeError('sdpMLineIndex or sdpMid required'));
    }

    // TODO: needs to go into ops queue.
    return new Promise(function(resolve, reject) {
      if (!pc._remoteDescription) {
        return reject(makeError('InvalidStateError',
            'Can not add ICE candidate without a remote description'));
      } else if (!candidate || candidate.candidate === '') {
        for (var j = 0; j < pc.transceivers.length; j++) {
          if (pc.transceivers[j].rejected) {
            continue;
          }
          pc.transceivers[j].iceTransport.addRemoteCandidate({});
          sections = SDPUtils.getMediaSections(pc._remoteDescription.sdp);
          sections[j] += 'a=end-of-candidates\r\n';
          pc._remoteDescription.sdp =
              SDPUtils.getDescription(pc._remoteDescription.sdp) +
              sections.join('');
          if (pc.usingBundle) {
            break;
          }
        }
      } else {
        var sdpMLineIndex = candidate.sdpMLineIndex;
        if (candidate.sdpMid) {
          for (var i = 0; i < pc.transceivers.length; i++) {
            if (pc.transceivers[i].mid === candidate.sdpMid) {
              sdpMLineIndex = i;
              break;
            }
          }
        }
        var transceiver = pc.transceivers[sdpMLineIndex];
        if (transceiver) {
          if (transceiver.rejected) {
            return resolve();
          }
          var cand = Object.keys(candidate.candidate).length > 0 ?
              SDPUtils.parseCandidate(candidate.candidate) : {};
          // Ignore Chrome's invalid candidates since Edge does not like them.
          if (cand.protocol === 'tcp' && (cand.port === 0 || cand.port === 9)) {
            return resolve();
          }
          // Ignore RTCP candidates, we assume RTCP-MUX.
          if (cand.component && cand.component !== 1) {
            return resolve();
          }
          // when using bundle, avoid adding candidates to the wrong
          // ice transport. And avoid adding candidates added in the SDP.
          if (sdpMLineIndex === 0 || (sdpMLineIndex > 0 &&
              transceiver.iceTransport !== pc.transceivers[0].iceTransport)) {
            if (!maybeAddCandidate(transceiver.iceTransport, cand)) {
              return reject(makeError('OperationError',
                  'Can not add ICE candidate'));
            }
          }

          // update the remoteDescription.
          var candidateString = candidate.candidate.trim();
          if (candidateString.indexOf('a=') === 0) {
            candidateString = candidateString.substr(2);
          }
          sections = SDPUtils.getMediaSections(pc._remoteDescription.sdp);
          sections[sdpMLineIndex] += 'a=' +
              (cand.type ? candidateString : 'end-of-candidates')
              + '\r\n';
          pc._remoteDescription.sdp =
              SDPUtils.getDescription(pc._remoteDescription.sdp) +
              sections.join('');
        } else {
          return reject(makeError('OperationError',
              'Can not add ICE candidate'));
        }
      }
      resolve();
    });
  };

  RTCPeerConnection.prototype.getStats = function(selector) {
    if (selector && selector instanceof window.MediaStreamTrack) {
      var senderOrReceiver = null;
      this.transceivers.forEach(function(transceiver) {
        if (transceiver.rtpSender &&
            transceiver.rtpSender.track === selector) {
          senderOrReceiver = transceiver.rtpSender;
        } else if (transceiver.rtpReceiver &&
            transceiver.rtpReceiver.track === selector) {
          senderOrReceiver = transceiver.rtpReceiver;
        }
      });
      if (!senderOrReceiver) {
        throw makeError('InvalidAccessError', 'Invalid selector.');
      }
      return senderOrReceiver.getStats();
    }

    var promises = [];
    this.transceivers.forEach(function(transceiver) {
      ['rtpSender', 'rtpReceiver', 'iceGatherer', 'iceTransport',
          'dtlsTransport'].forEach(function(method) {
            if (transceiver[method]) {
              promises.push(transceiver[method].getStats());
            }
          });
    });
    return Promise.all(promises).then(function(allStats) {
      var results = new Map();
      allStats.forEach(function(stats) {
        stats.forEach(function(stat) {
          results.set(stat.id, stat);
        });
      });
      return results;
    });
  };

  // fix low-level stat names and return Map instead of object.
  var ortcObjects = ['RTCRtpSender', 'RTCRtpReceiver', 'RTCIceGatherer',
    'RTCIceTransport', 'RTCDtlsTransport'];
  ortcObjects.forEach(function(ortcObjectName) {
    var obj = window[ortcObjectName];
    if (obj && obj.prototype && obj.prototype.getStats) {
      var nativeGetstats = obj.prototype.getStats;
      obj.prototype.getStats = function() {
        return nativeGetstats.apply(this)
        .then(function(nativeStats) {
          var mapStats = new Map();
          Object.keys(nativeStats).forEach(function(id) {
            nativeStats[id].type = fixStatsType(nativeStats[id]);
            mapStats.set(id, nativeStats[id]);
          });
          return mapStats;
        });
      };
    }
  });

  // legacy callback shims. Should be moved to adapter.js some days.
  var methods = ['createOffer', 'createAnswer'];
  methods.forEach(function(method) {
    var nativeMethod = RTCPeerConnection.prototype[method];
    RTCPeerConnection.prototype[method] = function() {
      var args = arguments;
      if (typeof args[0] === 'function' ||
          typeof args[1] === 'function') { // legacy
        return nativeMethod.apply(this, [arguments[2]])
        .then(function(description) {
          if (typeof args[0] === 'function') {
            args[0].apply(null, [description]);
          }
        }, function(error) {
          if (typeof args[1] === 'function') {
            args[1].apply(null, [error]);
          }
        });
      }
      return nativeMethod.apply(this, arguments);
    };
  });

  methods = ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate'];
  methods.forEach(function(method) {
    var nativeMethod = RTCPeerConnection.prototype[method];
    RTCPeerConnection.prototype[method] = function() {
      var args = arguments;
      if (typeof args[1] === 'function' ||
          typeof args[2] === 'function') { // legacy
        return nativeMethod.apply(this, arguments)
        .then(function() {
          if (typeof args[1] === 'function') {
            args[1].apply(null);
          }
        }, function(error) {
          if (typeof args[2] === 'function') {
            args[2].apply(null, [error]);
          }
        });
      }
      return nativeMethod.apply(this, arguments);
    };
  });

  // getStats is special. It doesn't have a spec legacy method yet we support
  // getStats(something, cb) without error callbacks.
  ['getStats'].forEach(function(method) {
    var nativeMethod = RTCPeerConnection.prototype[method];
    RTCPeerConnection.prototype[method] = function() {
      var args = arguments;
      if (typeof args[1] === 'function') {
        return nativeMethod.apply(this, arguments)
        .then(function() {
          if (typeof args[1] === 'function') {
            args[1].apply(null);
          }
        });
      }
      return nativeMethod.apply(this, arguments);
    };
  });

  return RTCPeerConnection;
};


/***/ }),

/***/ "./node_modules/sdp/sdp.js":
/*!*********************************!*\
  !*** ./node_modules/sdp/sdp.js ***!
  \*********************************/
/***/ ((module) => {

"use strict";
/* eslint-env node */


// SDP helpers.
var SDPUtils = {};

// Generate an alphanumeric identifier for cname or mids.
// TODO: use UUIDs instead? https://gist.github.com/jed/982883
SDPUtils.generateIdentifier = function() {
  return Math.random().toString(36).substr(2, 10);
};

// The RTCP CNAME used by all peerconnections from the same JS.
SDPUtils.localCName = SDPUtils.generateIdentifier();

// Splits SDP into lines, dealing with both CRLF and LF.
SDPUtils.splitLines = function(blob) {
  return blob.trim().split('\n').map(function(line) {
    return line.trim();
  });
};
// Splits SDP into sessionpart and mediasections. Ensures CRLF.
SDPUtils.splitSections = function(blob) {
  var parts = blob.split('\nm=');
  return parts.map(function(part, index) {
    return (index > 0 ? 'm=' + part : part).trim() + '\r\n';
  });
};

// returns the session description.
SDPUtils.getDescription = function(blob) {
  var sections = SDPUtils.splitSections(blob);
  return sections && sections[0];
};

// returns the individual media sections.
SDPUtils.getMediaSections = function(blob) {
  var sections = SDPUtils.splitSections(blob);
  sections.shift();
  return sections;
};

// Returns lines that start with a certain prefix.
SDPUtils.matchPrefix = function(blob, prefix) {
  return SDPUtils.splitLines(blob).filter(function(line) {
    return line.indexOf(prefix) === 0;
  });
};

// Parses an ICE candidate line. Sample input:
// candidate:702786350 2 udp 41819902 8.8.8.8 60769 typ relay raddr 8.8.8.8
// rport 55996"
SDPUtils.parseCandidate = function(line) {
  var parts;
  // Parse both variants.
  if (line.indexOf('a=candidate:') === 0) {
    parts = line.substring(12).split(' ');
  } else {
    parts = line.substring(10).split(' ');
  }

  var candidate = {
    foundation: parts[0],
    component: parseInt(parts[1], 10),
    protocol: parts[2].toLowerCase(),
    priority: parseInt(parts[3], 10),
    ip: parts[4],
    address: parts[4], // address is an alias for ip.
    port: parseInt(parts[5], 10),
    // skip parts[6] == 'typ'
    type: parts[7]
  };

  for (var i = 8; i < parts.length; i += 2) {
    switch (parts[i]) {
      case 'raddr':
        candidate.relatedAddress = parts[i + 1];
        break;
      case 'rport':
        candidate.relatedPort = parseInt(parts[i + 1], 10);
        break;
      case 'tcptype':
        candidate.tcpType = parts[i + 1];
        break;
      case 'ufrag':
        candidate.ufrag = parts[i + 1]; // for backward compability.
        candidate.usernameFragment = parts[i + 1];
        break;
      default: // extension handling, in particular ufrag
        candidate[parts[i]] = parts[i + 1];
        break;
    }
  }
  return candidate;
};

// Translates a candidate object into SDP candidate attribute.
SDPUtils.writeCandidate = function(candidate) {
  var sdp = [];
  sdp.push(candidate.foundation);
  sdp.push(candidate.component);
  sdp.push(candidate.protocol.toUpperCase());
  sdp.push(candidate.priority);
  sdp.push(candidate.address || candidate.ip);
  sdp.push(candidate.port);

  var type = candidate.type;
  sdp.push('typ');
  sdp.push(type);
  if (type !== 'host' && candidate.relatedAddress &&
      candidate.relatedPort) {
    sdp.push('raddr');
    sdp.push(candidate.relatedAddress);
    sdp.push('rport');
    sdp.push(candidate.relatedPort);
  }
  if (candidate.tcpType && candidate.protocol.toLowerCase() === 'tcp') {
    sdp.push('tcptype');
    sdp.push(candidate.tcpType);
  }
  if (candidate.usernameFragment || candidate.ufrag) {
    sdp.push('ufrag');
    sdp.push(candidate.usernameFragment || candidate.ufrag);
  }
  return 'candidate:' + sdp.join(' ');
};

// Parses an ice-options line, returns an array of option tags.
// a=ice-options:foo bar
SDPUtils.parseIceOptions = function(line) {
  return line.substr(14).split(' ');
};

// Parses an rtpmap line, returns RTCRtpCoddecParameters. Sample input:
// a=rtpmap:111 opus/48000/2
SDPUtils.parseRtpMap = function(line) {
  var parts = line.substr(9).split(' ');
  var parsed = {
    payloadType: parseInt(parts.shift(), 10) // was: id
  };

  parts = parts[0].split('/');

  parsed.name = parts[0];
  parsed.clockRate = parseInt(parts[1], 10); // was: clockrate
  parsed.channels = parts.length === 3 ? parseInt(parts[2], 10) : 1;
  // legacy alias, got renamed back to channels in ORTC.
  parsed.numChannels = parsed.channels;
  return parsed;
};

// Generate an a=rtpmap line from RTCRtpCodecCapability or
// RTCRtpCodecParameters.
SDPUtils.writeRtpMap = function(codec) {
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  var channels = codec.channels || codec.numChannels || 1;
  return 'a=rtpmap:' + pt + ' ' + codec.name + '/' + codec.clockRate +
      (channels !== 1 ? '/' + channels : '') + '\r\n';
};

// Parses an a=extmap line (headerextension from RFC 5285). Sample input:
// a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
// a=extmap:2/sendonly urn:ietf:params:rtp-hdrext:toffset
SDPUtils.parseExtmap = function(line) {
  var parts = line.substr(9).split(' ');
  return {
    id: parseInt(parts[0], 10),
    direction: parts[0].indexOf('/') > 0 ? parts[0].split('/')[1] : 'sendrecv',
    uri: parts[1]
  };
};

// Generates a=extmap line from RTCRtpHeaderExtensionParameters or
// RTCRtpHeaderExtension.
SDPUtils.writeExtmap = function(headerExtension) {
  return 'a=extmap:' + (headerExtension.id || headerExtension.preferredId) +
      (headerExtension.direction && headerExtension.direction !== 'sendrecv'
        ? '/' + headerExtension.direction
        : '') +
      ' ' + headerExtension.uri + '\r\n';
};

// Parses an ftmp line, returns dictionary. Sample input:
// a=fmtp:96 vbr=on;cng=on
// Also deals with vbr=on; cng=on
SDPUtils.parseFmtp = function(line) {
  var parsed = {};
  var kv;
  var parts = line.substr(line.indexOf(' ') + 1).split(';');
  for (var j = 0; j < parts.length; j++) {
    kv = parts[j].trim().split('=');
    parsed[kv[0].trim()] = kv[1];
  }
  return parsed;
};

// Generates an a=ftmp line from RTCRtpCodecCapability or RTCRtpCodecParameters.
SDPUtils.writeFmtp = function(codec) {
  var line = '';
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  if (codec.parameters && Object.keys(codec.parameters).length) {
    var params = [];
    Object.keys(codec.parameters).forEach(function(param) {
      if (codec.parameters[param]) {
        params.push(param + '=' + codec.parameters[param]);
      } else {
        params.push(param);
      }
    });
    line += 'a=fmtp:' + pt + ' ' + params.join(';') + '\r\n';
  }
  return line;
};

// Parses an rtcp-fb line, returns RTCPRtcpFeedback object. Sample input:
// a=rtcp-fb:98 nack rpsi
SDPUtils.parseRtcpFb = function(line) {
  var parts = line.substr(line.indexOf(' ') + 1).split(' ');
  return {
    type: parts.shift(),
    parameter: parts.join(' ')
  };
};
// Generate a=rtcp-fb lines from RTCRtpCodecCapability or RTCRtpCodecParameters.
SDPUtils.writeRtcpFb = function(codec) {
  var lines = '';
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  if (codec.rtcpFeedback && codec.rtcpFeedback.length) {
    // FIXME: special handling for trr-int?
    codec.rtcpFeedback.forEach(function(fb) {
      lines += 'a=rtcp-fb:' + pt + ' ' + fb.type +
      (fb.parameter && fb.parameter.length ? ' ' + fb.parameter : '') +
          '\r\n';
    });
  }
  return lines;
};

// Parses an RFC 5576 ssrc media attribute. Sample input:
// a=ssrc:3735928559 cname:something
SDPUtils.parseSsrcMedia = function(line) {
  var sp = line.indexOf(' ');
  var parts = {
    ssrc: parseInt(line.substr(7, sp - 7), 10)
  };
  var colon = line.indexOf(':', sp);
  if (colon > -1) {
    parts.attribute = line.substr(sp + 1, colon - sp - 1);
    parts.value = line.substr(colon + 1);
  } else {
    parts.attribute = line.substr(sp + 1);
  }
  return parts;
};

SDPUtils.parseSsrcGroup = function(line) {
  var parts = line.substr(13).split(' ');
  return {
    semantics: parts.shift(),
    ssrcs: parts.map(function(ssrc) {
      return parseInt(ssrc, 10);
    })
  };
};

// Extracts the MID (RFC 5888) from a media section.
// returns the MID or undefined if no mid line was found.
SDPUtils.getMid = function(mediaSection) {
  var mid = SDPUtils.matchPrefix(mediaSection, 'a=mid:')[0];
  if (mid) {
    return mid.substr(6);
  }
};

SDPUtils.parseFingerprint = function(line) {
  var parts = line.substr(14).split(' ');
  return {
    algorithm: parts[0].toLowerCase(), // algorithm is case-sensitive in Edge.
    value: parts[1]
  };
};

// Extracts DTLS parameters from SDP media section or sessionpart.
// FIXME: for consistency with other functions this should only
//   get the fingerprint line as input. See also getIceParameters.
SDPUtils.getDtlsParameters = function(mediaSection, sessionpart) {
  var lines = SDPUtils.matchPrefix(mediaSection + sessionpart,
    'a=fingerprint:');
  // Note: a=setup line is ignored since we use the 'auto' role.
  // Note2: 'algorithm' is not case sensitive except in Edge.
  return {
    role: 'auto',
    fingerprints: lines.map(SDPUtils.parseFingerprint)
  };
};

// Serializes DTLS parameters to SDP.
SDPUtils.writeDtlsParameters = function(params, setupType) {
  var sdp = 'a=setup:' + setupType + '\r\n';
  params.fingerprints.forEach(function(fp) {
    sdp += 'a=fingerprint:' + fp.algorithm + ' ' + fp.value + '\r\n';
  });
  return sdp;
};

// Parses a=crypto lines into
//   https://rawgit.com/aboba/edgertc/master/msortc-rs4.html#dictionary-rtcsrtpsdesparameters-members
SDPUtils.parseCryptoLine = function(line) {
  var parts = line.substr(9).split(' ');
  return {
    tag: parseInt(parts[0], 10),
    cryptoSuite: parts[1],
    keyParams: parts[2],
    sessionParams: parts.slice(3),
  };
};

SDPUtils.writeCryptoLine = function(parameters) {
  return 'a=crypto:' + parameters.tag + ' ' +
    parameters.cryptoSuite + ' ' +
    (typeof parameters.keyParams === 'object'
      ? SDPUtils.writeCryptoKeyParams(parameters.keyParams)
      : parameters.keyParams) +
    (parameters.sessionParams ? ' ' + parameters.sessionParams.join(' ') : '') +
    '\r\n';
};

// Parses the crypto key parameters into
//   https://rawgit.com/aboba/edgertc/master/msortc-rs4.html#rtcsrtpkeyparam*
SDPUtils.parseCryptoKeyParams = function(keyParams) {
  if (keyParams.indexOf('inline:') !== 0) {
    return null;
  }
  var parts = keyParams.substr(7).split('|');
  return {
    keyMethod: 'inline',
    keySalt: parts[0],
    lifeTime: parts[1],
    mkiValue: parts[2] ? parts[2].split(':')[0] : undefined,
    mkiLength: parts[2] ? parts[2].split(':')[1] : undefined,
  };
};

SDPUtils.writeCryptoKeyParams = function(keyParams) {
  return keyParams.keyMethod + ':'
    + keyParams.keySalt +
    (keyParams.lifeTime ? '|' + keyParams.lifeTime : '') +
    (keyParams.mkiValue && keyParams.mkiLength
      ? '|' + keyParams.mkiValue + ':' + keyParams.mkiLength
      : '');
};

// Extracts all SDES paramters.
SDPUtils.getCryptoParameters = function(mediaSection, sessionpart) {
  var lines = SDPUtils.matchPrefix(mediaSection + sessionpart,
    'a=crypto:');
  return lines.map(SDPUtils.parseCryptoLine);
};

// Parses ICE information from SDP media section or sessionpart.
// FIXME: for consistency with other functions this should only
//   get the ice-ufrag and ice-pwd lines as input.
SDPUtils.getIceParameters = function(mediaSection, sessionpart) {
  var ufrag = SDPUtils.matchPrefix(mediaSection + sessionpart,
    'a=ice-ufrag:')[0];
  var pwd = SDPUtils.matchPrefix(mediaSection + sessionpart,
    'a=ice-pwd:')[0];
  if (!(ufrag && pwd)) {
    return null;
  }
  return {
    usernameFragment: ufrag.substr(12),
    password: pwd.substr(10),
  };
};

// Serializes ICE parameters to SDP.
SDPUtils.writeIceParameters = function(params) {
  return 'a=ice-ufrag:' + params.usernameFragment + '\r\n' +
      'a=ice-pwd:' + params.password + '\r\n';
};

// Parses the SDP media section and returns RTCRtpParameters.
SDPUtils.parseRtpParameters = function(mediaSection) {
  var description = {
    codecs: [],
    headerExtensions: [],
    fecMechanisms: [],
    rtcp: []
  };
  var lines = SDPUtils.splitLines(mediaSection);
  var mline = lines[0].split(' ');
  for (var i = 3; i < mline.length; i++) { // find all codecs from mline[3..]
    var pt = mline[i];
    var rtpmapline = SDPUtils.matchPrefix(
      mediaSection, 'a=rtpmap:' + pt + ' ')[0];
    if (rtpmapline) {
      var codec = SDPUtils.parseRtpMap(rtpmapline);
      var fmtps = SDPUtils.matchPrefix(
        mediaSection, 'a=fmtp:' + pt + ' ');
      // Only the first a=fmtp:<pt> is considered.
      codec.parameters = fmtps.length ? SDPUtils.parseFmtp(fmtps[0]) : {};
      codec.rtcpFeedback = SDPUtils.matchPrefix(
        mediaSection, 'a=rtcp-fb:' + pt + ' ')
        .map(SDPUtils.parseRtcpFb);
      description.codecs.push(codec);
      // parse FEC mechanisms from rtpmap lines.
      switch (codec.name.toUpperCase()) {
        case 'RED':
        case 'ULPFEC':
          description.fecMechanisms.push(codec.name.toUpperCase());
          break;
        default: // only RED and ULPFEC are recognized as FEC mechanisms.
          break;
      }
    }
  }
  SDPUtils.matchPrefix(mediaSection, 'a=extmap:').forEach(function(line) {
    description.headerExtensions.push(SDPUtils.parseExtmap(line));
  });
  // FIXME: parse rtcp.
  return description;
};

// Generates parts of the SDP media section describing the capabilities /
// parameters.
SDPUtils.writeRtpDescription = function(kind, caps) {
  var sdp = '';

  // Build the mline.
  sdp += 'm=' + kind + ' ';
  sdp += caps.codecs.length > 0 ? '9' : '0'; // reject if no codecs.
  sdp += ' UDP/TLS/RTP/SAVPF ';
  sdp += caps.codecs.map(function(codec) {
    if (codec.preferredPayloadType !== undefined) {
      return codec.preferredPayloadType;
    }
    return codec.payloadType;
  }).join(' ') + '\r\n';

  sdp += 'c=IN IP4 0.0.0.0\r\n';
  sdp += 'a=rtcp:9 IN IP4 0.0.0.0\r\n';

  // Add a=rtpmap lines for each codec. Also fmtp and rtcp-fb.
  caps.codecs.forEach(function(codec) {
    sdp += SDPUtils.writeRtpMap(codec);
    sdp += SDPUtils.writeFmtp(codec);
    sdp += SDPUtils.writeRtcpFb(codec);
  });
  var maxptime = 0;
  caps.codecs.forEach(function(codec) {
    if (codec.maxptime > maxptime) {
      maxptime = codec.maxptime;
    }
  });
  if (maxptime > 0) {
    sdp += 'a=maxptime:' + maxptime + '\r\n';
  }
  sdp += 'a=rtcp-mux\r\n';

  if (caps.headerExtensions) {
    caps.headerExtensions.forEach(function(extension) {
      sdp += SDPUtils.writeExtmap(extension);
    });
  }
  // FIXME: write fecMechanisms.
  return sdp;
};

// Parses the SDP media section and returns an array of
// RTCRtpEncodingParameters.
SDPUtils.parseRtpEncodingParameters = function(mediaSection) {
  var encodingParameters = [];
  var description = SDPUtils.parseRtpParameters(mediaSection);
  var hasRed = description.fecMechanisms.indexOf('RED') !== -1;
  var hasUlpfec = description.fecMechanisms.indexOf('ULPFEC') !== -1;

  // filter a=ssrc:... cname:, ignore PlanB-msid
  var ssrcs = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
    .map(function(line) {
      return SDPUtils.parseSsrcMedia(line);
    })
    .filter(function(parts) {
      return parts.attribute === 'cname';
    });
  var primarySsrc = ssrcs.length > 0 && ssrcs[0].ssrc;
  var secondarySsrc;

  var flows = SDPUtils.matchPrefix(mediaSection, 'a=ssrc-group:FID')
    .map(function(line) {
      var parts = line.substr(17).split(' ');
      return parts.map(function(part) {
        return parseInt(part, 10);
      });
    });
  if (flows.length > 0 && flows[0].length > 1 && flows[0][0] === primarySsrc) {
    secondarySsrc = flows[0][1];
  }

  description.codecs.forEach(function(codec) {
    if (codec.name.toUpperCase() === 'RTX' && codec.parameters.apt) {
      var encParam = {
        ssrc: primarySsrc,
        codecPayloadType: parseInt(codec.parameters.apt, 10)
      };
      if (primarySsrc && secondarySsrc) {
        encParam.rtx = {ssrc: secondarySsrc};
      }
      encodingParameters.push(encParam);
      if (hasRed) {
        encParam = JSON.parse(JSON.stringify(encParam));
        encParam.fec = {
          ssrc: primarySsrc,
          mechanism: hasUlpfec ? 'red+ulpfec' : 'red'
        };
        encodingParameters.push(encParam);
      }
    }
  });
  if (encodingParameters.length === 0 && primarySsrc) {
    encodingParameters.push({
      ssrc: primarySsrc
    });
  }

  // we support both b=AS and b=TIAS but interpret AS as TIAS.
  var bandwidth = SDPUtils.matchPrefix(mediaSection, 'b=');
  if (bandwidth.length) {
    if (bandwidth[0].indexOf('b=TIAS:') === 0) {
      bandwidth = parseInt(bandwidth[0].substr(7), 10);
    } else if (bandwidth[0].indexOf('b=AS:') === 0) {
      // use formula from JSEP to convert b=AS to TIAS value.
      bandwidth = parseInt(bandwidth[0].substr(5), 10) * 1000 * 0.95
          - (50 * 40 * 8);
    } else {
      bandwidth = undefined;
    }
    encodingParameters.forEach(function(params) {
      params.maxBitrate = bandwidth;
    });
  }
  return encodingParameters;
};

// parses http://draft.ortc.org/#rtcrtcpparameters*
SDPUtils.parseRtcpParameters = function(mediaSection) {
  var rtcpParameters = {};

  // Gets the first SSRC. Note tha with RTX there might be multiple
  // SSRCs.
  var remoteSsrc = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
    .map(function(line) {
      return SDPUtils.parseSsrcMedia(line);
    })
    .filter(function(obj) {
      return obj.attribute === 'cname';
    })[0];
  if (remoteSsrc) {
    rtcpParameters.cname = remoteSsrc.value;
    rtcpParameters.ssrc = remoteSsrc.ssrc;
  }

  // Edge uses the compound attribute instead of reducedSize
  // compound is !reducedSize
  var rsize = SDPUtils.matchPrefix(mediaSection, 'a=rtcp-rsize');
  rtcpParameters.reducedSize = rsize.length > 0;
  rtcpParameters.compound = rsize.length === 0;

  // parses the rtcp-mux attrіbute.
  // Note that Edge does not support unmuxed RTCP.
  var mux = SDPUtils.matchPrefix(mediaSection, 'a=rtcp-mux');
  rtcpParameters.mux = mux.length > 0;

  return rtcpParameters;
};

// parses either a=msid: or a=ssrc:... msid lines and returns
// the id of the MediaStream and MediaStreamTrack.
SDPUtils.parseMsid = function(mediaSection) {
  var parts;
  var spec = SDPUtils.matchPrefix(mediaSection, 'a=msid:');
  if (spec.length === 1) {
    parts = spec[0].substr(7).split(' ');
    return {stream: parts[0], track: parts[1]};
  }
  var planB = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
    .map(function(line) {
      return SDPUtils.parseSsrcMedia(line);
    })
    .filter(function(msidParts) {
      return msidParts.attribute === 'msid';
    });
  if (planB.length > 0) {
    parts = planB[0].value.split(' ');
    return {stream: parts[0], track: parts[1]};
  }
};

// SCTP
// parses draft-ietf-mmusic-sctp-sdp-26 first and falls back
// to draft-ietf-mmusic-sctp-sdp-05
SDPUtils.parseSctpDescription = function(mediaSection) {
  var mline = SDPUtils.parseMLine(mediaSection);
  var maxSizeLine = SDPUtils.matchPrefix(mediaSection, 'a=max-message-size:');
  var maxMessageSize;
  if (maxSizeLine.length > 0) {
    maxMessageSize = parseInt(maxSizeLine[0].substr(19), 10);
  }
  if (isNaN(maxMessageSize)) {
    maxMessageSize = 65536;
  }
  var sctpPort = SDPUtils.matchPrefix(mediaSection, 'a=sctp-port:');
  if (sctpPort.length > 0) {
    return {
      port: parseInt(sctpPort[0].substr(12), 10),
      protocol: mline.fmt,
      maxMessageSize: maxMessageSize
    };
  }
  var sctpMapLines = SDPUtils.matchPrefix(mediaSection, 'a=sctpmap:');
  if (sctpMapLines.length > 0) {
    var parts = SDPUtils.matchPrefix(mediaSection, 'a=sctpmap:')[0]
      .substr(10)
      .split(' ');
    return {
      port: parseInt(parts[0], 10),
      protocol: parts[1],
      maxMessageSize: maxMessageSize
    };
  }
};

// SCTP
// outputs the draft-ietf-mmusic-sctp-sdp-26 version that all browsers
// support by now receiving in this format, unless we originally parsed
// as the draft-ietf-mmusic-sctp-sdp-05 format (indicated by the m-line
// protocol of DTLS/SCTP -- without UDP/ or TCP/)
SDPUtils.writeSctpDescription = function(media, sctp) {
  var output = [];
  if (media.protocol !== 'DTLS/SCTP') {
    output = [
      'm=' + media.kind + ' 9 ' + media.protocol + ' ' + sctp.protocol + '\r\n',
      'c=IN IP4 0.0.0.0\r\n',
      'a=sctp-port:' + sctp.port + '\r\n'
    ];
  } else {
    output = [
      'm=' + media.kind + ' 9 ' + media.protocol + ' ' + sctp.port + '\r\n',
      'c=IN IP4 0.0.0.0\r\n',
      'a=sctpmap:' + sctp.port + ' ' + sctp.protocol + ' 65535\r\n'
    ];
  }
  if (sctp.maxMessageSize !== undefined) {
    output.push('a=max-message-size:' + sctp.maxMessageSize + '\r\n');
  }
  return output.join('');
};

// Generate a session ID for SDP.
// https://tools.ietf.org/html/draft-ietf-rtcweb-jsep-20#section-5.2.1
// recommends using a cryptographically random +ve 64-bit value
// but right now this should be acceptable and within the right range
SDPUtils.generateSessionId = function() {
  return Math.random().toString().substr(2, 21);
};

// Write boilder plate for start of SDP
// sessId argument is optional - if not supplied it will
// be generated randomly
// sessVersion is optional and defaults to 2
// sessUser is optional and defaults to 'thisisadapterortc'
SDPUtils.writeSessionBoilerplate = function(sessId, sessVer, sessUser) {
  var sessionId;
  var version = sessVer !== undefined ? sessVer : 2;
  if (sessId) {
    sessionId = sessId;
  } else {
    sessionId = SDPUtils.generateSessionId();
  }
  var user = sessUser || 'thisisadapterortc';
  // FIXME: sess-id should be an NTP timestamp.
  return 'v=0\r\n' +
      'o=' + user + ' ' + sessionId + ' ' + version +
        ' IN IP4 127.0.0.1\r\n' +
      's=-\r\n' +
      't=0 0\r\n';
};

SDPUtils.writeMediaSection = function(transceiver, caps, type, stream) {
  var sdp = SDPUtils.writeRtpDescription(transceiver.kind, caps);

  // Map ICE parameters (ufrag, pwd) to SDP.
  sdp += SDPUtils.writeIceParameters(
    transceiver.iceGatherer.getLocalParameters());

  // Map DTLS parameters to SDP.
  sdp += SDPUtils.writeDtlsParameters(
    transceiver.dtlsTransport.getLocalParameters(),
    type === 'offer' ? 'actpass' : 'active');

  sdp += 'a=mid:' + transceiver.mid + '\r\n';

  if (transceiver.direction) {
    sdp += 'a=' + transceiver.direction + '\r\n';
  } else if (transceiver.rtpSender && transceiver.rtpReceiver) {
    sdp += 'a=sendrecv\r\n';
  } else if (transceiver.rtpSender) {
    sdp += 'a=sendonly\r\n';
  } else if (transceiver.rtpReceiver) {
    sdp += 'a=recvonly\r\n';
  } else {
    sdp += 'a=inactive\r\n';
  }

  if (transceiver.rtpSender) {
    // spec.
    var msid = 'msid:' + stream.id + ' ' +
        transceiver.rtpSender.track.id + '\r\n';
    sdp += 'a=' + msid;

    // for Chrome.
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
        ' ' + msid;
    if (transceiver.sendEncodingParameters[0].rtx) {
      sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
          ' ' + msid;
      sdp += 'a=ssrc-group:FID ' +
          transceiver.sendEncodingParameters[0].ssrc + ' ' +
          transceiver.sendEncodingParameters[0].rtx.ssrc +
          '\r\n';
    }
  }
  // FIXME: this should be written by writeRtpDescription.
  sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
      ' cname:' + SDPUtils.localCName + '\r\n';
  if (transceiver.rtpSender && transceiver.sendEncodingParameters[0].rtx) {
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
        ' cname:' + SDPUtils.localCName + '\r\n';
  }
  return sdp;
};

// Gets the direction from the mediaSection or the sessionpart.
SDPUtils.getDirection = function(mediaSection, sessionpart) {
  // Look for sendrecv, sendonly, recvonly, inactive, default to sendrecv.
  var lines = SDPUtils.splitLines(mediaSection);
  for (var i = 0; i < lines.length; i++) {
    switch (lines[i]) {
      case 'a=sendrecv':
      case 'a=sendonly':
      case 'a=recvonly':
      case 'a=inactive':
        return lines[i].substr(2);
      default:
        // FIXME: What should happen here?
    }
  }
  if (sessionpart) {
    return SDPUtils.getDirection(sessionpart);
  }
  return 'sendrecv';
};

SDPUtils.getKind = function(mediaSection) {
  var lines = SDPUtils.splitLines(mediaSection);
  var mline = lines[0].split(' ');
  return mline[0].substr(2);
};

SDPUtils.isRejected = function(mediaSection) {
  return mediaSection.split(' ', 2)[1] === '0';
};

SDPUtils.parseMLine = function(mediaSection) {
  var lines = SDPUtils.splitLines(mediaSection);
  var parts = lines[0].substr(2).split(' ');
  return {
    kind: parts[0],
    port: parseInt(parts[1], 10),
    protocol: parts[2],
    fmt: parts.slice(3).join(' ')
  };
};

SDPUtils.parseOLine = function(mediaSection) {
  var line = SDPUtils.matchPrefix(mediaSection, 'o=')[0];
  var parts = line.substr(2).split(' ');
  return {
    username: parts[0],
    sessionId: parts[1],
    sessionVersion: parseInt(parts[2], 10),
    netType: parts[3],
    addressType: parts[4],
    address: parts[5]
  };
};

// a very naive interpretation of a valid SDP.
SDPUtils.isValidSDP = function(blob) {
  if (typeof blob !== 'string' || blob.length === 0) {
    return false;
  }
  var lines = SDPUtils.splitLines(blob);
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].length < 2 || lines[i].charAt(1) !== '=') {
      return false;
    }
    // TODO: check the modifier a bit more.
  }
  return true;
};

// Expose public methods.
if (true) {
  module.exports = SDPUtils;
}


/***/ }),

/***/ "./lib/adapter.ts":
/*!************************!*\
  !*** ./lib/adapter.ts ***!
  \************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.webRTCAdapter = void 0;
var webrtc_adapter_1 = __webpack_require__(/*! webrtc-adapter */ "./node_modules/webrtc-adapter/src/js/adapter_core.js");
exports.webRTCAdapter = webrtc_adapter_1.default;


/***/ }),

/***/ "./lib/api.ts":
/*!********************!*\
  !*** ./lib/api.ts ***!
  \********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.API = void 0;
var util_1 = __webpack_require__(/*! ./util */ "./lib/util.ts");
var logger_1 = __webpack_require__(/*! ./logger */ "./lib/logger.ts");
var API = /** @class */ (function () {
    function API(_options) {
        this._options = _options;
    }
    API.prototype._buildUrl = function (method) {
        var protocol = this._options.secure ? "https://" : "http://";
        var url = protocol +
            this._options.host +
            ":" +
            this._options.port +
            this._options.path +
            this._options.key +
            "/" +
            method;
        var queryString = "?ts=" + new Date().getTime() + "" + Math.random();
        url += queryString;
        return url;
    };
    /** Get a unique ID from the server via XHR and initialize with it. */
    API.prototype.retrieveId = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, error_1, pathError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this._buildUrl("id");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fetch(url)];
                    case 2:
                        response = _a.sent();
                        if (response.status !== 200) {
                            throw new Error("Error. Status:" + response.status);
                        }
                        return [2 /*return*/, response.text()];
                    case 3:
                        error_1 = _a.sent();
                        logger_1.default.error("Error retrieving ID", error_1);
                        pathError = "";
                        if (this._options.path === "/" &&
                            this._options.host !== util_1.util.CLOUD_HOST) {
                            pathError =
                                " If you passed in a `path` to your self-hosted PeerServer, " +
                                    "you'll also need to pass in that same path when creating a new " +
                                    "Peer.";
                        }
                        throw new Error("Could not get an ID from the server." + pathError);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /** @deprecated */
    API.prototype.listAllPeers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, helpfulError, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this._buildUrl("peers");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fetch(url)];
                    case 2:
                        response = _a.sent();
                        if (response.status !== 200) {
                            if (response.status === 401) {
                                helpfulError = "";
                                if (this._options.host === util_1.util.CLOUD_HOST) {
                                    helpfulError =
                                        "It looks like you're using the cloud server. You can email " +
                                            "team@peerjs.com to enable peer listing for your API key.";
                                }
                                else {
                                    helpfulError =
                                        "You need to enable `allow_discovery` on your self-hosted " +
                                            "PeerServer to use this feature.";
                                }
                                throw new Error("It doesn't look like you have permission to list peers IDs. " +
                                    helpfulError);
                            }
                            throw new Error("Error. Status:" + response.status);
                        }
                        return [2 /*return*/, response.json()];
                    case 3:
                        error_2 = _a.sent();
                        logger_1.default.error("Error retrieving list peers", error_2);
                        throw new Error("Could not get list peers from the server." + error_2);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return API;
}());
exports.API = API;


/***/ }),

/***/ "./lib/baseconnection.ts":
/*!*******************************!*\
  !*** ./lib/baseconnection.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BaseConnection = void 0;
var eventemitter3_1 = __webpack_require__(/*! eventemitter3 */ "./node_modules/eventemitter3/index.js");
var BaseConnection = /** @class */ (function (_super) {
    __extends(BaseConnection, _super);
    function BaseConnection(peer, provider, options) {
        var _this = _super.call(this) || this;
        _this.peer = peer;
        _this.provider = provider;
        _this.options = options;
        _this._open = false;
        _this.metadata = options.metadata;
        return _this;
    }
    Object.defineProperty(BaseConnection.prototype, "open", {
        get: function () {
            return this._open;
        },
        enumerable: false,
        configurable: true
    });
    return BaseConnection;
}(eventemitter3_1.EventEmitter));
exports.BaseConnection = BaseConnection;


/***/ }),

/***/ "./lib/dataconnection.ts":
/*!*******************************!*\
  !*** ./lib/dataconnection.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DataConnection = void 0;
var util_1 = __webpack_require__(/*! ./util */ "./lib/util.ts");
var logger_1 = __webpack_require__(/*! ./logger */ "./lib/logger.ts");
var negotiator_1 = __webpack_require__(/*! ./negotiator */ "./lib/negotiator.ts");
var enums_1 = __webpack_require__(/*! ./enums */ "./lib/enums.ts");
var baseconnection_1 = __webpack_require__(/*! ./baseconnection */ "./lib/baseconnection.ts");
var encodingQueue_1 = __webpack_require__(/*! ./encodingQueue */ "./lib/encodingQueue.ts");
/**
 * Wraps a DataChannel between two Peers.
 */
var DataConnection = /** @class */ (function (_super) {
    __extends(DataConnection, _super);
    function DataConnection(peerId, provider, options) {
        var _this = _super.call(this, peerId, provider, options) || this;
        _this.stringify = JSON.stringify;
        _this.parse = JSON.parse;
        _this._buffer = [];
        _this._bufferSize = 0;
        _this._buffering = false;
        _this._chunkedData = {};
        _this._encodingQueue = new encodingQueue_1.EncodingQueue();
        _this.connectionId =
            _this.options.connectionId || DataConnection.ID_PREFIX + util_1.util.randomToken();
        _this.label = _this.options.label || _this.connectionId;
        _this.serialization = _this.options.serialization || enums_1.SerializationType.Binary;
        _this.reliable = !!_this.options.reliable;
        _this._encodingQueue.on('done', function (ab) {
            _this._bufferedSend(ab);
        });
        _this._encodingQueue.on('error', function () {
            logger_1.default.error("DC#" + _this.connectionId + ": Error occured in encoding from blob to arraybuffer, close DC");
            _this.close();
        });
        _this._negotiator = new negotiator_1.Negotiator(_this);
        _this._negotiator.startConnection(_this.options._payload || {
            originator: true
        });
        return _this;
    }
    Object.defineProperty(DataConnection.prototype, "type", {
        get: function () {
            return enums_1.ConnectionType.Data;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DataConnection.prototype, "dataChannel", {
        get: function () {
            return this._dc;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DataConnection.prototype, "bufferSize", {
        get: function () { return this._bufferSize; },
        enumerable: false,
        configurable: true
    });
    /** Called by the Negotiator when the DataChannel is ready. */
    DataConnection.prototype.initialize = function (dc) {
        this._dc = dc;
        this._configureDataChannel();
    };
    DataConnection.prototype._configureDataChannel = function () {
        var _this = this;
        if (!util_1.util.supports.binaryBlob || util_1.util.supports.reliable) {
            this.dataChannel.binaryType = "arraybuffer";
        }
        this.dataChannel.onopen = function () {
            logger_1.default.log("DC#" + _this.connectionId + " dc connection success");
            _this._open = true;
            _this.emit(enums_1.ConnectionEventType.Open);
        };
        this.dataChannel.onmessage = function (e) {
            logger_1.default.log("DC#" + _this.connectionId + " dc onmessage:", e.data);
            _this._handleDataMessage(e);
        };
        this.dataChannel.onclose = function () {
            logger_1.default.log("DC#" + _this.connectionId + " dc closed for:", _this.peer);
            _this.close();
        };
    };
    // Handles a DataChannel message.
    DataConnection.prototype._handleDataMessage = function (_a) {
        var _this = this;
        var data = _a.data;
        var datatype = data.constructor;
        var isBinarySerialization = this.serialization === enums_1.SerializationType.Binary ||
            this.serialization === enums_1.SerializationType.BinaryUTF8;
        var deserializedData = data;
        if (isBinarySerialization) {
            if (datatype === Blob) {
                // Datatype should never be blob
                util_1.util.blobToArrayBuffer(data, function (ab) {
                    var unpackedData = util_1.util.unpack(ab);
                    _this.emit(enums_1.ConnectionEventType.Data, unpackedData);
                });
                return;
            }
            else if (datatype === ArrayBuffer) {
                deserializedData = util_1.util.unpack(data);
            }
            else if (datatype === String) {
                // String fallback for binary data for browsers that don't support binary yet
                var ab = util_1.util.binaryStringToArrayBuffer(data);
                deserializedData = util_1.util.unpack(ab);
            }
        }
        else if (this.serialization === enums_1.SerializationType.JSON) {
            deserializedData = this.parse(data);
        }
        // Check if we've chunked--if so, piece things back together.
        // We're guaranteed that this isn't 0.
        if (deserializedData.__peerData) {
            this._handleChunk(deserializedData);
            return;
        }
        _super.prototype.emit.call(this, enums_1.ConnectionEventType.Data, deserializedData);
    };
    DataConnection.prototype._handleChunk = function (data) {
        var id = data.__peerData;
        var chunkInfo = this._chunkedData[id] || {
            data: [],
            count: 0,
            total: data.total
        };
        chunkInfo.data[data.n] = data.data;
        chunkInfo.count++;
        this._chunkedData[id] = chunkInfo;
        if (chunkInfo.total === chunkInfo.count) {
            // Clean up before making the recursive call to `_handleDataMessage`.
            delete this._chunkedData[id];
            // We've received all the chunks--time to construct the complete data.
            var data_1 = new Blob(chunkInfo.data);
            this._handleDataMessage({ data: data_1 });
        }
    };
    /**
     * Exposed functionality for users.
     */
    /** Allows user to close connection. */
    DataConnection.prototype.close = function () {
        this._buffer = [];
        this._bufferSize = 0;
        this._chunkedData = {};
        if (this._negotiator) {
            this._negotiator.cleanup();
            this._negotiator = null;
        }
        if (this.provider) {
            this.provider._removeConnection(this);
            this.provider = null;
        }
        if (this.dataChannel) {
            this.dataChannel.onopen = null;
            this.dataChannel.onmessage = null;
            this.dataChannel.onclose = null;
            this._dc = null;
        }
        if (this._encodingQueue) {
            this._encodingQueue.destroy();
            this._encodingQueue.removeAllListeners();
            this._encodingQueue = null;
        }
        if (!this.open) {
            return;
        }
        this._open = false;
        _super.prototype.emit.call(this, enums_1.ConnectionEventType.Close);
    };
    /** Allows user to send data. */
    DataConnection.prototype.send = function (data, chunked) {
        if (!this.open) {
            _super.prototype.emit.call(this, enums_1.ConnectionEventType.Error, new Error("Connection is not open. You should listen for the `open` event before sending messages."));
            return;
        }
        if (this.serialization === enums_1.SerializationType.JSON) {
            this._bufferedSend(this.stringify(data));
        }
        else if (this.serialization === enums_1.SerializationType.Binary ||
            this.serialization === enums_1.SerializationType.BinaryUTF8) {
            var blob = util_1.util.pack(data);
            if (!chunked && blob.size > util_1.util.chunkedMTU) {
                this._sendChunks(blob);
                return;
            }
            if (!util_1.util.supports.binaryBlob) {
                // We only do this if we really need to (e.g. blobs are not supported),
                // because this conversion is costly.
                this._encodingQueue.enque(blob);
            }
            else {
                this._bufferedSend(blob);
            }
        }
        else {
            this._bufferedSend(data);
        }
    };
    DataConnection.prototype._bufferedSend = function (msg) {
        if (this._buffering || !this._trySend(msg)) {
            this._buffer.push(msg);
            this._bufferSize = this._buffer.length;
        }
    };
    // Returns true if the send succeeds.
    DataConnection.prototype._trySend = function (msg) {
        var _this = this;
        if (!this.open) {
            return false;
        }
        if (this.dataChannel.bufferedAmount > DataConnection.MAX_BUFFERED_AMOUNT) {
            this._buffering = true;
            setTimeout(function () {
                _this._buffering = false;
                _this._tryBuffer();
            }, 50);
            return false;
        }
        try {
            this.dataChannel.send(msg);
        }
        catch (e) {
            logger_1.default.error("DC#:" + this.connectionId + " Error when sending:", e);
            this._buffering = true;
            this.close();
            return false;
        }
        return true;
    };
    // Try to send the first message in the buffer.
    DataConnection.prototype._tryBuffer = function () {
        if (!this.open) {
            return;
        }
        if (this._buffer.length === 0) {
            return;
        }
        var msg = this._buffer[0];
        if (this._trySend(msg)) {
            this._buffer.shift();
            this._bufferSize = this._buffer.length;
            this._tryBuffer();
        }
    };
    DataConnection.prototype._sendChunks = function (blob) {
        var e_1, _a;
        var blobs = util_1.util.chunk(blob);
        logger_1.default.log("DC#" + this.connectionId + " Try to send " + blobs.length + " chunks...");
        try {
            for (var blobs_1 = __values(blobs), blobs_1_1 = blobs_1.next(); !blobs_1_1.done; blobs_1_1 = blobs_1.next()) {
                var blob_1 = blobs_1_1.value;
                this.send(blob_1, true);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (blobs_1_1 && !blobs_1_1.done && (_a = blobs_1.return)) _a.call(blobs_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    DataConnection.prototype.handleMessage = function (message) {
        var payload = message.payload;
        switch (message.type) {
            case enums_1.ServerMessageType.Answer:
                this._negotiator.handleSDP(message.type, payload.sdp);
                break;
            case enums_1.ServerMessageType.Candidate:
                this._negotiator.handleCandidate(payload.candidate);
                break;
            default:
                logger_1.default.warn("Unrecognized message type:", message.type, "from peer:", this.peer);
                break;
        }
    };
    DataConnection.ID_PREFIX = "dc_";
    DataConnection.MAX_BUFFERED_AMOUNT = 8 * 1024 * 1024;
    return DataConnection;
}(baseconnection_1.BaseConnection));
exports.DataConnection = DataConnection;


/***/ }),

/***/ "./lib/encodingQueue.ts":
/*!******************************!*\
  !*** ./lib/encodingQueue.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EncodingQueue = void 0;
var eventemitter3_1 = __webpack_require__(/*! eventemitter3 */ "./node_modules/eventemitter3/index.js");
var logger_1 = __webpack_require__(/*! ./logger */ "./lib/logger.ts");
var EncodingQueue = /** @class */ (function (_super) {
    __extends(EncodingQueue, _super);
    function EncodingQueue() {
        var _this = _super.call(this) || this;
        _this.fileReader = new FileReader();
        _this._queue = [];
        _this._processing = false;
        _this.fileReader.onload = function (evt) {
            _this._processing = false;
            if (evt.target) {
                _this.emit('done', evt.target.result);
            }
            _this.doNextTask();
        };
        _this.fileReader.onerror = function (evt) {
            logger_1.default.error("EncodingQueue error:", evt);
            _this._processing = false;
            _this.destroy();
            _this.emit('error', evt);
        };
        return _this;
    }
    Object.defineProperty(EncodingQueue.prototype, "queue", {
        get: function () {
            return this._queue;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(EncodingQueue.prototype, "size", {
        get: function () {
            return this.queue.length;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(EncodingQueue.prototype, "processing", {
        get: function () {
            return this._processing;
        },
        enumerable: false,
        configurable: true
    });
    EncodingQueue.prototype.enque = function (blob) {
        this.queue.push(blob);
        if (this.processing)
            return;
        this.doNextTask();
    };
    EncodingQueue.prototype.destroy = function () {
        this.fileReader.abort();
        this._queue = [];
    };
    EncodingQueue.prototype.doNextTask = function () {
        if (this.size === 0)
            return;
        if (this.processing)
            return;
        this._processing = true;
        this.fileReader.readAsArrayBuffer(this.queue.shift());
    };
    return EncodingQueue;
}(eventemitter3_1.EventEmitter));
exports.EncodingQueue = EncodingQueue;


/***/ }),

/***/ "./lib/enums.ts":
/*!**********************!*\
  !*** ./lib/enums.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ServerMessageType = exports.SocketEventType = exports.SerializationType = exports.PeerErrorType = exports.PeerEventType = exports.ConnectionType = exports.ConnectionEventType = void 0;
var ConnectionEventType;
(function (ConnectionEventType) {
    ConnectionEventType["Open"] = "open";
    ConnectionEventType["Stream"] = "stream";
    ConnectionEventType["Data"] = "data";
    ConnectionEventType["Close"] = "close";
    ConnectionEventType["Error"] = "error";
    ConnectionEventType["IceStateChanged"] = "iceStateChanged";
})(ConnectionEventType = exports.ConnectionEventType || (exports.ConnectionEventType = {}));
var ConnectionType;
(function (ConnectionType) {
    ConnectionType["Data"] = "data";
    ConnectionType["Media"] = "media";
})(ConnectionType = exports.ConnectionType || (exports.ConnectionType = {}));
var PeerEventType;
(function (PeerEventType) {
    PeerEventType["Open"] = "open";
    PeerEventType["Close"] = "close";
    PeerEventType["Connection"] = "connection";
    PeerEventType["Call"] = "call";
    PeerEventType["Disconnected"] = "disconnected";
    PeerEventType["Error"] = "error";
})(PeerEventType = exports.PeerEventType || (exports.PeerEventType = {}));
var PeerErrorType;
(function (PeerErrorType) {
    PeerErrorType["BrowserIncompatible"] = "browser-incompatible";
    PeerErrorType["Disconnected"] = "disconnected";
    PeerErrorType["InvalidID"] = "invalid-id";
    PeerErrorType["InvalidKey"] = "invalid-key";
    PeerErrorType["Network"] = "network";
    PeerErrorType["PeerUnavailable"] = "peer-unavailable";
    PeerErrorType["SslUnavailable"] = "ssl-unavailable";
    PeerErrorType["ServerError"] = "server-error";
    PeerErrorType["SocketError"] = "socket-error";
    PeerErrorType["SocketClosed"] = "socket-closed";
    PeerErrorType["UnavailableID"] = "unavailable-id";
    PeerErrorType["WebRTC"] = "webrtc";
})(PeerErrorType = exports.PeerErrorType || (exports.PeerErrorType = {}));
var SerializationType;
(function (SerializationType) {
    SerializationType["Binary"] = "binary";
    SerializationType["BinaryUTF8"] = "binary-utf8";
    SerializationType["JSON"] = "json";
})(SerializationType = exports.SerializationType || (exports.SerializationType = {}));
var SocketEventType;
(function (SocketEventType) {
    SocketEventType["Message"] = "message";
    SocketEventType["Disconnected"] = "disconnected";
    SocketEventType["Error"] = "error";
    SocketEventType["Close"] = "close";
})(SocketEventType = exports.SocketEventType || (exports.SocketEventType = {}));
var ServerMessageType;
(function (ServerMessageType) {
    ServerMessageType["Heartbeat"] = "HEARTBEAT";
    ServerMessageType["Candidate"] = "CANDIDATE";
    ServerMessageType["Offer"] = "OFFER";
    ServerMessageType["Answer"] = "ANSWER";
    ServerMessageType["Open"] = "OPEN";
    ServerMessageType["Error"] = "ERROR";
    ServerMessageType["IdTaken"] = "ID-TAKEN";
    ServerMessageType["InvalidKey"] = "INVALID-KEY";
    ServerMessageType["Leave"] = "LEAVE";
    ServerMessageType["Expire"] = "EXPIRE"; // The offer sent to a peer has expired without response.
})(ServerMessageType = exports.ServerMessageType || (exports.ServerMessageType = {}));


/***/ }),

/***/ "./lib/exports.ts":
/*!************************!*\
  !*** ./lib/exports.ts ***!
  \************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.peerjs = void 0;
var util_1 = __webpack_require__(/*! ./util */ "./lib/util.ts");
var peer_1 = __webpack_require__(/*! ./peer */ "./lib/peer.ts");
exports.peerjs = {
    Peer: peer_1.Peer,
    util: util_1.util
};
exports["default"] = peer_1.Peer;
window.peerjs = exports.peerjs;
/** @deprecated Should use peerjs namespace */
window.Peer = peer_1.Peer;


/***/ }),

/***/ "./lib/logger.ts":
/*!***********************!*\
  !*** ./lib/logger.ts ***!
  \***********************/
/***/ (function(__unused_webpack_module, exports) {

"use strict";

var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LogLevel = void 0;
var LOG_PREFIX = 'PeerJS: ';
/*
Prints log messages depending on the debug level passed in. Defaults to 0.
0  Prints no logs.
1  Prints only errors.
2  Prints errors and warnings.
3  Prints all logs.
*/
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Disabled"] = 0] = "Disabled";
    LogLevel[LogLevel["Errors"] = 1] = "Errors";
    LogLevel[LogLevel["Warnings"] = 2] = "Warnings";
    LogLevel[LogLevel["All"] = 3] = "All";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
var Logger = /** @class */ (function () {
    function Logger() {
        this._logLevel = LogLevel.Disabled;
    }
    Object.defineProperty(Logger.prototype, "logLevel", {
        get: function () { return this._logLevel; },
        set: function (logLevel) { this._logLevel = logLevel; },
        enumerable: false,
        configurable: true
    });
    Logger.prototype.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this._logLevel >= LogLevel.All) {
            this._print.apply(this, __spreadArray([LogLevel.All], __read(args)));
        }
    };
    Logger.prototype.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this._logLevel >= LogLevel.Warnings) {
            this._print.apply(this, __spreadArray([LogLevel.Warnings], __read(args)));
        }
    };
    Logger.prototype.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this._logLevel >= LogLevel.Errors) {
            this._print.apply(this, __spreadArray([LogLevel.Errors], __read(args)));
        }
    };
    Logger.prototype.setLogFunction = function (fn) {
        this._print = fn;
    };
    Logger.prototype._print = function (logLevel) {
        var rest = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            rest[_i - 1] = arguments[_i];
        }
        var copy = __spreadArray([LOG_PREFIX], __read(rest));
        for (var i in copy) {
            if (copy[i] instanceof Error) {
                copy[i] = "(" + copy[i].name + ") " + copy[i].message;
            }
        }
        if (logLevel >= LogLevel.All) {
            console.log.apply(console, __spreadArray([], __read(copy)));
        }
        else if (logLevel >= LogLevel.Warnings) {
            console.warn.apply(console, __spreadArray(["WARNING"], __read(copy)));
        }
        else if (logLevel >= LogLevel.Errors) {
            console.error.apply(console, __spreadArray(["ERROR"], __read(copy)));
        }
    };
    return Logger;
}());
exports["default"] = new Logger();


/***/ }),

/***/ "./lib/mediaconnection.ts":
/*!********************************!*\
  !*** ./lib/mediaconnection.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MediaConnection = void 0;
var util_1 = __webpack_require__(/*! ./util */ "./lib/util.ts");
var logger_1 = __webpack_require__(/*! ./logger */ "./lib/logger.ts");
var negotiator_1 = __webpack_require__(/*! ./negotiator */ "./lib/negotiator.ts");
var enums_1 = __webpack_require__(/*! ./enums */ "./lib/enums.ts");
var baseconnection_1 = __webpack_require__(/*! ./baseconnection */ "./lib/baseconnection.ts");
/**
 * Wraps the streaming interface between two Peers.
 */
var MediaConnection = /** @class */ (function (_super) {
    __extends(MediaConnection, _super);
    function MediaConnection(peerId, provider, options) {
        var _this = _super.call(this, peerId, provider, options) || this;
        _this._localStream = _this.options._stream;
        _this.connectionId =
            _this.options.connectionId ||
                MediaConnection.ID_PREFIX + util_1.util.randomToken();
        _this._negotiator = new negotiator_1.Negotiator(_this);
        if (_this._localStream) {
            _this._negotiator.startConnection({
                _stream: _this._localStream,
                originator: true
            });
        }
        return _this;
    }
    Object.defineProperty(MediaConnection.prototype, "type", {
        get: function () {
            return enums_1.ConnectionType.Media;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MediaConnection.prototype, "localStream", {
        get: function () { return this._localStream; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MediaConnection.prototype, "remoteStream", {
        get: function () { return this._remoteStream; },
        enumerable: false,
        configurable: true
    });
    MediaConnection.prototype.addStream = function (remoteStream) {
        logger_1.default.log("Receiving stream", remoteStream);
        this._remoteStream = remoteStream;
        _super.prototype.emit.call(this, enums_1.ConnectionEventType.Stream, remoteStream); // Should we call this `open`?
    };
    MediaConnection.prototype.handleMessage = function (message) {
        var type = message.type;
        var payload = message.payload;
        switch (message.type) {
            case enums_1.ServerMessageType.Answer:
                // Forward to negotiator
                this._negotiator.handleSDP(type, payload.sdp);
                this._open = true;
                break;
            case enums_1.ServerMessageType.Candidate:
                this._negotiator.handleCandidate(payload.candidate);
                break;
            default:
                logger_1.default.warn("Unrecognized message type:" + type + " from peer:" + this.peer);
                break;
        }
    };
    MediaConnection.prototype.answer = function (stream, options) {
        var e_1, _a;
        if (options === void 0) { options = {}; }
        if (this._localStream) {
            logger_1.default.warn("Local stream already exists on this MediaConnection. Are you answering a call twice?");
            return;
        }
        this._localStream = stream;
        if (options && options.sdpTransform) {
            this.options.sdpTransform = options.sdpTransform;
        }
        this._negotiator.startConnection(__assign(__assign({}, this.options._payload), { _stream: stream }));
        // Retrieve lost messages stored because PeerConnection not set up.
        var messages = this.provider._getMessages(this.connectionId);
        try {
            for (var messages_1 = __values(messages), messages_1_1 = messages_1.next(); !messages_1_1.done; messages_1_1 = messages_1.next()) {
                var message = messages_1_1.value;
                this.handleMessage(message);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (messages_1_1 && !messages_1_1.done && (_a = messages_1.return)) _a.call(messages_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        this._open = true;
    };
    /**
     * Exposed functionality for users.
     */
    /** Allows user to close connection. */
    MediaConnection.prototype.close = function () {
        if (this._negotiator) {
            this._negotiator.cleanup();
            this._negotiator = null;
        }
        this._localStream = null;
        this._remoteStream = null;
        if (this.provider) {
            this.provider._removeConnection(this);
            this.provider = null;
        }
        if (this.options && this.options._stream) {
            this.options._stream = null;
        }
        if (!this.open) {
            return;
        }
        this._open = false;
        _super.prototype.emit.call(this, enums_1.ConnectionEventType.Close);
    };
    MediaConnection.ID_PREFIX = "mc_";
    return MediaConnection;
}(baseconnection_1.BaseConnection));
exports.MediaConnection = MediaConnection;


/***/ }),

/***/ "./lib/negotiator.ts":
/*!***************************!*\
  !*** ./lib/negotiator.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Negotiator = void 0;
var util_1 = __webpack_require__(/*! ./util */ "./lib/util.ts");
var logger_1 = __webpack_require__(/*! ./logger */ "./lib/logger.ts");
var enums_1 = __webpack_require__(/*! ./enums */ "./lib/enums.ts");
/**
 * Manages all negotiations between Peers.
 */
var Negotiator = /** @class */ (function () {
    function Negotiator(connection) {
        this.connection = connection;
    }
    /** Returns a PeerConnection object set up correctly (for data, media). */
    Negotiator.prototype.startConnection = function (options) {
        var peerConnection = this._startPeerConnection();
        // Set the connection's PC.
        this.connection.peerConnection = peerConnection;
        if (this.connection.type === enums_1.ConnectionType.Media && options._stream) {
            this._addTracksToConnection(options._stream, peerConnection);
        }
        // What do we need to do now?
        if (options.originator) {
            if (this.connection.type === enums_1.ConnectionType.Data) {
                var dataConnection = this.connection;
                var config = { ordered: !!options.reliable };
                var dataChannel = peerConnection.createDataChannel(dataConnection.label, config);
                dataConnection.initialize(dataChannel);
            }
            this._makeOffer();
        }
        else {
            this.handleSDP("OFFER", options.sdp);
        }
    };
    /** Start a PC. */
    Negotiator.prototype._startPeerConnection = function () {
        logger_1.default.log("Creating RTCPeerConnection.");
        var peerConnection = new RTCPeerConnection(this.connection.provider.options.config);
        this._setupListeners(peerConnection);
        return peerConnection;
    };
    /** Set up various WebRTC listeners. */
    Negotiator.prototype._setupListeners = function (peerConnection) {
        var _this = this;
        var peerId = this.connection.peer;
        var connectionId = this.connection.connectionId;
        var connectionType = this.connection.type;
        var provider = this.connection.provider;
        // ICE CANDIDATES.
        logger_1.default.log("Listening for ICE candidates.");
        peerConnection.onicecandidate = function (evt) {
            if (!evt.candidate || !evt.candidate.candidate)
                return;
            logger_1.default.log("Received ICE candidates for " + peerId + ":", evt.candidate);
            provider.socket.send({
                type: enums_1.ServerMessageType.Candidate,
                payload: {
                    candidate: evt.candidate,
                    type: connectionType,
                    connectionId: connectionId
                },
                dst: peerId
            });
        };
        peerConnection.oniceconnectionstatechange = function () {
            switch (peerConnection.iceConnectionState) {
                case "failed":
                    logger_1.default.log("iceConnectionState is failed, closing connections to " +
                        peerId);
                    _this.connection.emit(enums_1.ConnectionEventType.Error, new Error("Negotiation of connection to " + peerId + " failed."));
                    _this.connection.close();
                    break;
                case "closed":
                    logger_1.default.log("iceConnectionState is closed, closing connections to " +
                        peerId);
                    _this.connection.emit(enums_1.ConnectionEventType.Error, new Error("Connection to " + peerId + " closed."));
                    _this.connection.close();
                    break;
                case "disconnected":
                    logger_1.default.log("iceConnectionState changed to disconnected on the connection with " +
                        peerId);
                    break;
                case "completed":
                    peerConnection.onicecandidate = util_1.util.noop;
                    break;
            }
            _this.connection.emit(enums_1.ConnectionEventType.IceStateChanged, peerConnection.iceConnectionState);
        };
        // DATACONNECTION.
        logger_1.default.log("Listening for data channel");
        // Fired between offer and answer, so options should already be saved
        // in the options hash.
        peerConnection.ondatachannel = function (evt) {
            logger_1.default.log("Received data channel");
            var dataChannel = evt.channel;
            var connection = (provider.getConnection(peerId, connectionId));
            connection.initialize(dataChannel);
        };
        // MEDIACONNECTION.
        logger_1.default.log("Listening for remote stream");
        peerConnection.ontrack = function (evt) {
            logger_1.default.log("Received remote stream");
            var stream = evt.streams[0];
            var connection = provider.getConnection(peerId, connectionId);
            if (connection.type === enums_1.ConnectionType.Media) {
                var mediaConnection = connection;
                _this._addStreamToMediaConnection(stream, mediaConnection);
            }
        };
    };
    Negotiator.prototype.cleanup = function () {
        logger_1.default.log("Cleaning up PeerConnection to " + this.connection.peer);
        var peerConnection = this.connection.peerConnection;
        if (!peerConnection) {
            return;
        }
        this.connection.peerConnection = null;
        //unsubscribe from all PeerConnection's events
        peerConnection.onicecandidate = peerConnection.oniceconnectionstatechange = peerConnection.ondatachannel = peerConnection.ontrack = function () { };
        var peerConnectionNotClosed = peerConnection.signalingState !== "closed";
        var dataChannelNotClosed = false;
        if (this.connection.type === enums_1.ConnectionType.Data) {
            var dataConnection = this.connection;
            var dataChannel = dataConnection.dataChannel;
            if (dataChannel) {
                dataChannelNotClosed = !!dataChannel.readyState && dataChannel.readyState !== "closed";
            }
        }
        if (peerConnectionNotClosed || dataChannelNotClosed) {
            peerConnection.close();
        }
    };
    Negotiator.prototype._makeOffer = function () {
        return __awaiter(this, void 0, void 0, function () {
            var peerConnection, provider, offer, payload, dataConnection, err_2, err_1_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        peerConnection = this.connection.peerConnection;
                        provider = this.connection.provider;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, peerConnection.createOffer(this.connection.options.constraints)];
                    case 2:
                        offer = _a.sent();
                        logger_1.default.log("Created offer.");
                        if (this.connection.options.sdpTransform && typeof this.connection.options.sdpTransform === 'function') {
                            offer.sdp = this.connection.options.sdpTransform(offer.sdp) || offer.sdp;
                        }
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, peerConnection.setLocalDescription(offer)];
                    case 4:
                        _a.sent();
                        logger_1.default.log("Set localDescription:", offer, "for:" + this.connection.peer);
                        payload = {
                            sdp: offer,
                            type: this.connection.type,
                            connectionId: this.connection.connectionId,
                            metadata: this.connection.metadata,
                            browser: util_1.util.browser
                        };
                        if (this.connection.type === enums_1.ConnectionType.Data) {
                            dataConnection = this.connection;
                            payload = __assign(__assign({}, payload), { label: dataConnection.label, reliable: dataConnection.reliable, serialization: dataConnection.serialization });
                        }
                        provider.socket.send({
                            type: enums_1.ServerMessageType.Offer,
                            payload: payload,
                            dst: this.connection.peer
                        });
                        return [3 /*break*/, 6];
                    case 5:
                        err_2 = _a.sent();
                        // TODO: investigate why _makeOffer is being called from the answer
                        if (err_2 !=
                            "OperationError: Failed to set local offer sdp: Called in wrong state: kHaveRemoteOffer") {
                            provider.emitError(enums_1.PeerErrorType.WebRTC, err_2);
                            logger_1.default.log("Failed to setLocalDescription, ", err_2);
                        }
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        err_1_1 = _a.sent();
                        provider.emitError(enums_1.PeerErrorType.WebRTC, err_1_1);
                        logger_1.default.log("Failed to createOffer, ", err_1_1);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    Negotiator.prototype._makeAnswer = function () {
        return __awaiter(this, void 0, void 0, function () {
            var peerConnection, provider, answer, err_3, err_1_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        peerConnection = this.connection.peerConnection;
                        provider = this.connection.provider;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, peerConnection.createAnswer()];
                    case 2:
                        answer = _a.sent();
                        logger_1.default.log("Created answer.");
                        if (this.connection.options.sdpTransform && typeof this.connection.options.sdpTransform === 'function') {
                            answer.sdp = this.connection.options.sdpTransform(answer.sdp) || answer.sdp;
                        }
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, peerConnection.setLocalDescription(answer)];
                    case 4:
                        _a.sent();
                        logger_1.default.log("Set localDescription:", answer, "for:" + this.connection.peer);
                        provider.socket.send({
                            type: enums_1.ServerMessageType.Answer,
                            payload: {
                                sdp: answer,
                                type: this.connection.type,
                                connectionId: this.connection.connectionId,
                                browser: util_1.util.browser
                            },
                            dst: this.connection.peer
                        });
                        return [3 /*break*/, 6];
                    case 5:
                        err_3 = _a.sent();
                        provider.emitError(enums_1.PeerErrorType.WebRTC, err_3);
                        logger_1.default.log("Failed to setLocalDescription, ", err_3);
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        err_1_2 = _a.sent();
                        provider.emitError(enums_1.PeerErrorType.WebRTC, err_1_2);
                        logger_1.default.log("Failed to create answer, ", err_1_2);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /** Handle an SDP. */
    Negotiator.prototype.handleSDP = function (type, sdp) {
        return __awaiter(this, void 0, void 0, function () {
            var peerConnection, provider, self, err_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sdp = new RTCSessionDescription(sdp);
                        peerConnection = this.connection.peerConnection;
                        provider = this.connection.provider;
                        logger_1.default.log("Setting remote description", sdp);
                        self = this;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, peerConnection.setRemoteDescription(sdp)];
                    case 2:
                        _a.sent();
                        logger_1.default.log("Set remoteDescription:" + type + " for:" + this.connection.peer);
                        if (!(type === "OFFER")) return [3 /*break*/, 4];
                        return [4 /*yield*/, self._makeAnswer()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        err_4 = _a.sent();
                        provider.emitError(enums_1.PeerErrorType.WebRTC, err_4);
                        logger_1.default.log("Failed to setRemoteDescription, ", err_4);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /** Handle a candidate. */
    Negotiator.prototype.handleCandidate = function (ice) {
        return __awaiter(this, void 0, void 0, function () {
            var candidate, sdpMLineIndex, sdpMid, peerConnection, provider, err_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger_1.default.log("handleCandidate:", ice);
                        candidate = ice.candidate;
                        sdpMLineIndex = ice.sdpMLineIndex;
                        sdpMid = ice.sdpMid;
                        peerConnection = this.connection.peerConnection;
                        provider = this.connection.provider;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, peerConnection.addIceCandidate(new RTCIceCandidate({
                                sdpMid: sdpMid,
                                sdpMLineIndex: sdpMLineIndex,
                                candidate: candidate
                            }))];
                    case 2:
                        _a.sent();
                        logger_1.default.log("Added ICE candidate for:" + this.connection.peer);
                        return [3 /*break*/, 4];
                    case 3:
                        err_5 = _a.sent();
                        provider.emitError(enums_1.PeerErrorType.WebRTC, err_5);
                        logger_1.default.log("Failed to handleCandidate, ", err_5);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Negotiator.prototype._addTracksToConnection = function (stream, peerConnection) {
        logger_1.default.log("add tracks from stream " + stream.id + " to peer connection");
        if (!peerConnection.addTrack) {
            return logger_1.default.error("Your browser does't support RTCPeerConnection#addTrack. Ignored.");
        }
        stream.getTracks().forEach(function (track) {
            peerConnection.addTrack(track, stream);
        });
    };
    Negotiator.prototype._addStreamToMediaConnection = function (stream, mediaConnection) {
        logger_1.default.log("add stream " + stream.id + " to media connection " + mediaConnection.connectionId);
        mediaConnection.addStream(stream);
    };
    return Negotiator;
}());
exports.Negotiator = Negotiator;


/***/ }),

/***/ "./lib/peer.ts":
/*!*********************!*\
  !*** ./lib/peer.ts ***!
  \*********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Peer = void 0;
var eventemitter3_1 = __webpack_require__(/*! eventemitter3 */ "./node_modules/eventemitter3/index.js");
var util_1 = __webpack_require__(/*! ./util */ "./lib/util.ts");
var logger_1 = __webpack_require__(/*! ./logger */ "./lib/logger.ts");
var socket_1 = __webpack_require__(/*! ./socket */ "./lib/socket.ts");
var mediaconnection_1 = __webpack_require__(/*! ./mediaconnection */ "./lib/mediaconnection.ts");
var dataconnection_1 = __webpack_require__(/*! ./dataconnection */ "./lib/dataconnection.ts");
var enums_1 = __webpack_require__(/*! ./enums */ "./lib/enums.ts");
var api_1 = __webpack_require__(/*! ./api */ "./lib/api.ts");
var PeerOptions = /** @class */ (function () {
    function PeerOptions() {
    }
    return PeerOptions;
}());
/**
 * A peer who can initiate connections with other peers.
 */
var Peer = /** @class */ (function (_super) {
    __extends(Peer, _super);
    function Peer(id, options) {
        var _this = _super.call(this) || this;
        _this._id = null;
        _this._lastServerId = null;
        // States.
        _this._destroyed = false; // Connections have been killed
        _this._disconnected = false; // Connection to PeerServer killed but P2P connections still active
        _this._open = false; // Sockets and such are not yet open.
        _this._connections = new Map(); // All connections for this peer.
        _this._lostMessages = new Map(); // src => [list of messages]
        var userId;
        // Deal with overloading
        if (id && id.constructor == Object) {
            options = id;
        }
        else if (id) {
            userId = id.toString();
        }
        // Configurize options
        options = __assign({ debug: 0, host: util_1.util.CLOUD_HOST, port: util_1.util.CLOUD_PORT, path: "/", key: Peer.DEFAULT_KEY, token: util_1.util.randomToken(), config: util_1.util.defaultConfig }, options);
        _this._options = options;
        // Detect relative URL host.
        if (_this._options.host === "/") {
            _this._options.host = window.location.hostname;
        }
        // Set path correctly.
        if (_this._options.path) {
            if (_this._options.path[0] !== "/") {
                _this._options.path = "/" + _this._options.path;
            }
            if (_this._options.path[_this._options.path.length - 1] !== "/") {
                _this._options.path += "/";
            }
        }
        // Set whether we use SSL to same as current host
        if (_this._options.secure === undefined && _this._options.host !== util_1.util.CLOUD_HOST) {
            _this._options.secure = util_1.util.isSecure();
        }
        else if (_this._options.host == util_1.util.CLOUD_HOST) {
            _this._options.secure = true;
        }
        // Set a custom log function if present
        if (_this._options.logFunction) {
            logger_1.default.setLogFunction(_this._options.logFunction);
        }
        logger_1.default.logLevel = _this._options.debug || 0;
        _this._api = new api_1.API(options);
        _this._socket = _this._createServerConnection();
        // Sanity checks
        // Ensure WebRTC supported
        if (!util_1.util.supports.audioVideo && !util_1.util.supports.data) {
            _this._delayedAbort(enums_1.PeerErrorType.BrowserIncompatible, "The current browser does not support WebRTC");
            return _this;
        }
        // Ensure alphanumeric id
        if (!!userId && !util_1.util.validateId(userId)) {
            _this._delayedAbort(enums_1.PeerErrorType.InvalidID, "ID \"" + userId + "\" is invalid");
            return _this;
        }
        if (userId) {
            _this._initialize(userId);
        }
        else {
            _this._api.retrieveId()
                .then(function (id) { return _this._initialize(id); })
                .catch(function (error) { return _this._abort(enums_1.PeerErrorType.ServerError, error); });
        }
        return _this;
    }
    Object.defineProperty(Peer.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Peer.prototype, "options", {
        get: function () {
            return this._options;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Peer.prototype, "open", {
        get: function () {
            return this._open;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Peer.prototype, "socket", {
        get: function () {
            return this._socket;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Peer.prototype, "connections", {
        /**
         * @deprecated
         * Return type will change from Object to Map<string,[]>
         */
        get: function () {
            var e_1, _a;
            var plainConnections = Object.create(null);
            try {
                for (var _b = __values(this._connections), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = __read(_c.value, 2), k = _d[0], v = _d[1];
                    plainConnections[k] = v;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return plainConnections;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Peer.prototype, "destroyed", {
        get: function () {
            return this._destroyed;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Peer.prototype, "disconnected", {
        get: function () {
            return this._disconnected;
        },
        enumerable: false,
        configurable: true
    });
    Peer.prototype._createServerConnection = function () {
        var _this = this;
        var socket = new socket_1.Socket(this._options.secure, this._options.host, this._options.port, this._options.path, this._options.key, this._options.pingInterval);
        socket.on(enums_1.SocketEventType.Message, function (data) {
            _this._handleMessage(data);
        });
        socket.on(enums_1.SocketEventType.Error, function (error) {
            _this._abort(enums_1.PeerErrorType.SocketError, error);
        });
        socket.on(enums_1.SocketEventType.Disconnected, function () {
            if (_this.disconnected) {
                return;
            }
            _this.emitError(enums_1.PeerErrorType.Network, "Lost connection to server.");
            _this.disconnect();
        });
        socket.on(enums_1.SocketEventType.Close, function () {
            if (_this.disconnected) {
                return;
            }
            _this._abort(enums_1.PeerErrorType.SocketClosed, "Underlying socket is already closed.");
        });
        return socket;
    };
    /** Initialize a connection with the server. */
    Peer.prototype._initialize = function (id) {
        this._id = id;
        this.socket.start(id, this._options.token);
    };
    /** Handles messages from the server. */
    Peer.prototype._handleMessage = function (message) {
        var e_2, _a;
        var type = message.type;
        var payload = message.payload;
        var peerId = message.src;
        switch (type) {
            case enums_1.ServerMessageType.Open: // The connection to the server is open.
                this._lastServerId = this.id;
                this._open = true;
                this.emit(enums_1.PeerEventType.Open, this.id);
                break;
            case enums_1.ServerMessageType.Error: // Server error.
                this._abort(enums_1.PeerErrorType.ServerError, payload.msg);
                break;
            case enums_1.ServerMessageType.IdTaken: // The selected ID is taken.
                this._abort(enums_1.PeerErrorType.UnavailableID, "ID \"" + this.id + "\" is taken");
                break;
            case enums_1.ServerMessageType.InvalidKey: // The given API key cannot be found.
                this._abort(enums_1.PeerErrorType.InvalidKey, "API KEY \"" + this._options.key + "\" is invalid");
                break;
            case enums_1.ServerMessageType.Leave: // Another peer has closed its connection to this peer.
                logger_1.default.log("Received leave message from " + peerId);
                this._cleanupPeer(peerId);
                this._connections.delete(peerId);
                break;
            case enums_1.ServerMessageType.Expire: // The offer sent to a peer has expired without response.
                this.emitError(enums_1.PeerErrorType.PeerUnavailable, "Could not connect to peer " + peerId);
                break;
            case enums_1.ServerMessageType.Offer: {
                // we should consider switching this to CALL/CONNECT, but this is the least breaking option.
                var connectionId = payload.connectionId;
                var connection = this.getConnection(peerId, connectionId);
                if (connection) {
                    connection.close();
                    logger_1.default.warn("Offer received for existing Connection ID:" + connectionId);
                }
                // Create a new connection.
                if (payload.type === enums_1.ConnectionType.Media) {
                    connection = new mediaconnection_1.MediaConnection(peerId, this, {
                        connectionId: connectionId,
                        _payload: payload,
                        metadata: payload.metadata
                    });
                    this._addConnection(peerId, connection);
                    this.emit(enums_1.PeerEventType.Call, connection);
                }
                else if (payload.type === enums_1.ConnectionType.Data) {
                    connection = new dataconnection_1.DataConnection(peerId, this, {
                        connectionId: connectionId,
                        _payload: payload,
                        metadata: payload.metadata,
                        label: payload.label,
                        serialization: payload.serialization,
                        reliable: payload.reliable
                    });
                    this._addConnection(peerId, connection);
                    this.emit(enums_1.PeerEventType.Connection, connection);
                }
                else {
                    logger_1.default.warn("Received malformed connection type:" + payload.type);
                    return;
                }
                // Find messages.
                var messages = this._getMessages(connectionId);
                try {
                    for (var messages_1 = __values(messages), messages_1_1 = messages_1.next(); !messages_1_1.done; messages_1_1 = messages_1.next()) {
                        var message_1 = messages_1_1.value;
                        connection.handleMessage(message_1);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (messages_1_1 && !messages_1_1.done && (_a = messages_1.return)) _a.call(messages_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                break;
            }
            default: {
                if (!payload) {
                    logger_1.default.warn("You received a malformed message from " + peerId + " of type " + type);
                    return;
                }
                var connectionId = payload.connectionId;
                var connection = this.getConnection(peerId, connectionId);
                if (connection && connection.peerConnection) {
                    // Pass it on.
                    connection.handleMessage(message);
                }
                else if (connectionId) {
                    // Store for possible later use
                    this._storeMessage(connectionId, message);
                }
                else {
                    logger_1.default.warn("You received an unrecognized message:", message);
                }
                break;
            }
        }
    };
    /** Stores messages without a set up connection, to be claimed later. */
    Peer.prototype._storeMessage = function (connectionId, message) {
        if (!this._lostMessages.has(connectionId)) {
            this._lostMessages.set(connectionId, []);
        }
        this._lostMessages.get(connectionId).push(message);
    };
    /** Retrieve messages from lost message store */
    //TODO Change it to private
    Peer.prototype._getMessages = function (connectionId) {
        var messages = this._lostMessages.get(connectionId);
        if (messages) {
            this._lostMessages.delete(connectionId);
            return messages;
        }
        return [];
    };
    /**
     * Returns a DataConnection to the specified peer. See documentation for a
     * complete list of options.
     */
    Peer.prototype.connect = function (peer, options) {
        if (options === void 0) { options = {}; }
        if (this.disconnected) {
            logger_1.default.warn("You cannot connect to a new Peer because you called " +
                ".disconnect() on this Peer and ended your connection with the " +
                "server. You can create a new Peer to reconnect, or call reconnect " +
                "on this peer if you believe its ID to still be available.");
            this.emitError(enums_1.PeerErrorType.Disconnected, "Cannot connect to new Peer after disconnecting from server.");
            return;
        }
        var dataConnection = new dataconnection_1.DataConnection(peer, this, options);
        this._addConnection(peer, dataConnection);
        return dataConnection;
    };
    /**
     * Returns a MediaConnection to the specified peer. See documentation for a
     * complete list of options.
     */
    Peer.prototype.call = function (peer, stream, options) {
        if (options === void 0) { options = {}; }
        if (this.disconnected) {
            logger_1.default.warn("You cannot connect to a new Peer because you called " +
                ".disconnect() on this Peer and ended your connection with the " +
                "server. You can create a new Peer to reconnect.");
            this.emitError(enums_1.PeerErrorType.Disconnected, "Cannot connect to new Peer after disconnecting from server.");
            return;
        }
        if (!stream) {
            logger_1.default.error("To call a peer, you must provide a stream from your browser's `getUserMedia`.");
            return;
        }
        options._stream = stream;
        var mediaConnection = new mediaconnection_1.MediaConnection(peer, this, options);
        this._addConnection(peer, mediaConnection);
        return mediaConnection;
    };
    /** Add a data/media connection to this peer. */
    Peer.prototype._addConnection = function (peerId, connection) {
        logger_1.default.log("add connection " + connection.type + ":" + connection.connectionId + " to peerId:" + peerId);
        if (!this._connections.has(peerId)) {
            this._connections.set(peerId, []);
        }
        this._connections.get(peerId).push(connection);
    };
    //TODO should be private
    Peer.prototype._removeConnection = function (connection) {
        var connections = this._connections.get(connection.peer);
        if (connections) {
            var index = connections.indexOf(connection);
            if (index !== -1) {
                connections.splice(index, 1);
            }
        }
        //remove from lost messages
        this._lostMessages.delete(connection.connectionId);
    };
    /** Retrieve a data/media connection for this peer. */
    Peer.prototype.getConnection = function (peerId, connectionId) {
        var e_3, _a;
        var connections = this._connections.get(peerId);
        if (!connections) {
            return null;
        }
        try {
            for (var connections_1 = __values(connections), connections_1_1 = connections_1.next(); !connections_1_1.done; connections_1_1 = connections_1.next()) {
                var connection = connections_1_1.value;
                if (connection.connectionId === connectionId) {
                    return connection;
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (connections_1_1 && !connections_1_1.done && (_a = connections_1.return)) _a.call(connections_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return null;
    };
    Peer.prototype._delayedAbort = function (type, message) {
        var _this = this;
        setTimeout(function () {
            _this._abort(type, message);
        }, 0);
    };
    /**
     * Emits an error message and destroys the Peer.
     * The Peer is not destroyed if it's in a disconnected state, in which case
     * it retains its disconnected state and its existing connections.
     */
    Peer.prototype._abort = function (type, message) {
        logger_1.default.error("Aborting!");
        this.emitError(type, message);
        if (!this._lastServerId) {
            this.destroy();
        }
        else {
            this.disconnect();
        }
    };
    /** Emits a typed error message. */
    Peer.prototype.emitError = function (type, err) {
        logger_1.default.error("Error:", err);
        var error;
        if (typeof err === "string") {
            error = new Error(err);
        }
        else {
            error = err;
        }
        error.type = type;
        this.emit(enums_1.PeerEventType.Error, error);
    };
    /**
     * Destroys the Peer: closes all active connections as well as the connection
     *  to the server.
     * Warning: The peer can no longer create or accept connections after being
     *  destroyed.
     */
    Peer.prototype.destroy = function () {
        if (this.destroyed) {
            return;
        }
        logger_1.default.log("Destroy peer with ID:" + this.id);
        this.disconnect();
        this._cleanup();
        this._destroyed = true;
        this.emit(enums_1.PeerEventType.Close);
    };
    /** Disconnects every connection on this peer. */
    Peer.prototype._cleanup = function () {
        var e_4, _a;
        try {
            for (var _b = __values(this._connections.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var peerId = _c.value;
                this._cleanupPeer(peerId);
                this._connections.delete(peerId);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        this.socket.removeAllListeners();
    };
    /** Closes all connections to this peer. */
    Peer.prototype._cleanupPeer = function (peerId) {
        var e_5, _a;
        var connections = this._connections.get(peerId);
        if (!connections)
            return;
        try {
            for (var connections_2 = __values(connections), connections_2_1 = connections_2.next(); !connections_2_1.done; connections_2_1 = connections_2.next()) {
                var connection = connections_2_1.value;
                connection.close();
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (connections_2_1 && !connections_2_1.done && (_a = connections_2.return)) _a.call(connections_2);
            }
            finally { if (e_5) throw e_5.error; }
        }
    };
    /**
     * Disconnects the Peer's connection to the PeerServer. Does not close any
     *  active connections.
     * Warning: The peer can no longer create or accept connections after being
     *  disconnected. It also cannot reconnect to the server.
     */
    Peer.prototype.disconnect = function () {
        if (this.disconnected) {
            return;
        }
        var currentId = this.id;
        logger_1.default.log("Disconnect peer with ID:" + currentId);
        this._disconnected = true;
        this._open = false;
        this.socket.close();
        this._lastServerId = currentId;
        this._id = null;
        this.emit(enums_1.PeerEventType.Disconnected, currentId);
    };
    /** Attempts to reconnect with the same ID. */
    Peer.prototype.reconnect = function () {
        if (this.disconnected && !this.destroyed) {
            logger_1.default.log("Attempting reconnection to server with ID " + this._lastServerId);
            this._disconnected = false;
            this._initialize(this._lastServerId);
        }
        else if (this.destroyed) {
            throw new Error("This peer cannot reconnect to the server. It has already been destroyed.");
        }
        else if (!this.disconnected && !this.open) {
            // Do nothing. We're still connecting the first time.
            logger_1.default.error("In a hurry? We're still trying to make the initial connection!");
        }
        else {
            throw new Error("Peer " + this.id + " cannot reconnect because it is not disconnected from the server!");
        }
    };
    /**
     * Get a list of available peer IDs. If you're running your own server, you'll
     * want to set allow_discovery: true in the PeerServer options. If you're using
     * the cloud server, email team@peerjs.com to get the functionality enabled for
     * your key.
     */
    Peer.prototype.listAllPeers = function (cb) {
        var _this = this;
        if (cb === void 0) { cb = function (_) { }; }
        this._api.listAllPeers()
            .then(function (peers) { return cb(peers); })
            .catch(function (error) { return _this._abort(enums_1.PeerErrorType.ServerError, error); });
    };
    Peer.DEFAULT_KEY = "peerjs";
    return Peer;
}(eventemitter3_1.EventEmitter));
exports.Peer = Peer;


/***/ }),

/***/ "./lib/socket.ts":
/*!***********************!*\
  !*** ./lib/socket.ts ***!
  \***********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Socket = void 0;
var eventemitter3_1 = __webpack_require__(/*! eventemitter3 */ "./node_modules/eventemitter3/index.js");
var logger_1 = __webpack_require__(/*! ./logger */ "./lib/logger.ts");
var enums_1 = __webpack_require__(/*! ./enums */ "./lib/enums.ts");
/**
 * An abstraction on top of WebSockets to provide fastest
 * possible connection for peers.
 */
var Socket = /** @class */ (function (_super) {
    __extends(Socket, _super);
    function Socket(secure, host, port, path, key, pingInterval) {
        if (pingInterval === void 0) { pingInterval = 5000; }
        var _this = _super.call(this) || this;
        _this.pingInterval = pingInterval;
        _this._disconnected = true;
        _this._messagesQueue = [];
        var wsProtocol = secure ? "wss://" : "ws://";
        _this._baseUrl = wsProtocol + host + ":" + port + path + "peerjs?key=" + key;
        return _this;
    }
    Socket.prototype.start = function (id, token) {
        var _this = this;
        this._id = id;
        var wsUrl = this._baseUrl + "&id=" + id + "&token=" + token;
        if (!!this._socket || !this._disconnected) {
            return;
        }
        this._socket = new WebSocket(wsUrl);
        this._disconnected = false;
        this._socket.onmessage = function (event) {
            var data;
            try {
                data = JSON.parse(event.data);
                logger_1.default.log("Server message received:", data);
            }
            catch (e) {
                logger_1.default.log("Invalid server message", event.data);
                return;
            }
            _this.emit(enums_1.SocketEventType.Message, data);
        };
        this._socket.onclose = function (event) {
            if (_this._disconnected) {
                return;
            }
            logger_1.default.log("Socket closed.", event);
            _this._cleanup();
            _this._disconnected = true;
            _this.emit(enums_1.SocketEventType.Disconnected);
        };
        // Take care of the queue of connections if necessary and make sure Peer knows
        // socket is open.
        this._socket.onopen = function () {
            if (_this._disconnected) {
                return;
            }
            _this._sendQueuedMessages();
            logger_1.default.log("Socket open");
            _this._scheduleHeartbeat();
        };
    };
    Socket.prototype._scheduleHeartbeat = function () {
        var _this = this;
        this._wsPingTimer = setTimeout(function () {
            _this._sendHeartbeat();
        }, this.pingInterval);
    };
    Socket.prototype._sendHeartbeat = function () {
        if (!this._wsOpen()) {
            logger_1.default.log("Cannot send heartbeat, because socket closed");
            return;
        }
        var message = JSON.stringify({ type: enums_1.ServerMessageType.Heartbeat });
        this._socket.send(message);
        this._scheduleHeartbeat();
    };
    /** Is the websocket currently open? */
    Socket.prototype._wsOpen = function () {
        return !!this._socket && this._socket.readyState === 1;
    };
    /** Send queued messages. */
    Socket.prototype._sendQueuedMessages = function () {
        var e_1, _a;
        //Create copy of queue and clear it,
        //because send method push the message back to queue if smth will go wrong
        var copiedQueue = __spreadArray([], __read(this._messagesQueue));
        this._messagesQueue = [];
        try {
            for (var copiedQueue_1 = __values(copiedQueue), copiedQueue_1_1 = copiedQueue_1.next(); !copiedQueue_1_1.done; copiedQueue_1_1 = copiedQueue_1.next()) {
                var message = copiedQueue_1_1.value;
                this.send(message);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (copiedQueue_1_1 && !copiedQueue_1_1.done && (_a = copiedQueue_1.return)) _a.call(copiedQueue_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    /** Exposed send for DC & Peer. */
    Socket.prototype.send = function (data) {
        if (this._disconnected) {
            return;
        }
        // If we didn't get an ID yet, we can't yet send anything so we should queue
        // up these messages.
        if (!this._id) {
            this._messagesQueue.push(data);
            return;
        }
        if (!data.type) {
            this.emit(enums_1.SocketEventType.Error, "Invalid message");
            return;
        }
        if (!this._wsOpen()) {
            return;
        }
        var message = JSON.stringify(data);
        this._socket.send(message);
    };
    Socket.prototype.close = function () {
        if (this._disconnected) {
            return;
        }
        this._cleanup();
        this._disconnected = true;
    };
    Socket.prototype._cleanup = function () {
        if (this._socket) {
            this._socket.onopen = this._socket.onmessage = this._socket.onclose = null;
            this._socket.close();
            this._socket = undefined;
        }
        clearTimeout(this._wsPingTimer);
    };
    return Socket;
}(eventemitter3_1.EventEmitter));
exports.Socket = Socket;


/***/ }),

/***/ "./lib/supports.ts":
/*!*************************!*\
  !*** ./lib/supports.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Supports = void 0;
var adapter_1 = __webpack_require__(/*! ./adapter */ "./lib/adapter.ts");
exports.Supports = new /** @class */ (function () {
    function class_1() {
        this.isIOS = ['iPad', 'iPhone', 'iPod'].includes(navigator.platform);
        this.supportedBrowsers = ['firefox', 'chrome', 'safari'];
        this.minFirefoxVersion = 59;
        this.minChromeVersion = 72;
        this.minSafariVersion = 605;
    }
    class_1.prototype.isWebRTCSupported = function () {
        return typeof RTCPeerConnection !== 'undefined';
    };
    class_1.prototype.isBrowserSupported = function () {
        var browser = this.getBrowser();
        var version = this.getVersion();
        var validBrowser = this.supportedBrowsers.includes(browser);
        if (!validBrowser)
            return false;
        if (browser === 'chrome')
            return version >= this.minChromeVersion;
        if (browser === 'firefox')
            return version >= this.minFirefoxVersion;
        if (browser === 'safari')
            return !this.isIOS && version >= this.minSafariVersion;
        return false;
    };
    class_1.prototype.getBrowser = function () {
        return adapter_1.webRTCAdapter.browserDetails.browser;
    };
    class_1.prototype.getVersion = function () {
        return adapter_1.webRTCAdapter.browserDetails.version || 0;
    };
    class_1.prototype.isUnifiedPlanSupported = function () {
        var browser = this.getBrowser();
        var version = adapter_1.webRTCAdapter.browserDetails.version || 0;
        if (browser === 'chrome' && version < 72)
            return false;
        if (browser === 'firefox' && version >= 59)
            return true;
        if (!window.RTCRtpTransceiver || !('currentDirection' in RTCRtpTransceiver.prototype))
            return false;
        var tempPc;
        var supported = false;
        try {
            tempPc = new RTCPeerConnection();
            tempPc.addTransceiver('audio');
            supported = true;
        }
        catch (e) { }
        finally {
            if (tempPc) {
                tempPc.close();
            }
        }
        return supported;
    };
    class_1.prototype.toString = function () {
        return "Supports: \n    browser:" + this.getBrowser() + " \n    version:" + this.getVersion() + " \n    isIOS:" + this.isIOS + " \n    isWebRTCSupported:" + this.isWebRTCSupported() + " \n    isBrowserSupported:" + this.isBrowserSupported() + " \n    isUnifiedPlanSupported:" + this.isUnifiedPlanSupported();
    };
    return class_1;
}());


/***/ }),

/***/ "./lib/util.ts":
/*!*********************!*\
  !*** ./lib/util.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.util = void 0;
var BinaryPack = __webpack_require__(/*! peerjs-js-binarypack */ "./node_modules/peerjs-js-binarypack/lib/binarypack.js");
var supports_1 = __webpack_require__(/*! ./supports */ "./lib/supports.ts");
var DEFAULT_CONFIG = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "turn:0.peerjs.com:3478", username: "peerjs", credential: "peerjsp" }
    ],
    sdpSemantics: "unified-plan"
};
exports.util = new /** @class */ (function () {
    function class_1() {
        this.CLOUD_HOST = "0.peerjs.com";
        this.CLOUD_PORT = 443;
        // Browsers that need chunking:
        this.chunkedBrowsers = { Chrome: 1, chrome: 1 };
        this.chunkedMTU = 16300; // The original 60000 bytes setting does not work when sending data from Firefox to Chrome, which is "cut off" after 16384 bytes and delivered individually.
        // Returns browser-agnostic default config
        this.defaultConfig = DEFAULT_CONFIG;
        this.browser = supports_1.Supports.getBrowser();
        this.browserVersion = supports_1.Supports.getVersion();
        // Lists which features are supported
        this.supports = (function () {
            var supported = {
                browser: supports_1.Supports.isBrowserSupported(),
                webRTC: supports_1.Supports.isWebRTCSupported(),
                audioVideo: false,
                data: false,
                binaryBlob: false,
                reliable: false,
            };
            if (!supported.webRTC)
                return supported;
            var pc;
            try {
                pc = new RTCPeerConnection(DEFAULT_CONFIG);
                supported.audioVideo = true;
                var dc = void 0;
                try {
                    dc = pc.createDataChannel("_PEERJSTEST", { ordered: true });
                    supported.data = true;
                    supported.reliable = !!dc.ordered;
                    // Binary test
                    try {
                        dc.binaryType = "blob";
                        supported.binaryBlob = !supports_1.Supports.isIOS;
                    }
                    catch (e) {
                    }
                }
                catch (e) {
                }
                finally {
                    if (dc) {
                        dc.close();
                    }
                }
            }
            catch (e) {
            }
            finally {
                if (pc) {
                    pc.close();
                }
            }
            return supported;
        })();
        this.pack = BinaryPack.pack;
        this.unpack = BinaryPack.unpack;
        // Binary stuff
        this._dataCount = 1;
    }
    class_1.prototype.noop = function () { };
    // Ensure alphanumeric ids
    class_1.prototype.validateId = function (id) {
        // Allow empty ids
        return !id || /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.test(id);
    };
    class_1.prototype.chunk = function (blob) {
        var chunks = [];
        var size = blob.size;
        var total = Math.ceil(size / exports.util.chunkedMTU);
        var index = 0;
        var start = 0;
        while (start < size) {
            var end = Math.min(size, start + exports.util.chunkedMTU);
            var b = blob.slice(start, end);
            var chunk = {
                __peerData: this._dataCount,
                n: index,
                data: b,
                total: total,
            };
            chunks.push(chunk);
            start = end;
            index++;
        }
        this._dataCount++;
        return chunks;
    };
    class_1.prototype.blobToArrayBuffer = function (blob, cb) {
        var fr = new FileReader();
        fr.onload = function (evt) {
            if (evt.target) {
                cb(evt.target.result);
            }
        };
        fr.readAsArrayBuffer(blob);
        return fr;
    };
    class_1.prototype.binaryStringToArrayBuffer = function (binary) {
        var byteArray = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) {
            byteArray[i] = binary.charCodeAt(i) & 0xff;
        }
        return byteArray.buffer;
    };
    class_1.prototype.randomToken = function () {
        return Math.random()
            .toString(36)
            .substr(2);
    };
    class_1.prototype.isSecure = function () {
        return location.protocol === "https:";
    };
    return class_1;
}());


/***/ }),

/***/ "./node_modules/webrtc-adapter/src/js/adapter_core.js":
/*!************************************************************!*\
  !*** ./node_modules/webrtc-adapter/src/js/adapter_core.js ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _adapter_factory_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./adapter_factory.js */ "./node_modules/webrtc-adapter/src/js/adapter_factory.js");
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */





const adapter =
  (0,_adapter_factory_js__WEBPACK_IMPORTED_MODULE_0__.adapterFactory)({window: typeof window === 'undefined' ? undefined : window});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (adapter);


/***/ }),

/***/ "./node_modules/webrtc-adapter/src/js/adapter_factory.js":
/*!***************************************************************!*\
  !*** ./node_modules/webrtc-adapter/src/js/adapter_factory.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "adapterFactory": () => (/* binding */ adapterFactory)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./node_modules/webrtc-adapter/src/js/utils.js");
/* harmony import */ var _chrome_chrome_shim__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./chrome/chrome_shim */ "./node_modules/webrtc-adapter/src/js/chrome/chrome_shim.js");
/* harmony import */ var _edge_edge_shim__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./edge/edge_shim */ "./node_modules/webrtc-adapter/src/js/edge/edge_shim.js");
/* harmony import */ var _firefox_firefox_shim__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./firefox/firefox_shim */ "./node_modules/webrtc-adapter/src/js/firefox/firefox_shim.js");
/* harmony import */ var _safari_safari_shim__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./safari/safari_shim */ "./node_modules/webrtc-adapter/src/js/safari/safari_shim.js");
/* harmony import */ var _common_shim__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./common_shim */ "./node_modules/webrtc-adapter/src/js/common_shim.js");
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */


  // Browser shims.






// Shimming starts here.
function adapterFactory({window} = {}, options = {
  shimChrome: true,
  shimFirefox: true,
  shimEdge: true,
  shimSafari: true,
}) {
  // Utils.
  const logging = _utils__WEBPACK_IMPORTED_MODULE_0__.log;
  const browserDetails = _utils__WEBPACK_IMPORTED_MODULE_0__.detectBrowser(window);

  const adapter = {
    browserDetails,
    commonShim: _common_shim__WEBPACK_IMPORTED_MODULE_5__,
    extractVersion: _utils__WEBPACK_IMPORTED_MODULE_0__.extractVersion,
    disableLog: _utils__WEBPACK_IMPORTED_MODULE_0__.disableLog,
    disableWarnings: _utils__WEBPACK_IMPORTED_MODULE_0__.disableWarnings
  };

  // Shim browser if found.
  switch (browserDetails.browser) {
    case 'chrome':
      if (!_chrome_chrome_shim__WEBPACK_IMPORTED_MODULE_1__ || !_chrome_chrome_shim__WEBPACK_IMPORTED_MODULE_1__.shimPeerConnection ||
          !options.shimChrome) {
        logging('Chrome shim is not included in this adapter release.');
        return adapter;
      }
      if (browserDetails.version === null) {
        logging('Chrome shim can not determine version, not shimming.');
        return adapter;
      }
      logging('adapter.js shimming chrome.');
      // Export to the adapter global object visible in the browser.
      adapter.browserShim = _chrome_chrome_shim__WEBPACK_IMPORTED_MODULE_1__;

      // Must be called before shimPeerConnection.
      _common_shim__WEBPACK_IMPORTED_MODULE_5__.shimAddIceCandidateNullOrEmpty(window, browserDetails);

      _chrome_chrome_shim__WEBPACK_IMPORTED_MODULE_1__.shimGetUserMedia(window, browserDetails);
      _chrome_chrome_shim__WEBPACK_IMPORTED_MODULE_1__.shimMediaStream(window, browserDetails);
      _chrome_chrome_shim__WEBPACK_IMPORTED_MODULE_1__.shimPeerConnection(window, browserDetails);
      _chrome_chrome_shim__WEBPACK_IMPORTED_MODULE_1__.shimOnTrack(window, browserDetails);
      _chrome_chrome_shim__WEBPACK_IMPORTED_MODULE_1__.shimAddTrackRemoveTrack(window, browserDetails);
      _chrome_chrome_shim__WEBPACK_IMPORTED_MODULE_1__.shimGetSendersWithDtmf(window, browserDetails);
      _chrome_chrome_shim__WEBPACK_IMPORTED_MODULE_1__.shimGetStats(window, browserDetails);
      _chrome_chrome_shim__WEBPACK_IMPORTED_MODULE_1__.shimSenderReceiverGetStats(window, browserDetails);
      _chrome_chrome_shim__WEBPACK_IMPORTED_MODULE_1__.fixNegotiationNeeded(window, browserDetails);

      _common_shim__WEBPACK_IMPORTED_MODULE_5__.shimRTCIceCandidate(window, browserDetails);
      _common_shim__WEBPACK_IMPORTED_MODULE_5__.shimConnectionState(window, browserDetails);
      _common_shim__WEBPACK_IMPORTED_MODULE_5__.shimMaxMessageSize(window, browserDetails);
      _common_shim__WEBPACK_IMPORTED_MODULE_5__.shimSendThrowTypeError(window, browserDetails);
      _common_shim__WEBPACK_IMPORTED_MODULE_5__.removeExtmapAllowMixed(window, browserDetails);
      break;
    case 'firefox':
      if (!_firefox_firefox_shim__WEBPACK_IMPORTED_MODULE_3__ || !_firefox_firefox_shim__WEBPACK_IMPORTED_MODULE_3__.shimPeerConnection ||
          !options.shimFirefox) {
        logging('Firefox shim is not included in this adapter release.');
        return adapter;
      }
      logging('adapter.js shimming firefox.');
      // Export to the adapter global object visible in the browser.
      adapter.browserShim = _firefox_firefox_shim__WEBPACK_IMPORTED_MODULE_3__;

      // Must be called before shimPeerConnection.
      _common_shim__WEBPACK_IMPORTED_MODULE_5__.shimAddIceCandidateNullOrEmpty(window, browserDetails);

      _firefox_firefox_shim__WEBPACK_IMPORTED_MODULE_3__.shimGetUserMedia(window, browserDetails);
      _firefox_firefox_shim__WEBPACK_IMPORTED_MODULE_3__.shimPeerConnection(window, browserDetails);
      _firefox_firefox_shim__WEBPACK_IMPORTED_MODULE_3__.shimOnTrack(window, browserDetails);
      _firefox_firefox_shim__WEBPACK_IMPORTED_MODULE_3__.shimRemoveStream(window, browserDetails);
      _firefox_firefox_shim__WEBPACK_IMPORTED_MODULE_3__.shimSenderGetStats(window, browserDetails);
      _firefox_firefox_shim__WEBPACK_IMPORTED_MODULE_3__.shimReceiverGetStats(window, browserDetails);
      _firefox_firefox_shim__WEBPACK_IMPORTED_MODULE_3__.shimRTCDataChannel(window, browserDetails);
      _firefox_firefox_shim__WEBPACK_IMPORTED_MODULE_3__.shimAddTransceiver(window, browserDetails);
      _firefox_firefox_shim__WEBPACK_IMPORTED_MODULE_3__.shimGetParameters(window, browserDetails);
      _firefox_firefox_shim__WEBPACK_IMPORTED_MODULE_3__.shimCreateOffer(window, browserDetails);
      _firefox_firefox_shim__WEBPACK_IMPORTED_MODULE_3__.shimCreateAnswer(window, browserDetails);

      _common_shim__WEBPACK_IMPORTED_MODULE_5__.shimRTCIceCandidate(window, browserDetails);
      _common_shim__WEBPACK_IMPORTED_MODULE_5__.shimConnectionState(window, browserDetails);
      _common_shim__WEBPACK_IMPORTED_MODULE_5__.shimMaxMessageSize(window, browserDetails);
      _common_shim__WEBPACK_IMPORTED_MODULE_5__.shimSendThrowTypeError(window, browserDetails);
      break;
    case 'edge':
      if (!_edge_edge_shim__WEBPACK_IMPORTED_MODULE_2__ || !_edge_edge_shim__WEBPACK_IMPORTED_MODULE_2__.shimPeerConnection || !options.shimEdge) {
        logging('MS edge shim is not included in this adapter release.');
        return adapter;
      }
      logging('adapter.js shimming edge.');
      // Export to the adapter global object visible in the browser.
      adapter.browserShim = _edge_edge_shim__WEBPACK_IMPORTED_MODULE_2__;

      _edge_edge_shim__WEBPACK_IMPORTED_MODULE_2__.shimGetUserMedia(window, browserDetails);
      _edge_edge_shim__WEBPACK_IMPORTED_MODULE_2__.shimGetDisplayMedia(window, browserDetails);
      _edge_edge_shim__WEBPACK_IMPORTED_MODULE_2__.shimPeerConnection(window, browserDetails);
      _edge_edge_shim__WEBPACK_IMPORTED_MODULE_2__.shimReplaceTrack(window, browserDetails);

      // the edge shim implements the full RTCIceCandidate object.

      _common_shim__WEBPACK_IMPORTED_MODULE_5__.shimMaxMessageSize(window, browserDetails);
      _common_shim__WEBPACK_IMPORTED_MODULE_5__.shimSendThrowTypeError(window, browserDetails);
      break;
    case 'safari':
      if (!_safari_safari_shim__WEBPACK_IMPORTED_MODULE_4__ || !options.shimSafari) {
        logging('Safari shim is not included in this adapter release.');
        return adapter;
      }
      logging('adapter.js shimming safari.');
      // Export to the adapter global object visible in the browser.
      adapter.browserShim = _safari_safari_shim__WEBPACK_IMPORTED_MODULE_4__;

      // Must be called before shimCallbackAPI.
      _common_shim__WEBPACK_IMPORTED_MODULE_5__.shimAddIceCandidateNullOrEmpty(window, browserDetails);

      _safari_safari_shim__WEBPACK_IMPORTED_MODULE_4__.shimRTCIceServerUrls(window, browserDetails);
      _safari_safari_shim__WEBPACK_IMPORTED_MODULE_4__.shimCreateOfferLegacy(window, browserDetails);
      _safari_safari_shim__WEBPACK_IMPORTED_MODULE_4__.shimCallbacksAPI(window, browserDetails);
      _safari_safari_shim__WEBPACK_IMPORTED_MODULE_4__.shimLocalStreamsAPI(window, browserDetails);
      _safari_safari_shim__WEBPACK_IMPORTED_MODULE_4__.shimRemoteStreamsAPI(window, browserDetails);
      _safari_safari_shim__WEBPACK_IMPORTED_MODULE_4__.shimTrackEventTransceiver(window, browserDetails);
      _safari_safari_shim__WEBPACK_IMPORTED_MODULE_4__.shimGetUserMedia(window, browserDetails);
      _safari_safari_shim__WEBPACK_IMPORTED_MODULE_4__.shimAudioContext(window, browserDetails);

      _common_shim__WEBPACK_IMPORTED_MODULE_5__.shimRTCIceCandidate(window, browserDetails);
      _common_shim__WEBPACK_IMPORTED_MODULE_5__.shimMaxMessageSize(window, browserDetails);
      _common_shim__WEBPACK_IMPORTED_MODULE_5__.shimSendThrowTypeError(window, browserDetails);
      _common_shim__WEBPACK_IMPORTED_MODULE_5__.removeExtmapAllowMixed(window, browserDetails);
      break;
    default:
      logging('Unsupported browser!');
      break;
  }

  return adapter;
}


/***/ }),

/***/ "./node_modules/webrtc-adapter/src/js/chrome/chrome_shim.js":
/*!******************************************************************!*\
  !*** ./node_modules/webrtc-adapter/src/js/chrome/chrome_shim.js ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "shimGetUserMedia": () => (/* reexport safe */ _getusermedia__WEBPACK_IMPORTED_MODULE_1__.shimGetUserMedia),
/* harmony export */   "shimGetDisplayMedia": () => (/* reexport safe */ _getdisplaymedia__WEBPACK_IMPORTED_MODULE_2__.shimGetDisplayMedia),
/* harmony export */   "shimMediaStream": () => (/* binding */ shimMediaStream),
/* harmony export */   "shimOnTrack": () => (/* binding */ shimOnTrack),
/* harmony export */   "shimGetSendersWithDtmf": () => (/* binding */ shimGetSendersWithDtmf),
/* harmony export */   "shimGetStats": () => (/* binding */ shimGetStats),
/* harmony export */   "shimSenderReceiverGetStats": () => (/* binding */ shimSenderReceiverGetStats),
/* harmony export */   "shimAddTrackRemoveTrackWithNative": () => (/* binding */ shimAddTrackRemoveTrackWithNative),
/* harmony export */   "shimAddTrackRemoveTrack": () => (/* binding */ shimAddTrackRemoveTrack),
/* harmony export */   "shimPeerConnection": () => (/* binding */ shimPeerConnection),
/* harmony export */   "fixNegotiationNeeded": () => (/* binding */ fixNegotiationNeeded)
/* harmony export */ });
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils.js */ "./node_modules/webrtc-adapter/src/js/utils.js");
/* harmony import */ var _getusermedia__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./getusermedia */ "./node_modules/webrtc-adapter/src/js/chrome/getusermedia.js");
/* harmony import */ var _getdisplaymedia__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./getdisplaymedia */ "./node_modules/webrtc-adapter/src/js/chrome/getdisplaymedia.js");
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */






function shimMediaStream(window) {
  window.MediaStream = window.MediaStream || window.webkitMediaStream;
}

function shimOnTrack(window) {
  if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in
      window.RTCPeerConnection.prototype)) {
    Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
      get() {
        return this._ontrack;
      },
      set(f) {
        if (this._ontrack) {
          this.removeEventListener('track', this._ontrack);
        }
        this.addEventListener('track', this._ontrack = f);
      },
      enumerable: true,
      configurable: true
    });
    const origSetRemoteDescription =
        window.RTCPeerConnection.prototype.setRemoteDescription;
    window.RTCPeerConnection.prototype.setRemoteDescription =
      function setRemoteDescription() {
        if (!this._ontrackpoly) {
          this._ontrackpoly = (e) => {
            // onaddstream does not fire when a track is added to an existing
            // stream. But stream.onaddtrack is implemented so we use that.
            e.stream.addEventListener('addtrack', te => {
              let receiver;
              if (window.RTCPeerConnection.prototype.getReceivers) {
                receiver = this.getReceivers()
                  .find(r => r.track && r.track.id === te.track.id);
              } else {
                receiver = {track: te.track};
              }

              const event = new Event('track');
              event.track = te.track;
              event.receiver = receiver;
              event.transceiver = {receiver};
              event.streams = [e.stream];
              this.dispatchEvent(event);
            });
            e.stream.getTracks().forEach(track => {
              let receiver;
              if (window.RTCPeerConnection.prototype.getReceivers) {
                receiver = this.getReceivers()
                  .find(r => r.track && r.track.id === track.id);
              } else {
                receiver = {track};
              }
              const event = new Event('track');
              event.track = track;
              event.receiver = receiver;
              event.transceiver = {receiver};
              event.streams = [e.stream];
              this.dispatchEvent(event);
            });
          };
          this.addEventListener('addstream', this._ontrackpoly);
        }
        return origSetRemoteDescription.apply(this, arguments);
      };
  } else {
    // even if RTCRtpTransceiver is in window, it is only used and
    // emitted in unified-plan. Unfortunately this means we need
    // to unconditionally wrap the event.
    _utils_js__WEBPACK_IMPORTED_MODULE_0__.wrapPeerConnectionEvent(window, 'track', e => {
      if (!e.transceiver) {
        Object.defineProperty(e, 'transceiver',
          {value: {receiver: e.receiver}});
      }
      return e;
    });
  }
}

function shimGetSendersWithDtmf(window) {
  // Overrides addTrack/removeTrack, depends on shimAddTrackRemoveTrack.
  if (typeof window === 'object' && window.RTCPeerConnection &&
      !('getSenders' in window.RTCPeerConnection.prototype) &&
      'createDTMFSender' in window.RTCPeerConnection.prototype) {
    const shimSenderWithDtmf = function(pc, track) {
      return {
        track,
        get dtmf() {
          if (this._dtmf === undefined) {
            if (track.kind === 'audio') {
              this._dtmf = pc.createDTMFSender(track);
            } else {
              this._dtmf = null;
            }
          }
          return this._dtmf;
        },
        _pc: pc
      };
    };

    // augment addTrack when getSenders is not available.
    if (!window.RTCPeerConnection.prototype.getSenders) {
      window.RTCPeerConnection.prototype.getSenders = function getSenders() {
        this._senders = this._senders || [];
        return this._senders.slice(); // return a copy of the internal state.
      };
      const origAddTrack = window.RTCPeerConnection.prototype.addTrack;
      window.RTCPeerConnection.prototype.addTrack =
        function addTrack(track, stream) {
          let sender = origAddTrack.apply(this, arguments);
          if (!sender) {
            sender = shimSenderWithDtmf(this, track);
            this._senders.push(sender);
          }
          return sender;
        };

      const origRemoveTrack = window.RTCPeerConnection.prototype.removeTrack;
      window.RTCPeerConnection.prototype.removeTrack =
        function removeTrack(sender) {
          origRemoveTrack.apply(this, arguments);
          const idx = this._senders.indexOf(sender);
          if (idx !== -1) {
            this._senders.splice(idx, 1);
          }
        };
    }
    const origAddStream = window.RTCPeerConnection.prototype.addStream;
    window.RTCPeerConnection.prototype.addStream = function addStream(stream) {
      this._senders = this._senders || [];
      origAddStream.apply(this, [stream]);
      stream.getTracks().forEach(track => {
        this._senders.push(shimSenderWithDtmf(this, track));
      });
    };

    const origRemoveStream = window.RTCPeerConnection.prototype.removeStream;
    window.RTCPeerConnection.prototype.removeStream =
      function removeStream(stream) {
        this._senders = this._senders || [];
        origRemoveStream.apply(this, [stream]);

        stream.getTracks().forEach(track => {
          const sender = this._senders.find(s => s.track === track);
          if (sender) { // remove sender
            this._senders.splice(this._senders.indexOf(sender), 1);
          }
        });
      };
  } else if (typeof window === 'object' && window.RTCPeerConnection &&
             'getSenders' in window.RTCPeerConnection.prototype &&
             'createDTMFSender' in window.RTCPeerConnection.prototype &&
             window.RTCRtpSender &&
             !('dtmf' in window.RTCRtpSender.prototype)) {
    const origGetSenders = window.RTCPeerConnection.prototype.getSenders;
    window.RTCPeerConnection.prototype.getSenders = function getSenders() {
      const senders = origGetSenders.apply(this, []);
      senders.forEach(sender => sender._pc = this);
      return senders;
    };

    Object.defineProperty(window.RTCRtpSender.prototype, 'dtmf', {
      get() {
        if (this._dtmf === undefined) {
          if (this.track.kind === 'audio') {
            this._dtmf = this._pc.createDTMFSender(this.track);
          } else {
            this._dtmf = null;
          }
        }
        return this._dtmf;
      }
    });
  }
}

function shimGetStats(window) {
  if (!window.RTCPeerConnection) {
    return;
  }

  const origGetStats = window.RTCPeerConnection.prototype.getStats;
  window.RTCPeerConnection.prototype.getStats = function getStats() {
    const [selector, onSucc, onErr] = arguments;

    // If selector is a function then we are in the old style stats so just
    // pass back the original getStats format to avoid breaking old users.
    if (arguments.length > 0 && typeof selector === 'function') {
      return origGetStats.apply(this, arguments);
    }

    // When spec-style getStats is supported, return those when called with
    // either no arguments or the selector argument is null.
    if (origGetStats.length === 0 && (arguments.length === 0 ||
        typeof selector !== 'function')) {
      return origGetStats.apply(this, []);
    }

    const fixChromeStats_ = function(response) {
      const standardReport = {};
      const reports = response.result();
      reports.forEach(report => {
        const standardStats = {
          id: report.id,
          timestamp: report.timestamp,
          type: {
            localcandidate: 'local-candidate',
            remotecandidate: 'remote-candidate'
          }[report.type] || report.type
        };
        report.names().forEach(name => {
          standardStats[name] = report.stat(name);
        });
        standardReport[standardStats.id] = standardStats;
      });

      return standardReport;
    };

    // shim getStats with maplike support
    const makeMapStats = function(stats) {
      return new Map(Object.keys(stats).map(key => [key, stats[key]]));
    };

    if (arguments.length >= 2) {
      const successCallbackWrapper_ = function(response) {
        onSucc(makeMapStats(fixChromeStats_(response)));
      };

      return origGetStats.apply(this, [successCallbackWrapper_,
        selector]);
    }

    // promise-support
    return new Promise((resolve, reject) => {
      origGetStats.apply(this, [
        function(response) {
          resolve(makeMapStats(fixChromeStats_(response)));
        }, reject]);
    }).then(onSucc, onErr);
  };
}

function shimSenderReceiverGetStats(window) {
  if (!(typeof window === 'object' && window.RTCPeerConnection &&
      window.RTCRtpSender && window.RTCRtpReceiver)) {
    return;
  }

  // shim sender stats.
  if (!('getStats' in window.RTCRtpSender.prototype)) {
    const origGetSenders = window.RTCPeerConnection.prototype.getSenders;
    if (origGetSenders) {
      window.RTCPeerConnection.prototype.getSenders = function getSenders() {
        const senders = origGetSenders.apply(this, []);
        senders.forEach(sender => sender._pc = this);
        return senders;
      };
    }

    const origAddTrack = window.RTCPeerConnection.prototype.addTrack;
    if (origAddTrack) {
      window.RTCPeerConnection.prototype.addTrack = function addTrack() {
        const sender = origAddTrack.apply(this, arguments);
        sender._pc = this;
        return sender;
      };
    }
    window.RTCRtpSender.prototype.getStats = function getStats() {
      const sender = this;
      return this._pc.getStats().then(result =>
        /* Note: this will include stats of all senders that
         *   send a track with the same id as sender.track as
         *   it is not possible to identify the RTCRtpSender.
         */
        _utils_js__WEBPACK_IMPORTED_MODULE_0__.filterStats(result, sender.track, true));
    };
  }

  // shim receiver stats.
  if (!('getStats' in window.RTCRtpReceiver.prototype)) {
    const origGetReceivers = window.RTCPeerConnection.prototype.getReceivers;
    if (origGetReceivers) {
      window.RTCPeerConnection.prototype.getReceivers =
        function getReceivers() {
          const receivers = origGetReceivers.apply(this, []);
          receivers.forEach(receiver => receiver._pc = this);
          return receivers;
        };
    }
    _utils_js__WEBPACK_IMPORTED_MODULE_0__.wrapPeerConnectionEvent(window, 'track', e => {
      e.receiver._pc = e.srcElement;
      return e;
    });
    window.RTCRtpReceiver.prototype.getStats = function getStats() {
      const receiver = this;
      return this._pc.getStats().then(result =>
        _utils_js__WEBPACK_IMPORTED_MODULE_0__.filterStats(result, receiver.track, false));
    };
  }

  if (!('getStats' in window.RTCRtpSender.prototype &&
      'getStats' in window.RTCRtpReceiver.prototype)) {
    return;
  }

  // shim RTCPeerConnection.getStats(track).
  const origGetStats = window.RTCPeerConnection.prototype.getStats;
  window.RTCPeerConnection.prototype.getStats = function getStats() {
    if (arguments.length > 0 &&
        arguments[0] instanceof window.MediaStreamTrack) {
      const track = arguments[0];
      let sender;
      let receiver;
      let err;
      this.getSenders().forEach(s => {
        if (s.track === track) {
          if (sender) {
            err = true;
          } else {
            sender = s;
          }
        }
      });
      this.getReceivers().forEach(r => {
        if (r.track === track) {
          if (receiver) {
            err = true;
          } else {
            receiver = r;
          }
        }
        return r.track === track;
      });
      if (err || (sender && receiver)) {
        return Promise.reject(new DOMException(
          'There are more than one sender or receiver for the track.',
          'InvalidAccessError'));
      } else if (sender) {
        return sender.getStats();
      } else if (receiver) {
        return receiver.getStats();
      }
      return Promise.reject(new DOMException(
        'There is no sender or receiver for the track.',
        'InvalidAccessError'));
    }
    return origGetStats.apply(this, arguments);
  };
}

function shimAddTrackRemoveTrackWithNative(window) {
  // shim addTrack/removeTrack with native variants in order to make
  // the interactions with legacy getLocalStreams behave as in other browsers.
  // Keeps a mapping stream.id => [stream, rtpsenders...]
  window.RTCPeerConnection.prototype.getLocalStreams =
    function getLocalStreams() {
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};
      return Object.keys(this._shimmedLocalStreams)
        .map(streamId => this._shimmedLocalStreams[streamId][0]);
    };

  const origAddTrack = window.RTCPeerConnection.prototype.addTrack;
  window.RTCPeerConnection.prototype.addTrack =
    function addTrack(track, stream) {
      if (!stream) {
        return origAddTrack.apply(this, arguments);
      }
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};

      const sender = origAddTrack.apply(this, arguments);
      if (!this._shimmedLocalStreams[stream.id]) {
        this._shimmedLocalStreams[stream.id] = [stream, sender];
      } else if (this._shimmedLocalStreams[stream.id].indexOf(sender) === -1) {
        this._shimmedLocalStreams[stream.id].push(sender);
      }
      return sender;
    };

  const origAddStream = window.RTCPeerConnection.prototype.addStream;
  window.RTCPeerConnection.prototype.addStream = function addStream(stream) {
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};

    stream.getTracks().forEach(track => {
      const alreadyExists = this.getSenders().find(s => s.track === track);
      if (alreadyExists) {
        throw new DOMException('Track already exists.',
            'InvalidAccessError');
      }
    });
    const existingSenders = this.getSenders();
    origAddStream.apply(this, arguments);
    const newSenders = this.getSenders()
      .filter(newSender => existingSenders.indexOf(newSender) === -1);
    this._shimmedLocalStreams[stream.id] = [stream].concat(newSenders);
  };

  const origRemoveStream = window.RTCPeerConnection.prototype.removeStream;
  window.RTCPeerConnection.prototype.removeStream =
    function removeStream(stream) {
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};
      delete this._shimmedLocalStreams[stream.id];
      return origRemoveStream.apply(this, arguments);
    };

  const origRemoveTrack = window.RTCPeerConnection.prototype.removeTrack;
  window.RTCPeerConnection.prototype.removeTrack =
    function removeTrack(sender) {
      this._shimmedLocalStreams = this._shimmedLocalStreams || {};
      if (sender) {
        Object.keys(this._shimmedLocalStreams).forEach(streamId => {
          const idx = this._shimmedLocalStreams[streamId].indexOf(sender);
          if (idx !== -1) {
            this._shimmedLocalStreams[streamId].splice(idx, 1);
          }
          if (this._shimmedLocalStreams[streamId].length === 1) {
            delete this._shimmedLocalStreams[streamId];
          }
        });
      }
      return origRemoveTrack.apply(this, arguments);
    };
}

function shimAddTrackRemoveTrack(window, browserDetails) {
  if (!window.RTCPeerConnection) {
    return;
  }
  // shim addTrack and removeTrack.
  if (window.RTCPeerConnection.prototype.addTrack &&
      browserDetails.version >= 65) {
    return shimAddTrackRemoveTrackWithNative(window);
  }

  // also shim pc.getLocalStreams when addTrack is shimmed
  // to return the original streams.
  const origGetLocalStreams = window.RTCPeerConnection.prototype
      .getLocalStreams;
  window.RTCPeerConnection.prototype.getLocalStreams =
    function getLocalStreams() {
      const nativeStreams = origGetLocalStreams.apply(this);
      this._reverseStreams = this._reverseStreams || {};
      return nativeStreams.map(stream => this._reverseStreams[stream.id]);
    };

  const origAddStream = window.RTCPeerConnection.prototype.addStream;
  window.RTCPeerConnection.prototype.addStream = function addStream(stream) {
    this._streams = this._streams || {};
    this._reverseStreams = this._reverseStreams || {};

    stream.getTracks().forEach(track => {
      const alreadyExists = this.getSenders().find(s => s.track === track);
      if (alreadyExists) {
        throw new DOMException('Track already exists.',
            'InvalidAccessError');
      }
    });
    // Add identity mapping for consistency with addTrack.
    // Unless this is being used with a stream from addTrack.
    if (!this._reverseStreams[stream.id]) {
      const newStream = new window.MediaStream(stream.getTracks());
      this._streams[stream.id] = newStream;
      this._reverseStreams[newStream.id] = stream;
      stream = newStream;
    }
    origAddStream.apply(this, [stream]);
  };

  const origRemoveStream = window.RTCPeerConnection.prototype.removeStream;
  window.RTCPeerConnection.prototype.removeStream =
    function removeStream(stream) {
      this._streams = this._streams || {};
      this._reverseStreams = this._reverseStreams || {};

      origRemoveStream.apply(this, [(this._streams[stream.id] || stream)]);
      delete this._reverseStreams[(this._streams[stream.id] ?
          this._streams[stream.id].id : stream.id)];
      delete this._streams[stream.id];
    };

  window.RTCPeerConnection.prototype.addTrack =
    function addTrack(track, stream) {
      if (this.signalingState === 'closed') {
        throw new DOMException(
          'The RTCPeerConnection\'s signalingState is \'closed\'.',
          'InvalidStateError');
      }
      const streams = [].slice.call(arguments, 1);
      if (streams.length !== 1 ||
          !streams[0].getTracks().find(t => t === track)) {
        // this is not fully correct but all we can manage without
        // [[associated MediaStreams]] internal slot.
        throw new DOMException(
          'The adapter.js addTrack polyfill only supports a single ' +
          ' stream which is associated with the specified track.',
          'NotSupportedError');
      }

      const alreadyExists = this.getSenders().find(s => s.track === track);
      if (alreadyExists) {
        throw new DOMException('Track already exists.',
            'InvalidAccessError');
      }

      this._streams = this._streams || {};
      this._reverseStreams = this._reverseStreams || {};
      const oldStream = this._streams[stream.id];
      if (oldStream) {
        // this is using odd Chrome behaviour, use with caution:
        // https://bugs.chromium.org/p/webrtc/issues/detail?id=7815
        // Note: we rely on the high-level addTrack/dtmf shim to
        // create the sender with a dtmf sender.
        oldStream.addTrack(track);

        // Trigger ONN async.
        Promise.resolve().then(() => {
          this.dispatchEvent(new Event('negotiationneeded'));
        });
      } else {
        const newStream = new window.MediaStream([track]);
        this._streams[stream.id] = newStream;
        this._reverseStreams[newStream.id] = stream;
        this.addStream(newStream);
      }
      return this.getSenders().find(s => s.track === track);
    };

  // replace the internal stream id with the external one and
  // vice versa.
  function replaceInternalStreamId(pc, description) {
    let sdp = description.sdp;
    Object.keys(pc._reverseStreams || []).forEach(internalId => {
      const externalStream = pc._reverseStreams[internalId];
      const internalStream = pc._streams[externalStream.id];
      sdp = sdp.replace(new RegExp(internalStream.id, 'g'),
          externalStream.id);
    });
    return new RTCSessionDescription({
      type: description.type,
      sdp
    });
  }
  function replaceExternalStreamId(pc, description) {
    let sdp = description.sdp;
    Object.keys(pc._reverseStreams || []).forEach(internalId => {
      const externalStream = pc._reverseStreams[internalId];
      const internalStream = pc._streams[externalStream.id];
      sdp = sdp.replace(new RegExp(externalStream.id, 'g'),
          internalStream.id);
    });
    return new RTCSessionDescription({
      type: description.type,
      sdp
    });
  }
  ['createOffer', 'createAnswer'].forEach(function(method) {
    const nativeMethod = window.RTCPeerConnection.prototype[method];
    const methodObj = {[method]() {
      const args = arguments;
      const isLegacyCall = arguments.length &&
          typeof arguments[0] === 'function';
      if (isLegacyCall) {
        return nativeMethod.apply(this, [
          (description) => {
            const desc = replaceInternalStreamId(this, description);
            args[0].apply(null, [desc]);
          },
          (err) => {
            if (args[1]) {
              args[1].apply(null, err);
            }
          }, arguments[2]
        ]);
      }
      return nativeMethod.apply(this, arguments)
      .then(description => replaceInternalStreamId(this, description));
    }};
    window.RTCPeerConnection.prototype[method] = methodObj[method];
  });

  const origSetLocalDescription =
      window.RTCPeerConnection.prototype.setLocalDescription;
  window.RTCPeerConnection.prototype.setLocalDescription =
    function setLocalDescription() {
      if (!arguments.length || !arguments[0].type) {
        return origSetLocalDescription.apply(this, arguments);
      }
      arguments[0] = replaceExternalStreamId(this, arguments[0]);
      return origSetLocalDescription.apply(this, arguments);
    };

  // TODO: mangle getStats: https://w3c.github.io/webrtc-stats/#dom-rtcmediastreamstats-streamidentifier

  const origLocalDescription = Object.getOwnPropertyDescriptor(
      window.RTCPeerConnection.prototype, 'localDescription');
  Object.defineProperty(window.RTCPeerConnection.prototype,
      'localDescription', {
        get() {
          const description = origLocalDescription.get.apply(this);
          if (description.type === '') {
            return description;
          }
          return replaceInternalStreamId(this, description);
        }
      });

  window.RTCPeerConnection.prototype.removeTrack =
    function removeTrack(sender) {
      if (this.signalingState === 'closed') {
        throw new DOMException(
          'The RTCPeerConnection\'s signalingState is \'closed\'.',
          'InvalidStateError');
      }
      // We can not yet check for sender instanceof RTCRtpSender
      // since we shim RTPSender. So we check if sender._pc is set.
      if (!sender._pc) {
        throw new DOMException('Argument 1 of RTCPeerConnection.removeTrack ' +
            'does not implement interface RTCRtpSender.', 'TypeError');
      }
      const isLocal = sender._pc === this;
      if (!isLocal) {
        throw new DOMException('Sender was not created by this connection.',
            'InvalidAccessError');
      }

      // Search for the native stream the senders track belongs to.
      this._streams = this._streams || {};
      let stream;
      Object.keys(this._streams).forEach(streamid => {
        const hasTrack = this._streams[streamid].getTracks()
          .find(track => sender.track === track);
        if (hasTrack) {
          stream = this._streams[streamid];
        }
      });

      if (stream) {
        if (stream.getTracks().length === 1) {
          // if this is the last track of the stream, remove the stream. This
          // takes care of any shimmed _senders.
          this.removeStream(this._reverseStreams[stream.id]);
        } else {
          // relying on the same odd chrome behaviour as above.
          stream.removeTrack(sender.track);
        }
        this.dispatchEvent(new Event('negotiationneeded'));
      }
    };
}

function shimPeerConnection(window, browserDetails) {
  if (!window.RTCPeerConnection && window.webkitRTCPeerConnection) {
    // very basic support for old versions.
    window.RTCPeerConnection = window.webkitRTCPeerConnection;
  }
  if (!window.RTCPeerConnection) {
    return;
  }

  // shim implicit creation of RTCSessionDescription/RTCIceCandidate
  if (browserDetails.version < 53) {
    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
        .forEach(function(method) {
          const nativeMethod = window.RTCPeerConnection.prototype[method];
          const methodObj = {[method]() {
            arguments[0] = new ((method === 'addIceCandidate') ?
                window.RTCIceCandidate :
                window.RTCSessionDescription)(arguments[0]);
            return nativeMethod.apply(this, arguments);
          }};
          window.RTCPeerConnection.prototype[method] = methodObj[method];
        });
  }
}

// Attempt to fix ONN in plan-b mode.
function fixNegotiationNeeded(window, browserDetails) {
  _utils_js__WEBPACK_IMPORTED_MODULE_0__.wrapPeerConnectionEvent(window, 'negotiationneeded', e => {
    const pc = e.target;
    if (browserDetails.version < 72 || (pc.getConfiguration &&
        pc.getConfiguration().sdpSemantics === 'plan-b')) {
      if (pc.signalingState !== 'stable') {
        return;
      }
    }
    return e;
  });
}


/***/ }),

/***/ "./node_modules/webrtc-adapter/src/js/chrome/getdisplaymedia.js":
/*!**********************************************************************!*\
  !*** ./node_modules/webrtc-adapter/src/js/chrome/getdisplaymedia.js ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "shimGetDisplayMedia": () => (/* binding */ shimGetDisplayMedia)
/* harmony export */ });
/*
 *  Copyright (c) 2018 The adapter.js project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */

function shimGetDisplayMedia(window, getSourceId) {
  if (window.navigator.mediaDevices &&
    'getDisplayMedia' in window.navigator.mediaDevices) {
    return;
  }
  if (!(window.navigator.mediaDevices)) {
    return;
  }
  // getSourceId is a function that returns a promise resolving with
  // the sourceId of the screen/window/tab to be shared.
  if (typeof getSourceId !== 'function') {
    console.error('shimGetDisplayMedia: getSourceId argument is not ' +
        'a function');
    return;
  }
  window.navigator.mediaDevices.getDisplayMedia =
    function getDisplayMedia(constraints) {
      return getSourceId(constraints)
        .then(sourceId => {
          const widthSpecified = constraints.video && constraints.video.width;
          const heightSpecified = constraints.video &&
            constraints.video.height;
          const frameRateSpecified = constraints.video &&
            constraints.video.frameRate;
          constraints.video = {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId,
              maxFrameRate: frameRateSpecified || 3
            }
          };
          if (widthSpecified) {
            constraints.video.mandatory.maxWidth = widthSpecified;
          }
          if (heightSpecified) {
            constraints.video.mandatory.maxHeight = heightSpecified;
          }
          return window.navigator.mediaDevices.getUserMedia(constraints);
        });
    };
}


/***/ }),

/***/ "./node_modules/webrtc-adapter/src/js/chrome/getusermedia.js":
/*!*******************************************************************!*\
  !*** ./node_modules/webrtc-adapter/src/js/chrome/getusermedia.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "shimGetUserMedia": () => (/* binding */ shimGetUserMedia)
/* harmony export */ });
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils.js */ "./node_modules/webrtc-adapter/src/js/utils.js");
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */


const logging = _utils_js__WEBPACK_IMPORTED_MODULE_0__.log;

function shimGetUserMedia(window, browserDetails) {
  const navigator = window && window.navigator;

  if (!navigator.mediaDevices) {
    return;
  }

  const constraintsToChrome_ = function(c) {
    if (typeof c !== 'object' || c.mandatory || c.optional) {
      return c;
    }
    const cc = {};
    Object.keys(c).forEach(key => {
      if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
        return;
      }
      const r = (typeof c[key] === 'object') ? c[key] : {ideal: c[key]};
      if (r.exact !== undefined && typeof r.exact === 'number') {
        r.min = r.max = r.exact;
      }
      const oldname_ = function(prefix, name) {
        if (prefix) {
          return prefix + name.charAt(0).toUpperCase() + name.slice(1);
        }
        return (name === 'deviceId') ? 'sourceId' : name;
      };
      if (r.ideal !== undefined) {
        cc.optional = cc.optional || [];
        let oc = {};
        if (typeof r.ideal === 'number') {
          oc[oldname_('min', key)] = r.ideal;
          cc.optional.push(oc);
          oc = {};
          oc[oldname_('max', key)] = r.ideal;
          cc.optional.push(oc);
        } else {
          oc[oldname_('', key)] = r.ideal;
          cc.optional.push(oc);
        }
      }
      if (r.exact !== undefined && typeof r.exact !== 'number') {
        cc.mandatory = cc.mandatory || {};
        cc.mandatory[oldname_('', key)] = r.exact;
      } else {
        ['min', 'max'].forEach(mix => {
          if (r[mix] !== undefined) {
            cc.mandatory = cc.mandatory || {};
            cc.mandatory[oldname_(mix, key)] = r[mix];
          }
        });
      }
    });
    if (c.advanced) {
      cc.optional = (cc.optional || []).concat(c.advanced);
    }
    return cc;
  };

  const shimConstraints_ = function(constraints, func) {
    if (browserDetails.version >= 61) {
      return func(constraints);
    }
    constraints = JSON.parse(JSON.stringify(constraints));
    if (constraints && typeof constraints.audio === 'object') {
      const remap = function(obj, a, b) {
        if (a in obj && !(b in obj)) {
          obj[b] = obj[a];
          delete obj[a];
        }
      };
      constraints = JSON.parse(JSON.stringify(constraints));
      remap(constraints.audio, 'autoGainControl', 'googAutoGainControl');
      remap(constraints.audio, 'noiseSuppression', 'googNoiseSuppression');
      constraints.audio = constraintsToChrome_(constraints.audio);
    }
    if (constraints && typeof constraints.video === 'object') {
      // Shim facingMode for mobile & surface pro.
      let face = constraints.video.facingMode;
      face = face && ((typeof face === 'object') ? face : {ideal: face});
      const getSupportedFacingModeLies = browserDetails.version < 66;

      if ((face && (face.exact === 'user' || face.exact === 'environment' ||
                    face.ideal === 'user' || face.ideal === 'environment')) &&
          !(navigator.mediaDevices.getSupportedConstraints &&
            navigator.mediaDevices.getSupportedConstraints().facingMode &&
            !getSupportedFacingModeLies)) {
        delete constraints.video.facingMode;
        let matches;
        if (face.exact === 'environment' || face.ideal === 'environment') {
          matches = ['back', 'rear'];
        } else if (face.exact === 'user' || face.ideal === 'user') {
          matches = ['front'];
        }
        if (matches) {
          // Look for matches in label, or use last cam for back (typical).
          return navigator.mediaDevices.enumerateDevices()
          .then(devices => {
            devices = devices.filter(d => d.kind === 'videoinput');
            let dev = devices.find(d => matches.some(match =>
              d.label.toLowerCase().includes(match)));
            if (!dev && devices.length && matches.includes('back')) {
              dev = devices[devices.length - 1]; // more likely the back cam
            }
            if (dev) {
              constraints.video.deviceId = face.exact ? {exact: dev.deviceId} :
                                                        {ideal: dev.deviceId};
            }
            constraints.video = constraintsToChrome_(constraints.video);
            logging('chrome: ' + JSON.stringify(constraints));
            return func(constraints);
          });
        }
      }
      constraints.video = constraintsToChrome_(constraints.video);
    }
    logging('chrome: ' + JSON.stringify(constraints));
    return func(constraints);
  };

  const shimError_ = function(e) {
    if (browserDetails.version >= 64) {
      return e;
    }
    return {
      name: {
        PermissionDeniedError: 'NotAllowedError',
        PermissionDismissedError: 'NotAllowedError',
        InvalidStateError: 'NotAllowedError',
        DevicesNotFoundError: 'NotFoundError',
        ConstraintNotSatisfiedError: 'OverconstrainedError',
        TrackStartError: 'NotReadableError',
        MediaDeviceFailedDueToShutdown: 'NotAllowedError',
        MediaDeviceKillSwitchOn: 'NotAllowedError',
        TabCaptureError: 'AbortError',
        ScreenCaptureError: 'AbortError',
        DeviceCaptureError: 'AbortError'
      }[e.name] || e.name,
      message: e.message,
      constraint: e.constraint || e.constraintName,
      toString() {
        return this.name + (this.message && ': ') + this.message;
      }
    };
  };

  const getUserMedia_ = function(constraints, onSuccess, onError) {
    shimConstraints_(constraints, c => {
      navigator.webkitGetUserMedia(c, onSuccess, e => {
        if (onError) {
          onError(shimError_(e));
        }
      });
    });
  };
  navigator.getUserMedia = getUserMedia_.bind(navigator);

  // Even though Chrome 45 has navigator.mediaDevices and a getUserMedia
  // function which returns a Promise, it does not accept spec-style
  // constraints.
  if (navigator.mediaDevices.getUserMedia) {
    const origGetUserMedia = navigator.mediaDevices.getUserMedia.
        bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(cs) {
      return shimConstraints_(cs, c => origGetUserMedia(c).then(stream => {
        if (c.audio && !stream.getAudioTracks().length ||
            c.video && !stream.getVideoTracks().length) {
          stream.getTracks().forEach(track => {
            track.stop();
          });
          throw new DOMException('', 'NotFoundError');
        }
        return stream;
      }, e => Promise.reject(shimError_(e))));
    };
  }
}


/***/ }),

/***/ "./node_modules/webrtc-adapter/src/js/common_shim.js":
/*!***********************************************************!*\
  !*** ./node_modules/webrtc-adapter/src/js/common_shim.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "shimRTCIceCandidate": () => (/* binding */ shimRTCIceCandidate),
/* harmony export */   "shimMaxMessageSize": () => (/* binding */ shimMaxMessageSize),
/* harmony export */   "shimSendThrowTypeError": () => (/* binding */ shimSendThrowTypeError),
/* harmony export */   "shimConnectionState": () => (/* binding */ shimConnectionState),
/* harmony export */   "removeExtmapAllowMixed": () => (/* binding */ removeExtmapAllowMixed),
/* harmony export */   "shimAddIceCandidateNullOrEmpty": () => (/* binding */ shimAddIceCandidateNullOrEmpty)
/* harmony export */ });
/* harmony import */ var sdp__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! sdp */ "./node_modules/sdp/sdp.js");
/* harmony import */ var sdp__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(sdp__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils */ "./node_modules/webrtc-adapter/src/js/utils.js");
/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */





function shimRTCIceCandidate(window) {
  // foundation is arbitrarily chosen as an indicator for full support for
  // https://w3c.github.io/webrtc-pc/#rtcicecandidate-interface
  if (!window.RTCIceCandidate || (window.RTCIceCandidate && 'foundation' in
      window.RTCIceCandidate.prototype)) {
    return;
  }

  const NativeRTCIceCandidate = window.RTCIceCandidate;
  window.RTCIceCandidate = function RTCIceCandidate(args) {
    // Remove the a= which shouldn't be part of the candidate string.
    if (typeof args === 'object' && args.candidate &&
        args.candidate.indexOf('a=') === 0) {
      args = JSON.parse(JSON.stringify(args));
      args.candidate = args.candidate.substr(2);
    }

    if (args.candidate && args.candidate.length) {
      // Augment the native candidate with the parsed fields.
      const nativeCandidate = new NativeRTCIceCandidate(args);
      const parsedCandidate = sdp__WEBPACK_IMPORTED_MODULE_0___default().parseCandidate(args.candidate);
      const augmentedCandidate = Object.assign(nativeCandidate,
          parsedCandidate);

      // Add a serializer that does not serialize the extra attributes.
      augmentedCandidate.toJSON = function toJSON() {
        return {
          candidate: augmentedCandidate.candidate,
          sdpMid: augmentedCandidate.sdpMid,
          sdpMLineIndex: augmentedCandidate.sdpMLineIndex,
          usernameFragment: augmentedCandidate.usernameFragment,
        };
      };
      return augmentedCandidate;
    }
    return new NativeRTCIceCandidate(args);
  };
  window.RTCIceCandidate.prototype = NativeRTCIceCandidate.prototype;

  // Hook up the augmented candidate in onicecandidate and
  // addEventListener('icecandidate', ...)
  _utils__WEBPACK_IMPORTED_MODULE_1__.wrapPeerConnectionEvent(window, 'icecandidate', e => {
    if (e.candidate) {
      Object.defineProperty(e, 'candidate', {
        value: new window.RTCIceCandidate(e.candidate),
        writable: 'false'
      });
    }
    return e;
  });
}

function shimMaxMessageSize(window, browserDetails) {
  if (!window.RTCPeerConnection) {
    return;
  }

  if (!('sctp' in window.RTCPeerConnection.prototype)) {
    Object.defineProperty(window.RTCPeerConnection.prototype, 'sctp', {
      get() {
        return typeof this._sctp === 'undefined' ? null : this._sctp;
      }
    });
  }

  const sctpInDescription = function(description) {
    if (!description || !description.sdp) {
      return false;
    }
    const sections = sdp__WEBPACK_IMPORTED_MODULE_0___default().splitSections(description.sdp);
    sections.shift();
    return sections.some(mediaSection => {
      const mLine = sdp__WEBPACK_IMPORTED_MODULE_0___default().parseMLine(mediaSection);
      return mLine && mLine.kind === 'application'
          && mLine.protocol.indexOf('SCTP') !== -1;
    });
  };

  const getRemoteFirefoxVersion = function(description) {
    // TODO: Is there a better solution for detecting Firefox?
    const match = description.sdp.match(/mozilla...THIS_IS_SDPARTA-(\d+)/);
    if (match === null || match.length < 2) {
      return -1;
    }
    const version = parseInt(match[1], 10);
    // Test for NaN (yes, this is ugly)
    return version !== version ? -1 : version;
  };

  const getCanSendMaxMessageSize = function(remoteIsFirefox) {
    // Every implementation we know can send at least 64 KiB.
    // Note: Although Chrome is technically able to send up to 256 KiB, the
    //       data does not reach the other peer reliably.
    //       See: https://bugs.chromium.org/p/webrtc/issues/detail?id=8419
    let canSendMaxMessageSize = 65536;
    if (browserDetails.browser === 'firefox') {
      if (browserDetails.version < 57) {
        if (remoteIsFirefox === -1) {
          // FF < 57 will send in 16 KiB chunks using the deprecated PPID
          // fragmentation.
          canSendMaxMessageSize = 16384;
        } else {
          // However, other FF (and RAWRTC) can reassemble PPID-fragmented
          // messages. Thus, supporting ~2 GiB when sending.
          canSendMaxMessageSize = 2147483637;
        }
      } else if (browserDetails.version < 60) {
        // Currently, all FF >= 57 will reset the remote maximum message size
        // to the default value when a data channel is created at a later
        // stage. :(
        // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1426831
        canSendMaxMessageSize =
          browserDetails.version === 57 ? 65535 : 65536;
      } else {
        // FF >= 60 supports sending ~2 GiB
        canSendMaxMessageSize = 2147483637;
      }
    }
    return canSendMaxMessageSize;
  };

  const getMaxMessageSize = function(description, remoteIsFirefox) {
    // Note: 65536 bytes is the default value from the SDP spec. Also,
    //       every implementation we know supports receiving 65536 bytes.
    let maxMessageSize = 65536;

    // FF 57 has a slightly incorrect default remote max message size, so
    // we need to adjust it here to avoid a failure when sending.
    // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1425697
    if (browserDetails.browser === 'firefox'
         && browserDetails.version === 57) {
      maxMessageSize = 65535;
    }

    const match = sdp__WEBPACK_IMPORTED_MODULE_0___default().matchPrefix(description.sdp,
      'a=max-message-size:');
    if (match.length > 0) {
      maxMessageSize = parseInt(match[0].substr(19), 10);
    } else if (browserDetails.browser === 'firefox' &&
                remoteIsFirefox !== -1) {
      // If the maximum message size is not present in the remote SDP and
      // both local and remote are Firefox, the remote peer can receive
      // ~2 GiB.
      maxMessageSize = 2147483637;
    }
    return maxMessageSize;
  };

  const origSetRemoteDescription =
      window.RTCPeerConnection.prototype.setRemoteDescription;
  window.RTCPeerConnection.prototype.setRemoteDescription =
    function setRemoteDescription() {
      this._sctp = null;
      // Chrome decided to not expose .sctp in plan-b mode.
      // As usual, adapter.js has to do an 'ugly worakaround'
      // to cover up the mess.
      if (browserDetails.browser === 'chrome' && browserDetails.version >= 76) {
        const {sdpSemantics} = this.getConfiguration();
        if (sdpSemantics === 'plan-b') {
          Object.defineProperty(this, 'sctp', {
            get() {
              return typeof this._sctp === 'undefined' ? null : this._sctp;
            },
            enumerable: true,
            configurable: true,
          });
        }
      }

      if (sctpInDescription(arguments[0])) {
        // Check if the remote is FF.
        const isFirefox = getRemoteFirefoxVersion(arguments[0]);

        // Get the maximum message size the local peer is capable of sending
        const canSendMMS = getCanSendMaxMessageSize(isFirefox);

        // Get the maximum message size of the remote peer.
        const remoteMMS = getMaxMessageSize(arguments[0], isFirefox);

        // Determine final maximum message size
        let maxMessageSize;
        if (canSendMMS === 0 && remoteMMS === 0) {
          maxMessageSize = Number.POSITIVE_INFINITY;
        } else if (canSendMMS === 0 || remoteMMS === 0) {
          maxMessageSize = Math.max(canSendMMS, remoteMMS);
        } else {
          maxMessageSize = Math.min(canSendMMS, remoteMMS);
        }

        // Create a dummy RTCSctpTransport object and the 'maxMessageSize'
        // attribute.
        const sctp = {};
        Object.defineProperty(sctp, 'maxMessageSize', {
          get() {
            return maxMessageSize;
          }
        });
        this._sctp = sctp;
      }

      return origSetRemoteDescription.apply(this, arguments);
    };
}

function shimSendThrowTypeError(window) {
  if (!(window.RTCPeerConnection &&
      'createDataChannel' in window.RTCPeerConnection.prototype)) {
    return;
  }

  // Note: Although Firefox >= 57 has a native implementation, the maximum
  //       message size can be reset for all data channels at a later stage.
  //       See: https://bugzilla.mozilla.org/show_bug.cgi?id=1426831

  function wrapDcSend(dc, pc) {
    const origDataChannelSend = dc.send;
    dc.send = function send() {
      const data = arguments[0];
      const length = data.length || data.size || data.byteLength;
      if (dc.readyState === 'open' &&
          pc.sctp && length > pc.sctp.maxMessageSize) {
        throw new TypeError('Message too large (can send a maximum of ' +
          pc.sctp.maxMessageSize + ' bytes)');
      }
      return origDataChannelSend.apply(dc, arguments);
    };
  }
  const origCreateDataChannel =
    window.RTCPeerConnection.prototype.createDataChannel;
  window.RTCPeerConnection.prototype.createDataChannel =
    function createDataChannel() {
      const dataChannel = origCreateDataChannel.apply(this, arguments);
      wrapDcSend(dataChannel, this);
      return dataChannel;
    };
  _utils__WEBPACK_IMPORTED_MODULE_1__.wrapPeerConnectionEvent(window, 'datachannel', e => {
    wrapDcSend(e.channel, e.target);
    return e;
  });
}


/* shims RTCConnectionState by pretending it is the same as iceConnectionState.
 * See https://bugs.chromium.org/p/webrtc/issues/detail?id=6145#c12
 * for why this is a valid hack in Chrome. In Firefox it is slightly incorrect
 * since DTLS failures would be hidden. See
 * https://bugzilla.mozilla.org/show_bug.cgi?id=1265827
 * for the Firefox tracking bug.
 */
function shimConnectionState(window) {
  if (!window.RTCPeerConnection ||
      'connectionState' in window.RTCPeerConnection.prototype) {
    return;
  }
  const proto = window.RTCPeerConnection.prototype;
  Object.defineProperty(proto, 'connectionState', {
    get() {
      return {
        completed: 'connected',
        checking: 'connecting'
      }[this.iceConnectionState] || this.iceConnectionState;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(proto, 'onconnectionstatechange', {
    get() {
      return this._onconnectionstatechange || null;
    },
    set(cb) {
      if (this._onconnectionstatechange) {
        this.removeEventListener('connectionstatechange',
            this._onconnectionstatechange);
        delete this._onconnectionstatechange;
      }
      if (cb) {
        this.addEventListener('connectionstatechange',
            this._onconnectionstatechange = cb);
      }
    },
    enumerable: true,
    configurable: true
  });

  ['setLocalDescription', 'setRemoteDescription'].forEach((method) => {
    const origMethod = proto[method];
    proto[method] = function() {
      if (!this._connectionstatechangepoly) {
        this._connectionstatechangepoly = e => {
          const pc = e.target;
          if (pc._lastConnectionState !== pc.connectionState) {
            pc._lastConnectionState = pc.connectionState;
            const newEvent = new Event('connectionstatechange', e);
            pc.dispatchEvent(newEvent);
          }
          return e;
        };
        this.addEventListener('iceconnectionstatechange',
          this._connectionstatechangepoly);
      }
      return origMethod.apply(this, arguments);
    };
  });
}

function removeExtmapAllowMixed(window, browserDetails) {
  /* remove a=extmap-allow-mixed for webrtc.org < M71 */
  if (!window.RTCPeerConnection) {
    return;
  }
  if (browserDetails.browser === 'chrome' && browserDetails.version >= 71) {
    return;
  }
  if (browserDetails.browser === 'safari' && browserDetails.version >= 605) {
    return;
  }
  const nativeSRD = window.RTCPeerConnection.prototype.setRemoteDescription;
  window.RTCPeerConnection.prototype.setRemoteDescription =
  function setRemoteDescription(desc) {
    if (desc && desc.sdp && desc.sdp.indexOf('\na=extmap-allow-mixed') !== -1) {
      const sdp = desc.sdp.split('\n').filter((line) => {
        return line.trim() !== 'a=extmap-allow-mixed';
      }).join('\n');
      // Safari enforces read-only-ness of RTCSessionDescription fields.
      if (window.RTCSessionDescription &&
          desc instanceof window.RTCSessionDescription) {
        arguments[0] = new window.RTCSessionDescription({
          type: desc.type,
          sdp,
        });
      } else {
        desc.sdp = sdp;
      }
    }
    return nativeSRD.apply(this, arguments);
  };
}

function shimAddIceCandidateNullOrEmpty(window, browserDetails) {
  // Support for addIceCandidate(null or undefined)
  // as well as addIceCandidate({candidate: "", ...})
  // https://bugs.chromium.org/p/chromium/issues/detail?id=978582
  // Note: must be called before other polyfills which change the signature.
  if (!(window.RTCPeerConnection && window.RTCPeerConnection.prototype)) {
    return;
  }
  const nativeAddIceCandidate =
      window.RTCPeerConnection.prototype.addIceCandidate;
  if (!nativeAddIceCandidate || nativeAddIceCandidate.length === 0) {
    return;
  }
  window.RTCPeerConnection.prototype.addIceCandidate =
    function addIceCandidate() {
      if (!arguments[0]) {
        if (arguments[1]) {
          arguments[1].apply(null);
        }
        return Promise.resolve();
      }
      // Firefox 68+ emits and processes {candidate: "", ...}, ignore
      // in older versions.
      // Native support for ignoring exists for Chrome M77+.
      // Safari ignores as well, exact version unknown but works in the same
      // version that also ignores addIceCandidate(null).
      if (((browserDetails.browser === 'chrome' && browserDetails.version < 78)
           || (browserDetails.browser === 'firefox'
               && browserDetails.version < 68)
           || (browserDetails.browser === 'safari'))
          && arguments[0] && arguments[0].candidate === '') {
        return Promise.resolve();
      }
      return nativeAddIceCandidate.apply(this, arguments);
    };
}


/***/ }),

/***/ "./node_modules/webrtc-adapter/src/js/edge/edge_shim.js":
/*!**************************************************************!*\
  !*** ./node_modules/webrtc-adapter/src/js/edge/edge_shim.js ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "shimGetUserMedia": () => (/* reexport safe */ _getusermedia__WEBPACK_IMPORTED_MODULE_3__.shimGetUserMedia),
/* harmony export */   "shimGetDisplayMedia": () => (/* reexport safe */ _getdisplaymedia__WEBPACK_IMPORTED_MODULE_4__.shimGetDisplayMedia),
/* harmony export */   "shimPeerConnection": () => (/* binding */ shimPeerConnection),
/* harmony export */   "shimReplaceTrack": () => (/* binding */ shimReplaceTrack)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./node_modules/webrtc-adapter/src/js/utils.js");
/* harmony import */ var _filtericeservers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./filtericeservers */ "./node_modules/webrtc-adapter/src/js/edge/filtericeservers.js");
/* harmony import */ var rtcpeerconnection_shim__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! rtcpeerconnection-shim */ "./node_modules/rtcpeerconnection-shim/rtcpeerconnection.js");
/* harmony import */ var rtcpeerconnection_shim__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(rtcpeerconnection_shim__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _getusermedia__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./getusermedia */ "./node_modules/webrtc-adapter/src/js/edge/getusermedia.js");
/* harmony import */ var _getdisplaymedia__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./getdisplaymedia */ "./node_modules/webrtc-adapter/src/js/edge/getdisplaymedia.js");
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */









function shimPeerConnection(window, browserDetails) {
  if (window.RTCIceGatherer) {
    if (!window.RTCIceCandidate) {
      window.RTCIceCandidate = function RTCIceCandidate(args) {
        return args;
      };
    }
    if (!window.RTCSessionDescription) {
      window.RTCSessionDescription = function RTCSessionDescription(args) {
        return args;
      };
    }
    // this adds an additional event listener to MediaStrackTrack that signals
    // when a tracks enabled property was changed. Workaround for a bug in
    // addStream, see below. No longer required in 15025+
    if (browserDetails.version < 15025) {
      const origMSTEnabled = Object.getOwnPropertyDescriptor(
          window.MediaStreamTrack.prototype, 'enabled');
      Object.defineProperty(window.MediaStreamTrack.prototype, 'enabled', {
        set(value) {
          origMSTEnabled.set.call(this, value);
          const ev = new Event('enabled');
          ev.enabled = value;
          this.dispatchEvent(ev);
        }
      });
    }
  }

  // ORTC defines the DTMF sender a bit different.
  // https://github.com/w3c/ortc/issues/714
  if (window.RTCRtpSender && !('dtmf' in window.RTCRtpSender.prototype)) {
    Object.defineProperty(window.RTCRtpSender.prototype, 'dtmf', {
      get() {
        if (this._dtmf === undefined) {
          if (this.track.kind === 'audio') {
            this._dtmf = new window.RTCDtmfSender(this);
          } else if (this.track.kind === 'video') {
            this._dtmf = null;
          }
        }
        return this._dtmf;
      }
    });
  }
  // Edge currently only implements the RTCDtmfSender, not the
  // RTCDTMFSender alias. See http://draft.ortc.org/#rtcdtmfsender2*
  if (window.RTCDtmfSender && !window.RTCDTMFSender) {
    window.RTCDTMFSender = window.RTCDtmfSender;
  }

  const RTCPeerConnectionShim = rtcpeerconnection_shim__WEBPACK_IMPORTED_MODULE_2___default()(window,
      browserDetails.version);
  window.RTCPeerConnection = function RTCPeerConnection(config) {
    if (config && config.iceServers) {
      config.iceServers = (0,_filtericeservers__WEBPACK_IMPORTED_MODULE_1__.filterIceServers)(config.iceServers,
        browserDetails.version);
      _utils__WEBPACK_IMPORTED_MODULE_0__.log('ICE servers after filtering:', config.iceServers);
    }
    return new RTCPeerConnectionShim(config);
  };
  window.RTCPeerConnection.prototype = RTCPeerConnectionShim.prototype;
}

function shimReplaceTrack(window) {
  // ORTC has replaceTrack -- https://github.com/w3c/ortc/issues/614
  if (window.RTCRtpSender &&
      !('replaceTrack' in window.RTCRtpSender.prototype)) {
    window.RTCRtpSender.prototype.replaceTrack =
        window.RTCRtpSender.prototype.setTrack;
  }
}


/***/ }),

/***/ "./node_modules/webrtc-adapter/src/js/edge/filtericeservers.js":
/*!*********************************************************************!*\
  !*** ./node_modules/webrtc-adapter/src/js/edge/filtericeservers.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "filterIceServers": () => (/* binding */ filterIceServers)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./node_modules/webrtc-adapter/src/js/utils.js");
/*
 *  Copyright (c) 2018 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */



// Edge does not like
// 1) stun: filtered after 14393 unless ?transport=udp is present
// 2) turn: that does not have all of turn:host:port?transport=udp
// 3) turn: with ipv6 addresses
// 4) turn: occurring muliple times
function filterIceServers(iceServers, edgeVersion) {
  let hasTurn = false;
  iceServers = JSON.parse(JSON.stringify(iceServers));
  return iceServers.filter(server => {
    if (server && (server.urls || server.url)) {
      let urls = server.urls || server.url;
      if (server.url && !server.urls) {
        _utils__WEBPACK_IMPORTED_MODULE_0__.deprecated('RTCIceServer.url', 'RTCIceServer.urls');
      }
      const isString = typeof urls === 'string';
      if (isString) {
        urls = [urls];
      }
      urls = urls.filter(url => {
        // filter STUN unconditionally.
        if (url.indexOf('stun:') === 0) {
          return false;
        }

        const validTurn = url.startsWith('turn') &&
            !url.startsWith('turn:[') &&
            url.includes('transport=udp');
        if (validTurn && !hasTurn) {
          hasTurn = true;
          return true;
        }
        return validTurn && !hasTurn;
      });

      delete server.url;
      server.urls = isString ? urls[0] : urls;
      return !!urls.length;
    }
  });
}


/***/ }),

/***/ "./node_modules/webrtc-adapter/src/js/edge/getdisplaymedia.js":
/*!********************************************************************!*\
  !*** ./node_modules/webrtc-adapter/src/js/edge/getdisplaymedia.js ***!
  \********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "shimGetDisplayMedia": () => (/* binding */ shimGetDisplayMedia)
/* harmony export */ });
/*
 *  Copyright (c) 2018 The adapter.js project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */


function shimGetDisplayMedia(window) {
  if (!('getDisplayMedia' in window.navigator)) {
    return;
  }
  if (!(window.navigator.mediaDevices)) {
    return;
  }
  if (window.navigator.mediaDevices &&
    'getDisplayMedia' in window.navigator.mediaDevices) {
    return;
  }
  window.navigator.mediaDevices.getDisplayMedia =
    window.navigator.getDisplayMedia.bind(window.navigator);
}


/***/ }),

/***/ "./node_modules/webrtc-adapter/src/js/edge/getusermedia.js":
/*!*****************************************************************!*\
  !*** ./node_modules/webrtc-adapter/src/js/edge/getusermedia.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "shimGetUserMedia": () => (/* binding */ shimGetUserMedia)
/* harmony export */ });
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */


function shimGetUserMedia(window) {
  const navigator = window && window.navigator;

  const shimError_ = function(e) {
    return {
      name: {PermissionDeniedError: 'NotAllowedError'}[e.name] || e.name,
      message: e.message,
      constraint: e.constraint,
      toString() {
        return this.name;
      }
    };
  };

  // getUserMedia error shim.
  const origGetUserMedia = navigator.mediaDevices.getUserMedia.
      bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = function(c) {
    return origGetUserMedia(c).catch(e => Promise.reject(shimError_(e)));
  };
}


/***/ }),

/***/ "./node_modules/webrtc-adapter/src/js/firefox/firefox_shim.js":
/*!********************************************************************!*\
  !*** ./node_modules/webrtc-adapter/src/js/firefox/firefox_shim.js ***!
  \********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "shimGetUserMedia": () => (/* reexport safe */ _getusermedia__WEBPACK_IMPORTED_MODULE_1__.shimGetUserMedia),
/* harmony export */   "shimGetDisplayMedia": () => (/* reexport safe */ _getdisplaymedia__WEBPACK_IMPORTED_MODULE_2__.shimGetDisplayMedia),
/* harmony export */   "shimOnTrack": () => (/* binding */ shimOnTrack),
/* harmony export */   "shimPeerConnection": () => (/* binding */ shimPeerConnection),
/* harmony export */   "shimSenderGetStats": () => (/* binding */ shimSenderGetStats),
/* harmony export */   "shimReceiverGetStats": () => (/* binding */ shimReceiverGetStats),
/* harmony export */   "shimRemoveStream": () => (/* binding */ shimRemoveStream),
/* harmony export */   "shimRTCDataChannel": () => (/* binding */ shimRTCDataChannel),
/* harmony export */   "shimAddTransceiver": () => (/* binding */ shimAddTransceiver),
/* harmony export */   "shimGetParameters": () => (/* binding */ shimGetParameters),
/* harmony export */   "shimCreateOffer": () => (/* binding */ shimCreateOffer),
/* harmony export */   "shimCreateAnswer": () => (/* binding */ shimCreateAnswer)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./node_modules/webrtc-adapter/src/js/utils.js");
/* harmony import */ var _getusermedia__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./getusermedia */ "./node_modules/webrtc-adapter/src/js/firefox/getusermedia.js");
/* harmony import */ var _getdisplaymedia__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./getdisplaymedia */ "./node_modules/webrtc-adapter/src/js/firefox/getdisplaymedia.js");
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */






function shimOnTrack(window) {
  if (typeof window === 'object' && window.RTCTrackEvent &&
      ('receiver' in window.RTCTrackEvent.prototype) &&
      !('transceiver' in window.RTCTrackEvent.prototype)) {
    Object.defineProperty(window.RTCTrackEvent.prototype, 'transceiver', {
      get() {
        return {receiver: this.receiver};
      }
    });
  }
}

function shimPeerConnection(window, browserDetails) {
  if (typeof window !== 'object' ||
      !(window.RTCPeerConnection || window.mozRTCPeerConnection)) {
    return; // probably media.peerconnection.enabled=false in about:config
  }
  if (!window.RTCPeerConnection && window.mozRTCPeerConnection) {
    // very basic support for old versions.
    window.RTCPeerConnection = window.mozRTCPeerConnection;
  }

  if (browserDetails.version < 53) {
    // shim away need for obsolete RTCIceCandidate/RTCSessionDescription.
    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
        .forEach(function(method) {
          const nativeMethod = window.RTCPeerConnection.prototype[method];
          const methodObj = {[method]() {
            arguments[0] = new ((method === 'addIceCandidate') ?
                window.RTCIceCandidate :
                window.RTCSessionDescription)(arguments[0]);
            return nativeMethod.apply(this, arguments);
          }};
          window.RTCPeerConnection.prototype[method] = methodObj[method];
        });
  }

  const modernStatsTypes = {
    inboundrtp: 'inbound-rtp',
    outboundrtp: 'outbound-rtp',
    candidatepair: 'candidate-pair',
    localcandidate: 'local-candidate',
    remotecandidate: 'remote-candidate'
  };

  const nativeGetStats = window.RTCPeerConnection.prototype.getStats;
  window.RTCPeerConnection.prototype.getStats = function getStats() {
    const [selector, onSucc, onErr] = arguments;
    return nativeGetStats.apply(this, [selector || null])
      .then(stats => {
        if (browserDetails.version < 53 && !onSucc) {
          // Shim only promise getStats with spec-hyphens in type names
          // Leave callback version alone; misc old uses of forEach before Map
          try {
            stats.forEach(stat => {
              stat.type = modernStatsTypes[stat.type] || stat.type;
            });
          } catch (e) {
            if (e.name !== 'TypeError') {
              throw e;
            }
            // Avoid TypeError: "type" is read-only, in old versions. 34-43ish
            stats.forEach((stat, i) => {
              stats.set(i, Object.assign({}, stat, {
                type: modernStatsTypes[stat.type] || stat.type
              }));
            });
          }
        }
        return stats;
      })
      .then(onSucc, onErr);
  };
}

function shimSenderGetStats(window) {
  if (!(typeof window === 'object' && window.RTCPeerConnection &&
      window.RTCRtpSender)) {
    return;
  }
  if (window.RTCRtpSender && 'getStats' in window.RTCRtpSender.prototype) {
    return;
  }
  const origGetSenders = window.RTCPeerConnection.prototype.getSenders;
  if (origGetSenders) {
    window.RTCPeerConnection.prototype.getSenders = function getSenders() {
      const senders = origGetSenders.apply(this, []);
      senders.forEach(sender => sender._pc = this);
      return senders;
    };
  }

  const origAddTrack = window.RTCPeerConnection.prototype.addTrack;
  if (origAddTrack) {
    window.RTCPeerConnection.prototype.addTrack = function addTrack() {
      const sender = origAddTrack.apply(this, arguments);
      sender._pc = this;
      return sender;
    };
  }
  window.RTCRtpSender.prototype.getStats = function getStats() {
    return this.track ? this._pc.getStats(this.track) :
        Promise.resolve(new Map());
  };
}

function shimReceiverGetStats(window) {
  if (!(typeof window === 'object' && window.RTCPeerConnection &&
      window.RTCRtpSender)) {
    return;
  }
  if (window.RTCRtpSender && 'getStats' in window.RTCRtpReceiver.prototype) {
    return;
  }
  const origGetReceivers = window.RTCPeerConnection.prototype.getReceivers;
  if (origGetReceivers) {
    window.RTCPeerConnection.prototype.getReceivers = function getReceivers() {
      const receivers = origGetReceivers.apply(this, []);
      receivers.forEach(receiver => receiver._pc = this);
      return receivers;
    };
  }
  _utils__WEBPACK_IMPORTED_MODULE_0__.wrapPeerConnectionEvent(window, 'track', e => {
    e.receiver._pc = e.srcElement;
    return e;
  });
  window.RTCRtpReceiver.prototype.getStats = function getStats() {
    return this._pc.getStats(this.track);
  };
}

function shimRemoveStream(window) {
  if (!window.RTCPeerConnection ||
      'removeStream' in window.RTCPeerConnection.prototype) {
    return;
  }
  window.RTCPeerConnection.prototype.removeStream =
    function removeStream(stream) {
      _utils__WEBPACK_IMPORTED_MODULE_0__.deprecated('removeStream', 'removeTrack');
      this.getSenders().forEach(sender => {
        if (sender.track && stream.getTracks().includes(sender.track)) {
          this.removeTrack(sender);
        }
      });
    };
}

function shimRTCDataChannel(window) {
  // rename DataChannel to RTCDataChannel (native fix in FF60):
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1173851
  if (window.DataChannel && !window.RTCDataChannel) {
    window.RTCDataChannel = window.DataChannel;
  }
}

function shimAddTransceiver(window) {
  // https://github.com/webrtcHacks/adapter/issues/998#issuecomment-516921647
  // Firefox ignores the init sendEncodings options passed to addTransceiver
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1396918
  if (!(typeof window === 'object' && window.RTCPeerConnection)) {
    return;
  }
  const origAddTransceiver = window.RTCPeerConnection.prototype.addTransceiver;
  if (origAddTransceiver) {
    window.RTCPeerConnection.prototype.addTransceiver =
      function addTransceiver() {
        this.setParametersPromises = [];
        const initParameters = arguments[1];
        const shouldPerformCheck = initParameters &&
                                  'sendEncodings' in initParameters;
        if (shouldPerformCheck) {
          // If sendEncodings params are provided, validate grammar
          initParameters.sendEncodings.forEach((encodingParam) => {
            if ('rid' in encodingParam) {
              const ridRegex = /^[a-z0-9]{0,16}$/i;
              if (!ridRegex.test(encodingParam.rid)) {
                throw new TypeError('Invalid RID value provided.');
              }
            }
            if ('scaleResolutionDownBy' in encodingParam) {
              if (!(parseFloat(encodingParam.scaleResolutionDownBy) >= 1.0)) {
                throw new RangeError('scale_resolution_down_by must be >= 1.0');
              }
            }
            if ('maxFramerate' in encodingParam) {
              if (!(parseFloat(encodingParam.maxFramerate) >= 0)) {
                throw new RangeError('max_framerate must be >= 0.0');
              }
            }
          });
        }
        const transceiver = origAddTransceiver.apply(this, arguments);
        if (shouldPerformCheck) {
          // Check if the init options were applied. If not we do this in an
          // asynchronous way and save the promise reference in a global object.
          // This is an ugly hack, but at the same time is way more robust than
          // checking the sender parameters before and after the createOffer
          // Also note that after the createoffer we are not 100% sure that
          // the params were asynchronously applied so we might miss the
          // opportunity to recreate offer.
          const {sender} = transceiver;
          const params = sender.getParameters();
          if (!('encodings' in params) ||
              // Avoid being fooled by patched getParameters() below.
              (params.encodings.length === 1 &&
               Object.keys(params.encodings[0]).length === 0)) {
            params.encodings = initParameters.sendEncodings;
            sender.sendEncodings = initParameters.sendEncodings;
            this.setParametersPromises.push(sender.setParameters(params)
              .then(() => {
                delete sender.sendEncodings;
              }).catch(() => {
                delete sender.sendEncodings;
              })
            );
          }
        }
        return transceiver;
      };
  }
}

function shimGetParameters(window) {
  if (!(typeof window === 'object' && window.RTCRtpSender)) {
    return;
  }
  const origGetParameters = window.RTCRtpSender.prototype.getParameters;
  if (origGetParameters) {
    window.RTCRtpSender.prototype.getParameters =
      function getParameters() {
        const params = origGetParameters.apply(this, arguments);
        if (!('encodings' in params)) {
          params.encodings = [].concat(this.sendEncodings || [{}]);
        }
        return params;
      };
  }
}

function shimCreateOffer(window) {
  // https://github.com/webrtcHacks/adapter/issues/998#issuecomment-516921647
  // Firefox ignores the init sendEncodings options passed to addTransceiver
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1396918
  if (!(typeof window === 'object' && window.RTCPeerConnection)) {
    return;
  }
  const origCreateOffer = window.RTCPeerConnection.prototype.createOffer;
  window.RTCPeerConnection.prototype.createOffer = function createOffer() {
    if (this.setParametersPromises && this.setParametersPromises.length) {
      return Promise.all(this.setParametersPromises)
      .then(() => {
        return origCreateOffer.apply(this, arguments);
      })
      .finally(() => {
        this.setParametersPromises = [];
      });
    }
    return origCreateOffer.apply(this, arguments);
  };
}

function shimCreateAnswer(window) {
  // https://github.com/webrtcHacks/adapter/issues/998#issuecomment-516921647
  // Firefox ignores the init sendEncodings options passed to addTransceiver
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1396918
  if (!(typeof window === 'object' && window.RTCPeerConnection)) {
    return;
  }
  const origCreateAnswer = window.RTCPeerConnection.prototype.createAnswer;
  window.RTCPeerConnection.prototype.createAnswer = function createAnswer() {
    if (this.setParametersPromises && this.setParametersPromises.length) {
      return Promise.all(this.setParametersPromises)
      .then(() => {
        return origCreateAnswer.apply(this, arguments);
      })
      .finally(() => {
        this.setParametersPromises = [];
      });
    }
    return origCreateAnswer.apply(this, arguments);
  };
}


/***/ }),

/***/ "./node_modules/webrtc-adapter/src/js/firefox/getdisplaymedia.js":
/*!***********************************************************************!*\
  !*** ./node_modules/webrtc-adapter/src/js/firefox/getdisplaymedia.js ***!
  \***********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "shimGetDisplayMedia": () => (/* binding */ shimGetDisplayMedia)
/* harmony export */ });
/*
 *  Copyright (c) 2018 The adapter.js project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */


function shimGetDisplayMedia(window, preferredMediaSource) {
  if (window.navigator.mediaDevices &&
    'getDisplayMedia' in window.navigator.mediaDevices) {
    return;
  }
  if (!(window.navigator.mediaDevices)) {
    return;
  }
  window.navigator.mediaDevices.getDisplayMedia =
    function getDisplayMedia(constraints) {
      if (!(constraints && constraints.video)) {
        const err = new DOMException('getDisplayMedia without video ' +
            'constraints is undefined');
        err.name = 'NotFoundError';
        // from https://heycam.github.io/webidl/#idl-DOMException-error-names
        err.code = 8;
        return Promise.reject(err);
      }
      if (constraints.video === true) {
        constraints.video = {mediaSource: preferredMediaSource};
      } else {
        constraints.video.mediaSource = preferredMediaSource;
      }
      return window.navigator.mediaDevices.getUserMedia(constraints);
    };
}


/***/ }),

/***/ "./node_modules/webrtc-adapter/src/js/firefox/getusermedia.js":
/*!********************************************************************!*\
  !*** ./node_modules/webrtc-adapter/src/js/firefox/getusermedia.js ***!
  \********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "shimGetUserMedia": () => (/* binding */ shimGetUserMedia)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./node_modules/webrtc-adapter/src/js/utils.js");
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */




function shimGetUserMedia(window, browserDetails) {
  const navigator = window && window.navigator;
  const MediaStreamTrack = window && window.MediaStreamTrack;

  navigator.getUserMedia = function(constraints, onSuccess, onError) {
    // Replace Firefox 44+'s deprecation warning with unprefixed version.
    _utils__WEBPACK_IMPORTED_MODULE_0__.deprecated('navigator.getUserMedia',
        'navigator.mediaDevices.getUserMedia');
    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
  };

  if (!(browserDetails.version > 55 &&
      'autoGainControl' in navigator.mediaDevices.getSupportedConstraints())) {
    const remap = function(obj, a, b) {
      if (a in obj && !(b in obj)) {
        obj[b] = obj[a];
        delete obj[a];
      }
    };

    const nativeGetUserMedia = navigator.mediaDevices.getUserMedia.
        bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(c) {
      if (typeof c === 'object' && typeof c.audio === 'object') {
        c = JSON.parse(JSON.stringify(c));
        remap(c.audio, 'autoGainControl', 'mozAutoGainControl');
        remap(c.audio, 'noiseSuppression', 'mozNoiseSuppression');
      }
      return nativeGetUserMedia(c);
    };

    if (MediaStreamTrack && MediaStreamTrack.prototype.getSettings) {
      const nativeGetSettings = MediaStreamTrack.prototype.getSettings;
      MediaStreamTrack.prototype.getSettings = function() {
        const obj = nativeGetSettings.apply(this, arguments);
        remap(obj, 'mozAutoGainControl', 'autoGainControl');
        remap(obj, 'mozNoiseSuppression', 'noiseSuppression');
        return obj;
      };
    }

    if (MediaStreamTrack && MediaStreamTrack.prototype.applyConstraints) {
      const nativeApplyConstraints =
        MediaStreamTrack.prototype.applyConstraints;
      MediaStreamTrack.prototype.applyConstraints = function(c) {
        if (this.kind === 'audio' && typeof c === 'object') {
          c = JSON.parse(JSON.stringify(c));
          remap(c, 'autoGainControl', 'mozAutoGainControl');
          remap(c, 'noiseSuppression', 'mozNoiseSuppression');
        }
        return nativeApplyConstraints.apply(this, [c]);
      };
    }
  }
}


/***/ }),

/***/ "./node_modules/webrtc-adapter/src/js/safari/safari_shim.js":
/*!******************************************************************!*\
  !*** ./node_modules/webrtc-adapter/src/js/safari/safari_shim.js ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "shimLocalStreamsAPI": () => (/* binding */ shimLocalStreamsAPI),
/* harmony export */   "shimRemoteStreamsAPI": () => (/* binding */ shimRemoteStreamsAPI),
/* harmony export */   "shimCallbacksAPI": () => (/* binding */ shimCallbacksAPI),
/* harmony export */   "shimGetUserMedia": () => (/* binding */ shimGetUserMedia),
/* harmony export */   "shimConstraints": () => (/* binding */ shimConstraints),
/* harmony export */   "shimRTCIceServerUrls": () => (/* binding */ shimRTCIceServerUrls),
/* harmony export */   "shimTrackEventTransceiver": () => (/* binding */ shimTrackEventTransceiver),
/* harmony export */   "shimCreateOfferLegacy": () => (/* binding */ shimCreateOfferLegacy),
/* harmony export */   "shimAudioContext": () => (/* binding */ shimAudioContext)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./node_modules/webrtc-adapter/src/js/utils.js");
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */



function shimLocalStreamsAPI(window) {
  if (typeof window !== 'object' || !window.RTCPeerConnection) {
    return;
  }
  if (!('getLocalStreams' in window.RTCPeerConnection.prototype)) {
    window.RTCPeerConnection.prototype.getLocalStreams =
      function getLocalStreams() {
        if (!this._localStreams) {
          this._localStreams = [];
        }
        return this._localStreams;
      };
  }
  if (!('addStream' in window.RTCPeerConnection.prototype)) {
    const _addTrack = window.RTCPeerConnection.prototype.addTrack;
    window.RTCPeerConnection.prototype.addStream = function addStream(stream) {
      if (!this._localStreams) {
        this._localStreams = [];
      }
      if (!this._localStreams.includes(stream)) {
        this._localStreams.push(stream);
      }
      // Try to emulate Chrome's behaviour of adding in audio-video order.
      // Safari orders by track id.
      stream.getAudioTracks().forEach(track => _addTrack.call(this, track,
        stream));
      stream.getVideoTracks().forEach(track => _addTrack.call(this, track,
        stream));
    };

    window.RTCPeerConnection.prototype.addTrack =
      function addTrack(track, ...streams) {
        if (streams) {
          streams.forEach((stream) => {
            if (!this._localStreams) {
              this._localStreams = [stream];
            } else if (!this._localStreams.includes(stream)) {
              this._localStreams.push(stream);
            }
          });
        }
        return _addTrack.apply(this, arguments);
      };
  }
  if (!('removeStream' in window.RTCPeerConnection.prototype)) {
    window.RTCPeerConnection.prototype.removeStream =
      function removeStream(stream) {
        if (!this._localStreams) {
          this._localStreams = [];
        }
        const index = this._localStreams.indexOf(stream);
        if (index === -1) {
          return;
        }
        this._localStreams.splice(index, 1);
        const tracks = stream.getTracks();
        this.getSenders().forEach(sender => {
          if (tracks.includes(sender.track)) {
            this.removeTrack(sender);
          }
        });
      };
  }
}

function shimRemoteStreamsAPI(window) {
  if (typeof window !== 'object' || !window.RTCPeerConnection) {
    return;
  }
  if (!('getRemoteStreams' in window.RTCPeerConnection.prototype)) {
    window.RTCPeerConnection.prototype.getRemoteStreams =
      function getRemoteStreams() {
        return this._remoteStreams ? this._remoteStreams : [];
      };
  }
  if (!('onaddstream' in window.RTCPeerConnection.prototype)) {
    Object.defineProperty(window.RTCPeerConnection.prototype, 'onaddstream', {
      get() {
        return this._onaddstream;
      },
      set(f) {
        if (this._onaddstream) {
          this.removeEventListener('addstream', this._onaddstream);
          this.removeEventListener('track', this._onaddstreampoly);
        }
        this.addEventListener('addstream', this._onaddstream = f);
        this.addEventListener('track', this._onaddstreampoly = (e) => {
          e.streams.forEach(stream => {
            if (!this._remoteStreams) {
              this._remoteStreams = [];
            }
            if (this._remoteStreams.includes(stream)) {
              return;
            }
            this._remoteStreams.push(stream);
            const event = new Event('addstream');
            event.stream = stream;
            this.dispatchEvent(event);
          });
        });
      }
    });
    const origSetRemoteDescription =
      window.RTCPeerConnection.prototype.setRemoteDescription;
    window.RTCPeerConnection.prototype.setRemoteDescription =
      function setRemoteDescription() {
        const pc = this;
        if (!this._onaddstreampoly) {
          this.addEventListener('track', this._onaddstreampoly = function(e) {
            e.streams.forEach(stream => {
              if (!pc._remoteStreams) {
                pc._remoteStreams = [];
              }
              if (pc._remoteStreams.indexOf(stream) >= 0) {
                return;
              }
              pc._remoteStreams.push(stream);
              const event = new Event('addstream');
              event.stream = stream;
              pc.dispatchEvent(event);
            });
          });
        }
        return origSetRemoteDescription.apply(pc, arguments);
      };
  }
}

function shimCallbacksAPI(window) {
  if (typeof window !== 'object' || !window.RTCPeerConnection) {
    return;
  }
  const prototype = window.RTCPeerConnection.prototype;
  const origCreateOffer = prototype.createOffer;
  const origCreateAnswer = prototype.createAnswer;
  const setLocalDescription = prototype.setLocalDescription;
  const setRemoteDescription = prototype.setRemoteDescription;
  const addIceCandidate = prototype.addIceCandidate;

  prototype.createOffer =
    function createOffer(successCallback, failureCallback) {
      const options = (arguments.length >= 2) ? arguments[2] : arguments[0];
      const promise = origCreateOffer.apply(this, [options]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };

  prototype.createAnswer =
    function createAnswer(successCallback, failureCallback) {
      const options = (arguments.length >= 2) ? arguments[2] : arguments[0];
      const promise = origCreateAnswer.apply(this, [options]);
      if (!failureCallback) {
        return promise;
      }
      promise.then(successCallback, failureCallback);
      return Promise.resolve();
    };

  let withCallback = function(description, successCallback, failureCallback) {
    const promise = setLocalDescription.apply(this, [description]);
    if (!failureCallback) {
      return promise;
    }
    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };
  prototype.setLocalDescription = withCallback;

  withCallback = function(description, successCallback, failureCallback) {
    const promise = setRemoteDescription.apply(this, [description]);
    if (!failureCallback) {
      return promise;
    }
    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };
  prototype.setRemoteDescription = withCallback;

  withCallback = function(candidate, successCallback, failureCallback) {
    const promise = addIceCandidate.apply(this, [candidate]);
    if (!failureCallback) {
      return promise;
    }
    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };
  prototype.addIceCandidate = withCallback;
}

function shimGetUserMedia(window) {
  const navigator = window && window.navigator;

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // shim not needed in Safari 12.1
    const mediaDevices = navigator.mediaDevices;
    const _getUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);
    navigator.mediaDevices.getUserMedia = (constraints) => {
      return _getUserMedia(shimConstraints(constraints));
    };
  }

  if (!navigator.getUserMedia && navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia) {
    navigator.getUserMedia = function getUserMedia(constraints, cb, errcb) {
      navigator.mediaDevices.getUserMedia(constraints)
      .then(cb, errcb);
    }.bind(navigator);
  }
}

function shimConstraints(constraints) {
  if (constraints && constraints.video !== undefined) {
    return Object.assign({},
      constraints,
      {video: _utils__WEBPACK_IMPORTED_MODULE_0__.compactObject(constraints.video)}
    );
  }

  return constraints;
}

function shimRTCIceServerUrls(window) {
  if (!window.RTCPeerConnection) {
    return;
  }
  // migrate from non-spec RTCIceServer.url to RTCIceServer.urls
  const OrigPeerConnection = window.RTCPeerConnection;
  window.RTCPeerConnection =
    function RTCPeerConnection(pcConfig, pcConstraints) {
      if (pcConfig && pcConfig.iceServers) {
        const newIceServers = [];
        for (let i = 0; i < pcConfig.iceServers.length; i++) {
          let server = pcConfig.iceServers[i];
          if (!server.hasOwnProperty('urls') &&
              server.hasOwnProperty('url')) {
            _utils__WEBPACK_IMPORTED_MODULE_0__.deprecated('RTCIceServer.url', 'RTCIceServer.urls');
            server = JSON.parse(JSON.stringify(server));
            server.urls = server.url;
            delete server.url;
            newIceServers.push(server);
          } else {
            newIceServers.push(pcConfig.iceServers[i]);
          }
        }
        pcConfig.iceServers = newIceServers;
      }
      return new OrigPeerConnection(pcConfig, pcConstraints);
    };
  window.RTCPeerConnection.prototype = OrigPeerConnection.prototype;
  // wrap static methods. Currently just generateCertificate.
  if ('generateCertificate' in OrigPeerConnection) {
    Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
      get() {
        return OrigPeerConnection.generateCertificate;
      }
    });
  }
}

function shimTrackEventTransceiver(window) {
  // Add event.transceiver member over deprecated event.receiver
  if (typeof window === 'object' && window.RTCTrackEvent &&
      'receiver' in window.RTCTrackEvent.prototype &&
      !('transceiver' in window.RTCTrackEvent.prototype)) {
    Object.defineProperty(window.RTCTrackEvent.prototype, 'transceiver', {
      get() {
        return {receiver: this.receiver};
      }
    });
  }
}

function shimCreateOfferLegacy(window) {
  const origCreateOffer = window.RTCPeerConnection.prototype.createOffer;
  window.RTCPeerConnection.prototype.createOffer =
    function createOffer(offerOptions) {
      if (offerOptions) {
        if (typeof offerOptions.offerToReceiveAudio !== 'undefined') {
          // support bit values
          offerOptions.offerToReceiveAudio =
            !!offerOptions.offerToReceiveAudio;
        }
        const audioTransceiver = this.getTransceivers().find(transceiver =>
          transceiver.receiver.track.kind === 'audio');
        if (offerOptions.offerToReceiveAudio === false && audioTransceiver) {
          if (audioTransceiver.direction === 'sendrecv') {
            if (audioTransceiver.setDirection) {
              audioTransceiver.setDirection('sendonly');
            } else {
              audioTransceiver.direction = 'sendonly';
            }
          } else if (audioTransceiver.direction === 'recvonly') {
            if (audioTransceiver.setDirection) {
              audioTransceiver.setDirection('inactive');
            } else {
              audioTransceiver.direction = 'inactive';
            }
          }
        } else if (offerOptions.offerToReceiveAudio === true &&
            !audioTransceiver) {
          this.addTransceiver('audio');
        }

        if (typeof offerOptions.offerToReceiveVideo !== 'undefined') {
          // support bit values
          offerOptions.offerToReceiveVideo =
            !!offerOptions.offerToReceiveVideo;
        }
        const videoTransceiver = this.getTransceivers().find(transceiver =>
          transceiver.receiver.track.kind === 'video');
        if (offerOptions.offerToReceiveVideo === false && videoTransceiver) {
          if (videoTransceiver.direction === 'sendrecv') {
            if (videoTransceiver.setDirection) {
              videoTransceiver.setDirection('sendonly');
            } else {
              videoTransceiver.direction = 'sendonly';
            }
          } else if (videoTransceiver.direction === 'recvonly') {
            if (videoTransceiver.setDirection) {
              videoTransceiver.setDirection('inactive');
            } else {
              videoTransceiver.direction = 'inactive';
            }
          }
        } else if (offerOptions.offerToReceiveVideo === true &&
            !videoTransceiver) {
          this.addTransceiver('video');
        }
      }
      return origCreateOffer.apply(this, arguments);
    };
}

function shimAudioContext(window) {
  if (typeof window !== 'object' || window.AudioContext) {
    return;
  }
  window.AudioContext = window.webkitAudioContext;
}


/***/ }),

/***/ "./node_modules/webrtc-adapter/src/js/utils.js":
/*!*****************************************************!*\
  !*** ./node_modules/webrtc-adapter/src/js/utils.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "extractVersion": () => (/* binding */ extractVersion),
/* harmony export */   "wrapPeerConnectionEvent": () => (/* binding */ wrapPeerConnectionEvent),
/* harmony export */   "disableLog": () => (/* binding */ disableLog),
/* harmony export */   "disableWarnings": () => (/* binding */ disableWarnings),
/* harmony export */   "log": () => (/* binding */ log),
/* harmony export */   "deprecated": () => (/* binding */ deprecated),
/* harmony export */   "detectBrowser": () => (/* binding */ detectBrowser),
/* harmony export */   "compactObject": () => (/* binding */ compactObject),
/* harmony export */   "walkStats": () => (/* binding */ walkStats),
/* harmony export */   "filterStats": () => (/* binding */ filterStats)
/* harmony export */ });
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */


let logDisabled_ = true;
let deprecationWarnings_ = true;

/**
 * Extract browser version out of the provided user agent string.
 *
 * @param {!string} uastring userAgent string.
 * @param {!string} expr Regular expression used as match criteria.
 * @param {!number} pos position in the version string to be returned.
 * @return {!number} browser version.
 */
function extractVersion(uastring, expr, pos) {
  const match = uastring.match(expr);
  return match && match.length >= pos && parseInt(match[pos], 10);
}

// Wraps the peerconnection event eventNameToWrap in a function
// which returns the modified event object (or false to prevent
// the event).
function wrapPeerConnectionEvent(window, eventNameToWrap, wrapper) {
  if (!window.RTCPeerConnection) {
    return;
  }
  const proto = window.RTCPeerConnection.prototype;
  const nativeAddEventListener = proto.addEventListener;
  proto.addEventListener = function(nativeEventName, cb) {
    if (nativeEventName !== eventNameToWrap) {
      return nativeAddEventListener.apply(this, arguments);
    }
    const wrappedCallback = (e) => {
      const modifiedEvent = wrapper(e);
      if (modifiedEvent) {
        if (cb.handleEvent) {
          cb.handleEvent(modifiedEvent);
        } else {
          cb(modifiedEvent);
        }
      }
    };
    this._eventMap = this._eventMap || {};
    if (!this._eventMap[eventNameToWrap]) {
      this._eventMap[eventNameToWrap] = new Map();
    }
    this._eventMap[eventNameToWrap].set(cb, wrappedCallback);
    return nativeAddEventListener.apply(this, [nativeEventName,
      wrappedCallback]);
  };

  const nativeRemoveEventListener = proto.removeEventListener;
  proto.removeEventListener = function(nativeEventName, cb) {
    if (nativeEventName !== eventNameToWrap || !this._eventMap
        || !this._eventMap[eventNameToWrap]) {
      return nativeRemoveEventListener.apply(this, arguments);
    }
    if (!this._eventMap[eventNameToWrap].has(cb)) {
      return nativeRemoveEventListener.apply(this, arguments);
    }
    const unwrappedCb = this._eventMap[eventNameToWrap].get(cb);
    this._eventMap[eventNameToWrap].delete(cb);
    if (this._eventMap[eventNameToWrap].size === 0) {
      delete this._eventMap[eventNameToWrap];
    }
    if (Object.keys(this._eventMap).length === 0) {
      delete this._eventMap;
    }
    return nativeRemoveEventListener.apply(this, [nativeEventName,
      unwrappedCb]);
  };

  Object.defineProperty(proto, 'on' + eventNameToWrap, {
    get() {
      return this['_on' + eventNameToWrap];
    },
    set(cb) {
      if (this['_on' + eventNameToWrap]) {
        this.removeEventListener(eventNameToWrap,
            this['_on' + eventNameToWrap]);
        delete this['_on' + eventNameToWrap];
      }
      if (cb) {
        this.addEventListener(eventNameToWrap,
            this['_on' + eventNameToWrap] = cb);
      }
    },
    enumerable: true,
    configurable: true
  });
}

function disableLog(bool) {
  if (typeof bool !== 'boolean') {
    return new Error('Argument type: ' + typeof bool +
        '. Please use a boolean.');
  }
  logDisabled_ = bool;
  return (bool) ? 'adapter.js logging disabled' :
      'adapter.js logging enabled';
}

/**
 * Disable or enable deprecation warnings
 * @param {!boolean} bool set to true to disable warnings.
 */
function disableWarnings(bool) {
  if (typeof bool !== 'boolean') {
    return new Error('Argument type: ' + typeof bool +
        '. Please use a boolean.');
  }
  deprecationWarnings_ = !bool;
  return 'adapter.js deprecation warnings ' + (bool ? 'disabled' : 'enabled');
}

function log() {
  if (typeof window === 'object') {
    if (logDisabled_) {
      return;
    }
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log.apply(console, arguments);
    }
  }
}

/**
 * Shows a deprecation warning suggesting the modern and spec-compatible API.
 */
function deprecated(oldMethod, newMethod) {
  if (!deprecationWarnings_) {
    return;
  }
  console.warn(oldMethod + ' is deprecated, please use ' + newMethod +
      ' instead.');
}

/**
 * Browser detector.
 *
 * @return {object} result containing browser and version
 *     properties.
 */
function detectBrowser(window) {
  // Returned result object.
  const result = {browser: null, version: null};

  // Fail early if it's not a browser
  if (typeof window === 'undefined' || !window.navigator) {
    result.browser = 'Not a browser.';
    return result;
  }

  const {navigator} = window;

  if (navigator.mozGetUserMedia) { // Firefox.
    result.browser = 'firefox';
    result.version = extractVersion(navigator.userAgent,
        /Firefox\/(\d+)\./, 1);
  } else if (navigator.webkitGetUserMedia ||
      (window.isSecureContext === false && window.webkitRTCPeerConnection &&
       !window.RTCIceGatherer)) {
    // Chrome, Chromium, Webview, Opera.
    // Version matches Chrome/WebRTC version.
    // Chrome 74 removed webkitGetUserMedia on http as well so we need the
    // more complicated fallback to webkitRTCPeerConnection.
    result.browser = 'chrome';
    result.version = extractVersion(navigator.userAgent,
        /Chrom(e|ium)\/(\d+)\./, 2);
  } else if (navigator.mediaDevices &&
      navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) { // Edge.
    result.browser = 'edge';
    result.version = extractVersion(navigator.userAgent,
        /Edge\/(\d+).(\d+)$/, 2);
  } else if (window.RTCPeerConnection &&
      navigator.userAgent.match(/AppleWebKit\/(\d+)\./)) { // Safari.
    result.browser = 'safari';
    result.version = extractVersion(navigator.userAgent,
        /AppleWebKit\/(\d+)\./, 1);
    result.supportsUnifiedPlan = window.RTCRtpTransceiver &&
        'currentDirection' in window.RTCRtpTransceiver.prototype;
  } else { // Default fallthrough: not supported.
    result.browser = 'Not a supported browser.';
    return result;
  }

  return result;
}

/**
 * Checks if something is an object.
 *
 * @param {*} val The something you want to check.
 * @return true if val is an object, false otherwise.
 */
function isObject(val) {
  return Object.prototype.toString.call(val) === '[object Object]';
}

/**
 * Remove all empty objects and undefined values
 * from a nested object -- an enhanced and vanilla version
 * of Lodash's `compact`.
 */
function compactObject(data) {
  if (!isObject(data)) {
    return data;
  }

  return Object.keys(data).reduce(function(accumulator, key) {
    const isObj = isObject(data[key]);
    const value = isObj ? compactObject(data[key]) : data[key];
    const isEmptyObject = isObj && !Object.keys(value).length;
    if (value === undefined || isEmptyObject) {
      return accumulator;
    }
    return Object.assign(accumulator, {[key]: value});
  }, {});
}

/* iterates the stats graph recursively. */
function walkStats(stats, base, resultSet) {
  if (!base || resultSet.has(base.id)) {
    return;
  }
  resultSet.set(base.id, base);
  Object.keys(base).forEach(name => {
    if (name.endsWith('Id')) {
      walkStats(stats, stats.get(base[name]), resultSet);
    } else if (name.endsWith('Ids')) {
      base[name].forEach(id => {
        walkStats(stats, stats.get(id), resultSet);
      });
    }
  });
}

/* filter getStats for a sender/receiver track. */
function filterStats(result, track, outbound) {
  const streamStatsType = outbound ? 'outbound-rtp' : 'inbound-rtp';
  const filteredResult = new Map();
  if (track === null) {
    return filteredResult;
  }
  const trackStats = [];
  result.forEach(value => {
    if (value.type === 'track' &&
        value.trackIdentifier === track.id) {
      trackStats.push(value);
    }
  });
  trackStats.forEach(trackStat => {
    result.forEach(stats => {
      if (stats.type === streamStatsType && stats.trackId === trackStat.id) {
        walkStats(result, stats, filteredResult);
      }
    });
  });
  return filteredResult;
}



/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./lib/exports.ts");
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=peerjs.js.map