/*!
 * Duplexer
 * Version: 0.0.1
 * Date: 2017/05/19
 * https://github.com/nuintun/duplexer
 * https://github.com/deoxxa/duplexer2
 *
 * This is licensed under the MIT License (MIT).
 * For details, see: https://github.com/nuintun/duplexer/blob/master/LICENSE
 */

'use strict';

var Stream = require('readable-stream');
var Duplex = Stream.Duplex;
var Readable = Stream.Readable;

var undef = void(0);
var toString = Object.prototype.toString;

/**
 * Is function
 *
 * @param {any} value
 * @returns {Boolean}
 */
function isFunction(value) {
  return toString.call(value) === '[object Function]';
}

/**
 * Duplexer
 *
 * @type {Function}
 */
function Duplexer(options, writable, readable) {
  var context = this;

  if (typeof readable === undef) {
    readable = writable;
    writable = options;
    options = null;
  }

  Duplex.call(context, options);

  if (!isFunction(readable.read)) {
    readable = (new Readable(options)).wrap(readable);
  }

  context._writable = writable;
  context._readable = readable;
  context._waiting = false;

  writable.once('finish', function() {
    context.end();
  });

  context.once('finish', function() {
    writable.end();
  });

  readable.on('readable', function() {
    if (context._waiting) {
      context._waiting = false;

      context._read();
    }
  });

  readable.once('end', function() {
    context.push(null);
  });

  if (!options || options.bubbleErrors) {
    writable.on('error', function(err) {
      context.emit('error', err);
    });

    readable.on('error', function(err) {
      context.emit('error', err);
    });
  }
}

// extend
Duplexer.prototype = Object.create(Duplex.prototype, { constructor: { value: Duplexer } });

/**
 * _write
 *
 * @param chunk
 * @param encoding
 * @param next
 * @private
 */
Duplexer.prototype._write = function(chunk, encoding, next) {
  this._writable.write(chunk, encoding, next);
};

/**
 * _read
 *
 * @private
 */
Duplexer.prototype._read = function() {
  var buf;
  var reads = 0;
  var context = this;

  while ((buf = context._readable.read()) !== null) {
    context.push(buf);

    reads++;
  }

  if (reads === 0) {
    context._waiting = true;
  }
};

/**
 * exports module
 */
module.exports = function(options, writable, readable) {
  return new Duplexer(options, writable, readable);
};
module.exports.Duplexer = Duplexer;
