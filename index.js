/**
 * @module index
 * @license MIT
 * @version 2017/11/13
 */

'use strict';

const Stream = require('stream');
const Duplex = Stream.Duplex;
const Readable = Stream.Readable;

const undef = void 0;

/**
 * @function isFunction
 * @param {any} value
 * @returns {boolean}
 */
function isFunction(value) {
  return typeof value === 'function';
}

/**
 * @class Duplexer
 */
class Duplexer extends Duplex {
  /**
   * @constructor
   * @param {Object} options
   * @param {Writable} writable
   * @param {Readable} readable
   */
  constructor(options, writable, readable) {
    if (typeof readable === undef) {
      readable = writable;
      writable = options;
      options = null;
    }

    super(options);

    if (!isFunction(readable.read)) {
      readable = new Readable(options).wrap(readable);
    }

    this._writable = writable;
    this._readable = readable;
    this._waiting = false;

    writable.once('finish', () => {
      this.end();
    });

    this.once('finish', () => {
      writable.end();
    });

    readable.on('readable', () => {
      if (this._waiting) {
        this._waiting = false;

        this._read();
      }
    });

    readable.once('end', () => {
      this.push(null);
    });

    if (!options || options.bubbleErrors) {
      writable.on('error', error => {
        this.emit('error', error);
      });

      readable.on('error', error => {
        this.emit('error', error);
      });
    }
  }

  /**
   * @private
   * @method _write
   * @param {any} chunk
   * @param {string} encoding
   * @param {Function} next
   */
  _write(chunk, encoding, next) {
    this._writable.write(chunk, encoding, next);
  }

  /**
   * @private
   * @method _read
   */
  _read() {
    let buf;
    let reads = 0;

    while ((buf = this._readable.read()) !== null) {
      this.push(buf);

      reads++;
    }

    if (reads === 0) {
      this._waiting = true;
    }
  }
}

/**
 * @function duplexer
 * @param {Object} options
 * @param {Writable} writable
 * @param {Readable} readable
 * @returns {Duplex}
 */
module.exports = function(options, writable, readable) {
  return new Duplexer(options, writable, readable);
};
module.exports.Duplexer = Duplexer;
