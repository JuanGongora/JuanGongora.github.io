(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":2,"ieee754":3}],3:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
(function (process,Buffer){(function (){
!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define("zoid",[],t):"object"==typeof exports?exports.zoid=t():e.zoid=t()}("undefined"!=typeof self?self:this,function(){return function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}return n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{configurable:!1,enumerable:!0,get:r})},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=13)}([function(e,t,n){"use strict";function r(e){return"[object RegExp]"===Object.prototype.toString.call(e)}var o={MOCK:"mock:",FILE:"file:",ABOUT:"about:"},i="*",a={IFRAME:"iframe",POPUP:"popup"},u="Call was rejected by callee.\r\n";function c(){return(arguments.length>0&&void 0!==arguments[0]?arguments[0]:window).location.protocol===o.FILE}function s(){return(arguments.length>0&&void 0!==arguments[0]?arguments[0]:window).location.protocol===o.ABOUT}function d(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:window;if(e)try{if(e.parent&&e.parent!==e)return e.parent}catch(e){}}function f(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:window;if(e&&!d(e))try{return e.opener}catch(e){}}function l(e){try{return e&&e.location&&e.location.href,!0}catch(e){}return!1}function p(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:window,t=e.location;if(!t)throw new Error("Can not read window location");var n=t.protocol;if(!n)throw new Error("Can not read window protocol");if(n===o.FILE)return o.FILE+"//";if(n===o.ABOUT){var r=d(e);return r&&l(r)?p(r):o.ABOUT+"//"}var i=t.host;if(!i)throw new Error("Can not read window host");return n+"//"+i}function h(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:window,t=p(e);return t&&e.mockDomain&&0===e.mockDomain.indexOf(o.MOCK)?e.mockDomain:t}function w(e){try{if(!e.location.href)return!0;if("about:blank"===e.location.href)return!0}catch(e){}return!1}function m(e){try{if(e===window)return!0}catch(e){}try{var t=Object.getOwnPropertyDescriptor(e,"location");if(t&&!1===t.enumerable)return!1}catch(e){}try{if(s(e)&&l(e))return!0}catch(e){}try{if(p(e)===p(window))return!0}catch(e){}return!1}function v(e){if(!m(e))return!1;try{if(e===window)return!0;if(s(e)&&l(e))return!0;if(h(window)===h(e))return!0}catch(e){}return!1}function y(e){if(!v(e))throw new Error("Expected window to be same domain");return e}function g(e){var t=[];try{for(;e.parent!==e;)t.push(e.parent),e=e.parent}catch(e){}return t}function E(e,t){if(!e||!t)return!1;var n=d(t);return n?n===e:-1!==g(t).indexOf(e)}function b(e){var t=[],n=void 0;try{n=e.frames}catch(t){n=e}var r=void 0;try{r=n.length}catch(e){}if(0===r)return t;if(r){for(var o=0;o<r;o++){var i=void 0;try{i=n[o]}catch(e){continue}t.push(i)}return t}for(var a=0;a<100;a++){var u=void 0;try{u=n[a]}catch(e){return t}if(!u)return t;t.push(u)}return t}function O(e){for(var t=[],n=0,r=b(e),o=null==r?0:r.length;n<o;n++){var i=r[n];t.push(i);for(var a=0,u=O(i),c=null==u?0:u.length;a<c;a++){var s=u[a];t.push(s)}}return t}function _(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:window;try{if(e.top)return e.top}catch(e){}if(d(e)===e)return e;try{if(E(window,e)&&window.top)return window.top}catch(e){}try{if(E(e,window)&&window.top)return window.top}catch(e){}for(var t=0,n=O(e),r=null==n?0:n.length;t<r;t++){var o=n[t];try{if(o.top)return o.top}catch(e){}if(d(o)===o)return o}}function S(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:window;return f(_(e)||e)}function T(){var e=S(arguments.length>0&&void 0!==arguments[0]?arguments[0]:window);return e?T(e):top}function P(e){var t=_(e);if(!t)throw new Error("Can not determine top window");var n=[].concat(O(t),[t]);return-1===n.indexOf(e)&&(n=[].concat(n,[e],O(e))),n}function C(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:window,t=P(e),n=S(e);return n?[].concat(C(n),t):t}function A(e){return e===_(e)}function j(e){if(!e.contentWindow)return!0;if(!e.parentNode)return!0;var t=e.ownerDocument;if(t&&t.documentElement&&!t.documentElement.contains(e)){for(var n=e;n.parentNode&&n.parentNode!==n;)n=n.parentNode;if(!n.host||!t.documentElement.contains(n.host))return!0}return!1}var L=[],I=[];function N(e){var t=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];try{if(e===window)return!1}catch(e){return!0}try{if(!e)return!0}catch(e){return!0}try{if(e.closed)return!0}catch(e){return!e||e.message!==u}if(t&&v(e))try{if(e.mockclosed)return!0}catch(e){}try{if(!e.parent||!e.top)return!0}catch(e){}var n=function(e,t){for(var n=0;n<e.length;n++)try{if(e[n]===t)return n}catch(e){}return-1}(L,e);if(-1!==n){var r=I[n];if(r&&j(r))return!0}return!1}function R(e){if(function(){for(var e=0;e<L.length;e++){var t=!1;try{t=L[e].closed}catch(e){}t&&(I.splice(e,1),L.splice(e,1))}}(),e&&e.contentWindow)try{L.push(e.contentWindow),I.push(e)}catch(e){}}function D(e){return(e=e||window).navigator.mockUserAgent||e.navigator.userAgent}function x(e,t){for(var n=b(e),r=0,o=null==n?0:n.length;r<o;r++){var i=n[r];try{if(v(i)&&i.name===t&&-1!==n.indexOf(i))return i}catch(e){}}try{if(-1!==n.indexOf(e.frames[t]))return e.frames[t]}catch(e){}try{if(-1!==n.indexOf(e[t]))return e[t]}catch(e){}}function M(e,t){var n=x(e,t);if(n)return n;for(var r=0,o=b(e),i=null==o?0:o.length;r<i;r++){var a=M(o[r],t);if(a)return a}}function W(e,t){var n;return(n=x(e,t))?n:M(_(e)||e,t)}function k(e,t){var n=d(t);if(n)return n===e;for(var r=0,o=b(e),i=null==o?0:o.length;r<i;r++)if(o[r]===t)return!0;return!1}function B(e,t){return e===f(t)}function G(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:window;return f(e=e||window)||d(e)||void 0}function U(e){for(var t=[],n=e;n;)(n=G(n))&&t.push(n);return t}function F(e,t){var n=G(t);if(n)return n===e;if(t===e)return!1;if(_(t)===t)return!1;for(var r=0,o=b(e),i=null==o?0:o.length;r<i;r++)if(o[r]===t)return!0;return!1}function z(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:window;return Boolean(f(e))}function H(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:window;return Boolean(d(e))}function q(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:window;return Boolean(!H(e)&&!z(e))}function Y(e,t){for(var n=0,r=null==e?0:e.length;n<r;n++)for(var o=e[n],i=0,a=null==t?0:t.length;i<a;i++)if(o===t[i])return!0;return!1}function X(){for(var e=0,t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:window;t;)(t=d(t))&&(e+=1);return e}function Z(e){for(var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:1,n=e,r=0;r<t;r++){if(!n)return;n=d(n)}return n}function J(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:1;return Z(e,X(e)-t)}function K(e,t){var n=_(e)||e,r=_(t)||t;try{if(n&&r)return n===r}catch(e){}var o=P(e),i=P(t);if(Y(o,i))return!0;var a=f(n),u=f(r);return!(a&&Y(P(a),i)||(u&&Y(P(u),o),1))}function V(e,t){if("string"==typeof e){if("string"==typeof t)return e===i||t===e;if(r(t))return!1;if(Array.isArray(t))return!1}return r(e)?r(t)?e.toString()===t.toString():!Array.isArray(t)&&Boolean(t.match(e)):!!Array.isArray(e)&&(Array.isArray(t)?JSON.stringify(e)===JSON.stringify(t):!r(t)&&e.some(function(e){return V(e,t)}))}function $(e){return Array.isArray(e)?"("+e.join(" | ")+")":r(e)?"RegExp("+e.toString():e.toString()}function Q(e){return e.match(/^(https?|mock|file):\/\//)?e.split("/").slice(0,3).join("/"):h()}function ee(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:1e3,r=arguments.length>3&&void 0!==arguments[3]?arguments[3]:1/0,o=void 0;return function i(){if(N(e))return o&&clearTimeout(o),t();r<=0?clearTimeout(o):(r-=n,o=setTimeout(i,n))}(),{cancel:function(){o&&clearTimeout(o)}}}function te(e){try{if(e===window)return!0}catch(e){if(e&&e.message===u)return!0}try{if("[object Window]"===Object.prototype.toString.call(e))return!0}catch(e){if(e&&e.message===u)return!0}try{if(window.Window&&e instanceof window.Window)return!0}catch(e){if(e&&e.message===u)return!0}try{if(e&&e.self===e)return!0}catch(e){if(e&&e.message===u)return!0}try{if(e&&e.parent===e)return!0}catch(e){if(e&&e.message===u)return!0}try{if(e&&e.top===e)return!0}catch(e){if(e&&e.message===u)return!0}try{if(e&&"__unlikely_value__"===e.__cross_domain_utils_window_check__)return!1}catch(e){return!0}try{if("postMessage"in e&&"self"in e&&"location"in e)return!0}catch(e){}return!1}function ne(){return"undefined"!=typeof window&&void 0!==window.location}function re(e){return!!ne()&&h()===e}function oe(e){return 0===e.indexOf(o.MOCK)}function ie(e){if(!oe(Q(e)))return e;throw new Error("Mock urls not supported out of test mode")}function ae(e){try{e.close()}catch(e){}}function ue(e){if(v(e))return y(e).frameElement;for(var t=0,n=document.querySelectorAll("iframe"),r=null==n?0:n.length;t<r;t++){var o=n[t];if(o&&o.contentWindow&&o.contentWindow===e)return o}}n.d(t,!1,function(){return c}),n.d(t,!1,function(){return s}),n.d(t,"m",function(){return d}),n.d(t,"l",function(){return f}),n.d(t,!1,function(){return l}),n.d(t,"c",function(){return p}),n.d(t,"g",function(){return h}),n.d(t,!1,function(){return w}),n.d(t,"p",function(){return m}),n.d(t,"u",function(){return v}),n.d(t,"a",function(){return y}),n.d(t,!1,function(){return g}),n.d(t,!1,function(){return E}),n.d(t,"j",function(){return b}),n.d(t,!1,function(){return O}),n.d(t,"n",function(){return _}),n.d(t,!1,function(){return S}),n.d(t,!1,function(){return T}),n.d(t,"d",function(){return P}),n.d(t,!1,function(){return C}),n.d(t,"w",function(){return A}),n.d(t,!1,function(){return j}),n.d(t,"y",function(){return N}),n.d(t,"z",function(){return R}),n.d(t,"o",function(){return D}),n.d(t,"i",function(){return x}),n.d(t,!1,function(){return M}),n.d(t,"b",function(){return W}),n.d(t,!1,function(){return k}),n.d(t,"s",function(){return B}),n.d(t,"e",function(){return G}),n.d(t,!1,function(){return U}),n.d(t,"q",function(){return F}),n.d(t,"t",function(){return z}),n.d(t,"r",function(){return H}),n.d(t,!1,function(){return q}),n.d(t,"f",function(){return X}),n.d(t,!1,function(){return Z}),n.d(t,"k",function(){return J}),n.d(t,"v",function(){return K}),n.d(t,"A",function(){return V}),n.d(t,"C",function(){return $}),n.d(t,"h",function(){return Q}),n.d(t,"B",function(){return ee}),n.d(t,"x",function(){return te}),n.d(t,!1,function(){return ne}),n.d(t,!1,function(){return re}),n.d(t,!1,function(){return oe}),n.d(t,!1,function(){return ie}),n.d(t,!1,function(){return ae}),n.d(t,!1,function(){return ue}),n.d(t,!1,function(){return!0}),n.d(t,!1,function(){return o}),n.d(t,!1,function(){return i}),n.d(t,!1,function(){return a})},function(e,t,n){"use strict";function r(e){try{if(!e)return!1;if("undefined"!=typeof Promise&&e instanceof Promise)return!0;if("undefined"!=typeof window&&"function"==typeof window.Window&&e instanceof window.Window)return!1;if("undefined"!=typeof window&&"function"==typeof window.constructor&&e instanceof window.constructor)return!1;var t={}.toString;if(t){var n=t.call(e);if("[object Window]"===n||"[object global]"===n||"[object DOMWindow]"===n)return!1}if("function"==typeof e.then)return!0}catch(e){return!1}return!1}var o=[],i=[],a=0,u=void 0;function c(){if(!a&&u){var e=u;u=null,e.resolve()}}function s(){a+=1}function d(){a-=1,c()}var f=function(){function e(t){var n=this;if(function(t,n){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this),this.resolved=!1,this.rejected=!1,this.errorHandled=!1,this.handlers=[],t){var r=void 0,o=void 0,i=!1,a=!1,u=!1;s();try{t(function(e){u?n.resolve(e):(i=!0,r=e)},function(e){u?n.reject(e):(a=!0,o=e)})}catch(e){return d(),void this.reject(e)}d(),u=!0,i?this.resolve(r):a&&this.reject(o)}}return e.prototype.resolve=function(e){if(this.resolved||this.rejected)return this;if(r(e))throw new Error("Can not resolve promise with another promise");return this.resolved=!0,this.value=e,this.dispatch(),this},e.prototype.reject=function(e){var t=this;if(this.resolved||this.rejected)return this;if(r(e))throw new Error("Can not reject promise with another promise");if(!e){var n=e&&"function"==typeof e.toString?e.toString():Object.prototype.toString.call(e);e=new Error("Expected reject to be called with Error, got "+n)}return this.rejected=!0,this.error=e,this.errorHandled||setTimeout(function(){t.errorHandled||function(e,t){if(-1===o.indexOf(e)){o.push(e),setTimeout(function(){throw e},1);for(var n=0;n<i.length;n++)i[n](e,t)}}(e,t)},1),this.dispatch(),this},e.prototype.asyncReject=function(e){return this.errorHandled=!0,this.reject(e),this},e.prototype.dispatch=function(){var t=this.dispatching,n=this.resolved,o=this.rejected,i=this.handlers;if(!t&&(n||o)){this.dispatching=!0,s();for(var a=function(e,t){return e.then(function(e){t.resolve(e)},function(e){t.reject(e)})},u=0;u<i.length;u++){var c=i[u],f=c.onSuccess,l=c.onError,p=c.promise,h=void 0;if(n)try{h=f?f(this.value):this.value}catch(e){p.reject(e);continue}else if(o){if(!l){p.reject(this.error);continue}try{h=l(this.error)}catch(e){p.reject(e);continue}}h instanceof e&&(h.resolved||h.rejected)?(h.resolved?p.resolve(h.value):p.reject(h.error),h.errorHandled=!0):r(h)?h instanceof e&&(h.resolved||h.rejected)?h.resolved?p.resolve(h.value):p.reject(h.error):a(h,p):p.resolve(h)}i.length=0,this.dispatching=!1,d()}},e.prototype.then=function(t,n){if(t&&"function"!=typeof t&&!t.call)throw new Error("Promise.then expected a function for success handler");if(n&&"function"!=typeof n&&!n.call)throw new Error("Promise.then expected a function for error handler");var r=new e;return this.handlers.push({promise:r,onSuccess:t,onError:n}),this.errorHandled=!0,this.dispatch(),r},e.prototype.catch=function(e){return this.then(void 0,e)},e.prototype.finally=function(t){if(t&&"function"!=typeof t&&!t.call)throw new Error("Promise.finally expected a function");return this.then(function(n){return e.try(t).then(function(){return n})},function(n){return e.try(t).then(function(){throw n})})},e.prototype.timeout=function(e,t){var n=this;if(this.resolved||this.rejected)return this;var r=setTimeout(function(){n.resolved||n.rejected||n.reject(t||new Error("Promise timed out after "+e+"ms"))},e);return this.then(function(e){return clearTimeout(r),e})},e.prototype.toPromise=function(){if("undefined"==typeof Promise)throw new TypeError("Could not find Promise");return Promise.resolve(this)},e.resolve=function(t){return t instanceof e?t:r(t)?new e(function(e,n){return t.then(e,n)}):(new e).resolve(t)},e.reject=function(t){return(new e).reject(t)},e.asyncReject=function(t){return(new e).asyncReject(t)},e.all=function(t){var n=new e,o=t.length,i=[];if(!o)return n.resolve(i),n;for(var a=function(e,t,r){return t.then(function(t){i[e]=t,0==(o-=1)&&n.resolve(i)},function(e){r.reject(e)})},u=0;u<t.length;u++){var c=t[u];if(c instanceof e){if(c.resolved){i[u]=c.value,o-=1;continue}}else if(!r(c)){i[u]=c,o-=1;continue}a(u,e.resolve(c),n)}return 0===o&&n.resolve(i),n},e.hash=function(t){var n={},o=[],i=function(e){if(t.hasOwnProperty(e)){var i=t[e];r(i)?o.push(i.then(function(t){n[e]=t})):n[e]=i}};for(var a in t)i(a);return e.all(o).then(function(){return n})},e.map=function(t,n){return e.all(t.map(n))},e.onPossiblyUnhandledException=function(e){return function(e){return i.push(e),{cancel:function(){i.splice(i.indexOf(e),1)}}}(e)},e.try=function(t,n,r){if(t&&"function"!=typeof t&&!t.call)throw new Error("Promise.try expected a function");var o=void 0;s();try{o=t.apply(n,r||[])}catch(t){return d(),e.reject(t)}return d(),e.resolve(o)},e.delay=function(t){return new e(function(e){setTimeout(e,t)})},e.isPromise=function(t){return!!(t&&t instanceof e)||r(t)},e.flush=function(){return t=u=u||new e,c(),t;var t},e}();n.d(t,"a",function(){return f})},function(e,t,n){"use strict";var r,o={POST_MESSAGE_TYPE:{REQUEST:"postrobot_message_request",RESPONSE:"postrobot_message_response",ACK:"postrobot_message_ack"},POST_MESSAGE_ACK:{SUCCESS:"success",ERROR:"error"},POST_MESSAGE_NAMES:{METHOD:"postrobot_method",HELLO:"postrobot_ready",OPEN_TUNNEL:"postrobot_open_tunnel"},WINDOW_TYPES:{FULLPAGE:"fullpage",POPUP:"popup",IFRAME:"iframe"},WINDOW_PROPS:{POSTROBOT:"__postRobot__"},SERIALIZATION_TYPES:{METHOD:"postrobot_method",ERROR:"postrobot_error",PROMISE:"postrobot_promise",ZALGO_PROMISE:"postrobot_zalgo_promise",REGEX:"regex"},SEND_STRATEGIES:{POST_MESSAGE:"postrobot_post_message",BRIDGE:"postrobot_bridge",GLOBAL:"postrobot_global"},MOCK_PROTOCOL:"mock:",FILE_PROTOCOL:"file:",BRIDGE_NAME_PREFIX:"__postrobot_bridge__",POSTROBOT_PROXY:"__postrobot_proxy__",WILDCARD:"*"},i={METHOD:"postrobot_method",HELLO:"postrobot_hello",OPEN_TUNNEL:"postrobot_open_tunnel"},a=Object.keys(i).map(function(e){return i[e]}),u={ALLOW_POSTMESSAGE_POPUP:!("__ALLOW_POSTMESSAGE_POPUP__"in window)||window.__ALLOW_POSTMESSAGE_POPUP__,BRIDGE_TIMEOUT:5e3,CHILD_WINDOW_TIMEOUT:5e3,ACK_TIMEOUT:-1!==window.navigator.userAgent.match(/MSIE/i)?1e4:2e3,RES_TIMEOUT:-1,ALLOWED_POST_MESSAGE_METHODS:(r={},r[o.SEND_STRATEGIES.POST_MESSAGE]=!0,r[o.SEND_STRATEGIES.BRIDGE]=!0,r[o.SEND_STRATEGIES.GLOBAL]=!0,r),ALLOW_SAME_ORIGIN:!1};0===window.location.href.indexOf(o.FILE_PROTOCOL)&&(u.ALLOW_POSTMESSAGE_POPUP=!0),n.d(t,"a",function(){return u}),n.d(t,"b",function(){return o}),n.d(t,!1,function(){return i}),n.d(t,!1,function(){return a})},function(e,t,n){"use strict";var r=n(0),o=n(1),i=n(6),a=n(9),u="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};function c(e){return e.replace(/\?/g,"%3F").replace(/&/g,"%26").replace(/#/g,"%23").replace(/\+/g,"%2B")}function s(e){return e.replace(/([A-Z])/g,function(e){return"-"+e.toLowerCase()})}function d(e){return e.replace(/-([a-z])/g,function(e){return e[1].toUpperCase()})}function f(e,t){if(!t)return e;for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);return e}function l(e){var t=[];for(var n in e)e.hasOwnProperty(n)&&t.push(e[n]);return t}function p(){var e="0123456789abcdef";return"xxxxxxxxxx".replace(/./g,function(){return e.charAt(Math.floor(Math.random()*e.length))})}function h(e){return JSON.stringify(e,function(e,t){return"function"==typeof t?t.toString():t})}function w(e,t){var n=void 0;try{n=e[t]}catch(e){}return n}function m(e){return e.charAt(0).toUpperCase()+e.slice(1).toLowerCase()}function v(e,t,n){if(!t)return n;for(var r=t.split("."),o=0;o<r.length;o++){if("object"!==(void 0===e?"undefined":u(e))||null===e)return n;e=e[r[o]]}return void 0===e?n:e}function y(e,t){var n=void 0;return n=setTimeout(function r(){n=setTimeout(r,t),e.call()},t),{cancel:function(){clearTimeout(n)}}}function g(e,t){var n=y(function(){(t-=100)<=0&&(n.cancel(),e())},100)}function E(e,t){if(e)if(Array.isArray(e))for(var n=e.length,r=0;r<n;r++)t(e[r],r);else if("object"===(void 0===e?"undefined":u(e)))for(var o=Object.keys(e),i=o.length,a=0;a<i;a++){var c=o[a];t(e[c],c)}}function b(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"";if(Array.isArray(e)){var r=function(){for(var r=e.length,o=[],i=function(r){Object.defineProperty(o,r,{configurable:!0,enumerable:!0,get:function(){var i=n?n+"."+r:""+r,a=e[r],c=void 0===a?"undefined":u(a),s=t[c];if(s){var d=s(a,r,i);if(void 0!==d)return o[r]=d,o[r]}return"object"===(void 0===a?"undefined":u(a))&&null!==a?(o[r]=b(a,t,i),o[r]):(o[r]=a,o[r])},set:function(e){delete o[r],o[r]=e}})},a=0;a<r;a++)i(a);return{v:o}}();if("object"===(void 0===r?"undefined":u(r)))return r.v}else{if("object"!==(void 0===e?"undefined":u(e))||null===e)throw new Error("Pass an object or array");var o=function(){var r={},o=function(o){if(!e.hasOwnProperty(o))return"continue";Object.defineProperty(r,o,{configurable:!0,enumerable:!0,get:function(){var i=n?n+"."+o:""+o,a=e[o],c=void 0===a?"undefined":u(a),s=t[c];if(s){var d=s(a,o,i);if(void 0!==d)return r[o]=d,r[o]}return"object"===(void 0===a?"undefined":u(a))&&null!==a?(r[o]=b(a,t,i),r[o]):(r[o]=a,r[o])},set:function(e){delete r[o],r[o]=e}})};for(var i in e)o(i);return{v:r}}();if("object"===(void 0===o?"undefined":u(o)))return o.v}}function O(e,t,n,r){if(e.hasOwnProperty(n)){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o)}else t[n]=r}function _(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"",n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};for(var r in t=t?t+".":t,e)void 0!==e[r]&&null!==e[r]&&"function"!=typeof e[r]&&(e[r]&&Array.isArray(e[r])&&e[r].length&&e[r].every(function(e){return"object"!==(void 0===e?"undefined":u(e))})?n[""+t+r]=e[r].join(","):e[r]&&"object"===u(e[r])?n=_(e[r],""+t+r,n):n[""+t+r]=e[r].toString());return n}var S=new i.a;function T(e){if(null===e||void 0===e||"object"!==(void 0===e?"undefined":u(e))&&"function"!=typeof e)throw new Error("Invalid object");var t=S.get(e);return t||(t=(void 0===e?"undefined":u(e))+":"+p(),S.set(e,t)),t}function P(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:0;"string"==typeof e&&(e=new RegExp(e));var r=t.slice(n).match(e);if(r){var o=r.index,i=r[0];return{text:i,groups:r.slice(1),start:n+o,end:n+o+i.length,length:i.length,replace:function(e){return i?""+i.slice(0,n+o)+e+i.slice(o+i.length):""}}}}function C(e,t){for(var n=[],r=0;;){var o=P(e,t,r);if(!o)break;n.push(o),r=o.end}return n}function A(e,t){for(var n=0,r=0;;){var o=e.indexOf(t,n);if(-1===o)break;n=o,r+=1}return r}function j(e){return"string"==typeof e?e:e&&"function"==typeof e.toString?e.toString():Object.prototype.toString.call(e)}function L(e){if(e){var t=e.stack,n=e.message;if("string"==typeof t)return t;if("string"==typeof n)return n}return j(e)}function I(){var e={},t={};return{on:function(e,n){var r=t[e]=t[e]||[];r.push(n);var o=!1;return{cancel:function(){o||(o=!0,r.splice(r.indexOf(n),1))}}},once:function(e,t){var n=this.on(e,function(){n.cancel(),t()});return n},trigger:function(e){var n=t[e];if(n)for(var r=0,o=null==n?0:n.length;r<o;r++)(0,n[r])()},triggerOnce:function(t){e[t]||(e[t]=!0,this.trigger(t))}}}function N(){}function R(e){var t=!1,n=void 0;return function(){for(var r=arguments.length,o=Array(r),i=0;i<r;i++)o[i]=arguments[i];return t?n:(t=!0,n=e.apply(this,arguments))}}function D(e){var t={};return function(){for(var n=arguments.length,r=Array(n),o=0;o<n;o++)r[o]=arguments[o];var i=void 0;try{i=JSON.stringify(Array.prototype.slice.call(arguments),function(e,t){return"function"==typeof t?"zoid:memoize["+T(t)+"]":t})}catch(e){throw new Error("Arguments not serializable -- can not be used to memoize")}return t.hasOwnProperty(i)||(t[i]=e.apply(this,arguments)),t[i]}}function x(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:100,n=void 0;return function(){var r=this,o=arguments;clearTimeout(n),n=setTimeout(function(){return e.apply(r,o)},t)}}function M(e){return b(e,{function:function(){return{__type__:"__function__"}}})}function W(e,t){return b(e,{object:function(e,n,r){if(e&&"__function__"===e.__type__)return function(){return t({key:n,fullKey:r,self:this,args:arguments})}}})}var k=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},B="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};function G(e,t){e.appendChild(t)}function U(e,t){return Array.prototype.slice.call(e.querySelectorAll(t))}function F(e){if(function(e){return e instanceof window.Element||null!==e&&"object"===(void 0===e?"undefined":B(e))&&1===e.nodeType&&"object"===B(e.style)&&"object"===B(e.ownerDocument)}(e))return e;if("string"==typeof e){var t=document.getElementById(e);if(t)return t;if(document.querySelector&&(t=document.querySelector(e)),t)return t}}function z(e){var t=F(e);if(t)return t;throw new Error("Can not find element: "+j(e))}var H=new o.a(function(e){if("complete"===window.document.readyState)return e(window.document);var t=setInterval(function(){if("complete"===window.document.readyState)return clearInterval(t),e(window.document)},10)});function q(){return"complete"===window.document.readyState}function Y(e){return new o.a(function(t,n){var r=j(e),o=F(e);if(o)return t(o);if(q())return n(new Error("Document is ready and element "+r+" does not exist"));var i=setInterval(function(){return(o=F(e))?(clearInterval(i),t(o)):q()?(clearInterval(i),n(new Error("Document is ready and element "+r+" does not exist"))):void 0},10)})}function X(e,t){var n,o=Object.keys(t).map(function(e){if(t[e])return e+"="+j(t[e])}).filter(Boolean).join(","),i=void 0;try{i=window.open(e,t.name,o,!0)}catch(n){throw new a.b("Can not open popup window - "+(n.stack||n.message))}if(Object(r.y)(i))throw new a.b("Can not open popup window - blocked");return i}function Z(e,t){try{e.document.open(),e.document.write(t),e.document.close()}catch(n){try{e.location="javascript: document.open(); document.write("+JSON.stringify(t)+"); document.close();"}catch(e){}}}function J(e,t){var n=t.tagName.toLowerCase();if("html"!==n)throw new Error("Expected element to be html, got "+n);for(var r=e.document.documentElement;r.children&&r.children.length;)r.removeChild(r.children[0]);for(;t.children.length;)r.appendChild(t.children[0])}function K(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:window.document;e.styleSheet?e.styleSheet.cssText=t:e.appendChild(n.createTextNode(t))}function V(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"div",t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=arguments[2];e=e.toLowerCase();var r=document.createElement(e);if(t.style&&f(r.style,t.style),t.class&&(r.className=t.class.join(" ")),t.attributes)for(var o=0,i=Object.keys(t.attributes),a=null==i?0:i.length;o<a;o++){var u=i[o];r.setAttribute(u,t.attributes[u])}if(t.styleSheet&&K(r,t.styleSheet),n&&G(n,r),t.html)if("iframe"===e){if(!n||!r.contentWindow)throw new Error("Iframe html can not be written unless container provided and iframe in DOM");Z(r.contentWindow,t.html)}else r.innerHTML=t.html;return r}var $=new i.a;function Q(e){if($.has(e)){var t=$.get(e);if(t)return t}var n=new o.a(function(t,n){e.addEventListener("load",function(){Object(r.z)(e),t(e)}),e.addEventListener("error",function(r){e.contentWindow?t(e):n(r)})});return $.set(e,n),n}function ee(e){return e.contentWindow?o.a.resolve(e.contentWindow):Q(e).then(function(e){if(!e.contentWindow)throw new Error("Could not find window in iframe");return e.contentWindow})}function te(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=z(arguments[1]),n=e.attributes||{},r=e.style||{},o=V("iframe",{attributes:k({frameBorder:"0",allowTransparency:"true"},n),style:k({backgroundColor:"transparent"},r),html:e.html,class:e.class});return Q(o),t.appendChild(o),(e.url||window.navigator.userAgent.match(/MSIE|Edge/i))&&o.setAttribute("src",e.url||"about:blank"),o}function ne(e,t,n){return e.addEventListener(t,n),{cancel:function(){e.removeEventListener(t,n)}}}function re(e){if(!e)return e;if(e.match(/<script|on\w+\s*=|javascript:|expression\s*\(|eval\(|new\s*Function/))throw new Error("HTML contains potential javascript: "+e);return e}var oe=D(function(e){var t={};if(!e)return t;if(-1===e.indexOf("="))throw new Error("Can not parse query string params: "+e);for(var n=0,r=e.split("&"),o=null==r?0:r.length;n<o;n++){var i=r[n];(i=i.split("="))[0]&&i[1]&&(t[decodeURIComponent(i[0])]=decodeURIComponent(i[1]))}return t});function ie(e){return oe(window.location.search.slice(1))[e]}function ae(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return Object.keys(e).filter(function(t){return"string"==typeof e[t]}).map(function(t){return c(t)+"="+c(e[t])}).join("&")}function ue(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return t&&Object.keys(t).length?ae(k({},oe(e),t)):e}function ce(e){var t,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r=n.query||{},o=n.hash||{},i=void 0,a=e.split("#");i=a[0],t=a[1];var u=i.split("?");i=u[0];var c=ue(u[1],r),s=ue(t,o);return c&&(i=i+"?"+c),s&&(i=i+"#"+s),i}function se(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:5e3;return new o.a(function(n,r){var o=z(e),i=o.getBoundingClientRect(),a=void 0,u=void 0;a=setInterval(function(){var e=o.getBoundingClientRect();if(i.top===e.top&&i.bottom===e.bottom&&i.left===e.left&&i.right===e.right&&i.width===e.width&&i.height===e.height)return clearTimeout(u),clearInterval(a),n();i=e},50),u=setTimeout(function(){clearInterval(a),r(new Error("Timed out waiting for element to stop animating after "+t+"ms"))},t)})}function de(e){return{width:e.offsetWidth,height:e.offsetHeight}}function fe(e,t){return new o.a(function(n){for(var r=0,o=Object.keys(t),i=null==o?0:o.length;r<i;r++){var a=o[r];e.style[a]=t[a]}setTimeout(n,1)})}function le(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"auto",n=e.style,r=n.overflow,o=n.overflowX,i=n.overflowY;return e.style.overflow=e.style.overflowX=e.style.overflowY=t,{reset:function(){e.style.overflow=r,e.style.overflowX=o,e.style.overflowY=i}}}function pe(e,t){var n=t.width,r=void 0===n||n,o=t.height,i=void 0===o||o,a=t.threshold,u=void 0===a?0:a,c=de(e);return{check:function(){var t=de(e);return{changed:function(e,t,n){var r=n.width,o=n.height,i=void 0===o||o,a=n.threshold,u=void 0===a?0:a;return!(void 0!==r&&!r||!(Math.abs(e.width-t.width)>u))||!!(i&&Math.abs(e.height-t.height)>u)}(c,t,{width:r,height:i,threshold:u}),dimensions:t}},reset:function(){c=de(e)}}}function he(e,t){var n=t.width,r=void 0===n||n,i=t.height,a=void 0===i||i,u=t.delay,c=void 0===u?50:u,s=t.threshold,d=void 0===s?0:s;return new o.a(function(t){var n=pe(e,{width:r,height:a,threshold:d}),o=void 0,i=x(function(e){return clearInterval(o),t(e)},4*c);o=setInterval(function(){var e=n.check(),t=e.changed,r=e.dimensions;if(t)return n.reset(),i(r)},c),window.addEventListener("resize",function e(){var t=n.check(),r=t.changed,o=t.dimensions;r&&(n.reset(),window.removeEventListener("resize",e),i(o))})})}function we(e,t){var n=t.width,r=t.height,o=de(e);return!(n&&o.width!==window.innerWidth||r&&o.height!==window.innerHeight)}function me(e,t,n){n=R(n);for(var r=0,o=null==t?0:t.length;r<o;r++){var i=t[r];e.addEventListener(i,n)}return{cancel:R(function(){for(var r=0,o=null==t?0:t.length;r<o;r++){var i=t[r];e.removeEventListener(i,n)}})}}var ve=["webkit","moz","ms","o"];function ye(e,t,n){e.style[t]=n;for(var r=m(t),o=0,i=null==ve?0:ve.length;o<i;o++){var a=ve[o];e.style[""+a+r]=n}}var ge=window.CSSRule,Ee=ge.KEYFRAMES_RULE||ge.WEBKIT_KEYFRAMES_RULE||ge.MOZ_KEYFRAMES_RULE||ge.O_KEYFRAMES_RULE||ge.MS_KEYFRAMES_RULE,be=["animationstart","webkitAnimationStart","oAnimationStart","MSAnimationStart"],Oe=["animationend","webkitAnimationEnd","oAnimationEnd","MSAnimationEnd"];function _e(e,t,n){var r=arguments.length>3&&void 0!==arguments[3]?arguments[3]:1e3;return new o.a(function(o,i){var a=z(e);if(!a||!function(e,t){var n=a.ownerDocument.styleSheets;try{for(var r=0;r<n.length;r++){var o=n[r].cssRules;if(o)for(var i=0;i<o.length;i++){var u=o[i];if(u&&u.type===Ee&&u.name===t)return!0}}}catch(e){return!1}return!1}(0,t))return o();var u=!1,c=void 0,s=void 0,d=void 0,f=void 0;function l(){ye(a,"animationName",""),clearTimeout(c),clearTimeout(s),d.cancel(),f.cancel()}d=me(a,be,function(e){e.target===a&&e.animationName===t&&(clearTimeout(c),e.stopPropagation(),d.cancel(),u=!0,s=setTimeout(function(){l(),o()},r))}),f=me(a,Oe,function(e){if(e.target===a&&e.animationName===t)return l(),"string"==typeof e.animationName&&e.animationName!==t?i("Expected animation name to be "+t+", found "+e.animationName):o()}),ye(a,"animationName",t),c=setTimeout(function(){if(!u)return l(),o()},200),n&&n(l)})}var Se={DISPLAY:{NONE:"none",BLOCK:"block"},VISIBILITY:{VISIBLE:"visible",HIDDEN:"hidden"},IMPORTANT:"important"};function Te(e){e.style.setProperty("visibility","")}function Pe(e){e.style.setProperty("visibility",Se.VISIBILITY.HIDDEN,Se.IMPORTANT)}function Ce(e){e.style.setProperty("display","")}function Ae(e){e.style.setProperty("display",Se.DISPLAY.NONE,Se.IMPORTANT)}function je(e){e.parentNode&&e.parentNode.removeChild(e)}function Le(e,t,n){var r=_e(e,t,n);return Ce(e),r}function Ie(e,t,n){return _e(e,t,n).then(function(){Ae(e)})}function Ne(e,t){e.classList?e.classList.add(t):-1===e.className.split(/\s+/).indexOf(t)&&(e.className+=" "+t)}function Re(e,t){e.classList?e.classList.remove(t):-1!==e.className.split(/\s+/).indexOf(t)&&(e.className=e.className.replace(t,""))}function De(){return console.warn("Do not use zoid.getCurrentScriptDir() in production -- browser support is limited"),document.currentScript?document.currentScript.src.split("/").slice(0,-1).join("/"):"."}function xe(e){if("string"==typeof e)return e;if(!e||!e.tagName)return"<unknown>";var t=e.tagName.toLowerCase();return e.id?t+="#"+e.id:e.className&&(t+="."+e.className.split(" ").join(".")),t}function Me(e){return!e||!e.parentNode}function We(e,t){t=R(t);var n=void 0;return Me(e)?t():n=y(function(){Me(e)&&(n.cancel(),t())},50),{cancel:function(){n&&n.cancel()}}}function ke(e,t){return new o.a(function(n,r){var o=new window.XMLHttpRequest;o.open("GET",t),o.setRequestHeader("Accept",e),o.send(null),o.onload=function(){n(o.responseText)},o.onerror=function(){return r(new Error("prefetch failed"))}})}function Be(e){return ke("text/html",e)}function Ge(e){return ke("text/css",e)}function Ue(e){return ke("*/*",e)}function Fe(e){return Be(e)}var ze={onClick:"click"};function He(e){for(var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:window.document,n=0,r=U(e,"script"),o=null==r?0:r.length;n<o;n++){var i=r[n],a=t.createElement("script");a.text=i.textContent,i.parentNode.replaceChild(a,i)}}function qe(e,t,n){e=e.toLowerCase();var r=this&&this.createElement?this:window.document,o=r.createElement(e);for(var i in t)i in ze?o.addEventListener(ze[i],t[i]):"innerHTML"===i?(o.innerHTML=t[i],He(o,r)):o.setAttribute(i,t[i]);if("style"===e){if("string"!=typeof n)throw new TypeError("Expected "+e+" tag content to be string, got "+(void 0===n?"undefined":B(n)));if(arguments.length>3)throw new Error("Expected only text content for "+e+" tag");K(o,n,r)}else if("iframe"===e){if(arguments.length>3)throw new Error("Expected only single child node for iframe");o.addEventListener("load",function(){var e=o.contentWindow;if(!e)throw new Error("Expected frame to have contentWindow");"string"==typeof n?Z(e,n):J(e,n)})}else if("script"===e){if("string"!=typeof n)throw new TypeError("Expected "+e+" tag content to be string, got "+(void 0===n?"undefined":B(n)));if(arguments.length>3)throw new Error("Expected only text content for "+e+" tag");o.text=n}else for(var a=2;a<arguments.length;a++)if("string"==typeof arguments[a]){var u=r.createTextNode(arguments[a]);G(o,u)}else G(o,arguments[a]);return o}function Ye(e){return function(){var t=this,n=Array.prototype.slice.call(arguments);return n.length>=e.length?o.a.resolve(e.apply(t,n)):new o.a(function(r,o){n.push(function(e,t){if(e&&!(e instanceof Error))throw new Error("Passed non-Error object in callback: [ "+e+" ] -- callbacks should either be called with callback(new Error(...)) or callback(null, result).");return e?o(e):r(t)}),e.apply(t,n)})}}function Xe(e){return function(){var t=this,n=arguments;return o.a.try(function(){return e.apply(t,n)})}}function Ze(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:1;return new o.a(function(t){setTimeout(t,e)})}function Je(e){return o.a.try(e).then(function(){return Je(e)})}function Ke(e){return"string"==typeof e&&/^[0-9]+%$/.test(e)}function Ve(e){return"string"==typeof e&&/^[0-9]+px$/.test(e)}function $e(e){if("number"==typeof e)return e;var t=e.match(/^([0-9]+)(px|%)$/);if(!t)throw new Error("Could not match css value from "+e);return parseInt(t[1],10)}function Qe(e){return $e(e)+"px"}function et(e){return"number"==typeof e?Qe(e):Ke(e)?e:Qe(e)}function tt(e,t){return parseInt(e*$e(t)/100,10)}function nt(e,t){if("number"==typeof e)return e;if(Ke(e))return tt(t,e);if(Ve(e))return $e(e);throw new Error("Can not normalize dimension: "+e)}function rt(e,t,n){var r=n.value;n.value=function(){return this.__memoized__=this.__memoized__||{},this.__memoized__.hasOwnProperty(t)||(this.__memoized__[t]=r.apply(this,arguments)),this.__memoized__[t]},n.value.displayName=t+":memoized"}function ot(e,t,n){var r=n.value;n.value=function(){return o.a.try(r,this,arguments)},n.value.displayName=t+":promisified"}var it=n(8),at=n(11);function ut(e){if(-1===at.e.indexOf(e))throw new Error("Invalid logLevel: "+e);at.a.logLevel=e,it.CONFIG.LOG_LEVEL=e,window.LOG_LEVEL=e}function ct(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};Object(at.d)("xc_"+e+"_"+t,n)}function st(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};Object(at.f)("xc_"+e+"_"+t,n)}function dt(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};Object(at.b)("xc_"+e+"_"+t,n)}var ft=n(7);function lt(e){if(Object(r.u)(e))return e[ft.__ZOID__]||(e[ft.__ZOID__]={}),e[ft.__ZOID__]}function pt(){var e=lt(window);if(!e)throw new Error("Could not get local global");return e}var ht=pt();n.d(t,"d",function(){return G}),n.d(t,!1,function(){return U}),n.d(t,!1,function(){return F}),n.d(t,"t",function(){return z}),n.d(t,!1,function(){return H}),n.d(t,!1,function(){return q}),n.d(t,"m",function(){return Y}),n.d(t,!1,function(){return X}),n.d(t,"V",function(){return Z}),n.d(t,"U",function(){return J}),n.d(t,!1,function(){return K}),n.d(t,!1,function(){return V}),n.d(t,"e",function(){return Q}),n.d(t,"f",function(){return ee}),n.d(t,"x",function(){return te}),n.d(t,"b",function(){return ne}),n.d(t,!1,function(){return re}),n.d(t,!1,function(){return oe}),n.d(t,!1,function(){return ie}),n.d(t,!1,function(){return ae}),n.d(t,!1,function(){return ue}),n.d(t,"q",function(){return ce}),n.d(t,!1,function(){return se}),n.d(t,!1,function(){return de}),n.d(t,!1,function(){return fe}),n.d(t,!1,function(){return le}),n.d(t,!1,function(){return pe}),n.d(t,!1,function(){return he}),n.d(t,!1,function(){return we}),n.d(t,!1,function(){return me}),n.d(t,!1,function(){return ye}),n.d(t,!1,function(){return _e}),n.d(t,!1,function(){return Te}),n.d(t,!1,function(){return Pe}),n.d(t,"N",function(){return Ce}),n.d(t,"w",function(){return Ae}),n.d(t,"k",function(){return je}),n.d(t,"M",function(){return Le}),n.d(t,"c",function(){return Ie}),n.d(t,"a",function(){return Ne}),n.d(t,"I",function(){return Re}),n.d(t,"s",function(){return De}),n.d(t,!1,function(){return xe}),n.d(t,!1,function(){return Me}),n.d(t,"T",function(){return We}),n.d(t,!1,function(){return ke}),n.d(t,!1,function(){return Be}),n.d(t,!1,function(){return Ge}),n.d(t,!1,function(){return Ue}),n.d(t,"G",function(){return Fe}),n.d(t,!1,function(){return He}),n.d(t,"B",function(){return qe}),n.d(t,"E",function(){return N}),n.d(t,"F",function(){return R}),n.d(t,"C",function(){return D}),n.d(t,!1,function(){return x}),n.d(t,"K",function(){return M}),n.d(t,"j",function(){return W}),n.d(t,"i",function(){return Ye}),n.d(t,"H",function(){return Xe}),n.d(t,!1,function(){return Ze}),n.d(t,!1,function(){return Je}),n.d(t,!1,function(){return c}),n.d(t,!1,function(){return s}),n.d(t,"h",function(){return d}),n.d(t,"p",function(){return f}),n.d(t,!1,function(){return l}),n.d(t,"R",function(){return p}),n.d(t,!1,function(){return h}),n.d(t,!1,function(){return w}),n.d(t,!1,function(){return m}),n.d(t,"r",function(){return v}),n.d(t,!1,function(){return y}),n.d(t,!1,function(){return g}),n.d(t,!1,function(){return E}),n.d(t,"J",function(){return b}),n.d(t,"g",function(){return O}),n.d(t,"l",function(){return _}),n.d(t,!1,function(){return T}),n.d(t,!1,function(){return P}),n.d(t,!1,function(){return C}),n.d(t,!1,function(){return A}),n.d(t,"O",function(){return j}),n.d(t,"P",function(){return L}),n.d(t,"o",function(){return I}),n.d(t,"z",function(){return Ke}),n.d(t,"A",function(){return Ve}),n.d(t,!1,function(){return $e}),n.d(t,!1,function(){return Qe}),n.d(t,"Q",function(){return et}),n.d(t,!1,function(){return tt}),n.d(t,!1,function(){return nt}),n.d(t,"D",function(){return rt}),n.d(t,!1,function(){return ot}),n.d(t,"L",function(){return ut}),n.d(t,"y",function(){return ct}),n.d(t,"S",function(){return st}),n.d(t,"n",function(){return dt}),n.d(t,"v",function(){return lt}),n.d(t,!1,function(){return pt}),n.d(t,"u",function(){return ht})},function(e,t,n){"use strict";n.d(t,"a",function(){return o});var r=n(2),o=window[r.b.WINDOW_PROPS.POSTROBOT]=window[r.b.WINDOW_PROPS.POSTROBOT]||{};o.registerSelf=function(){}},function(e,t,n){"use strict";var r=n(6),o=n(0),i=n(2),a="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};function u(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:1;if(t>=3)return"stringifyError stack overflow";try{if(!e)return"<unknown error: "+Object.prototype.toString.call(e)+">";if("string"==typeof e)return e;if(e instanceof Error){var n=e&&e.stack,r=e&&e.message;if(n&&r)return-1!==n.indexOf(r)?n:r+"\n"+n;if(n)return n;if(r)return r}return"function"==typeof e.toString?e.toString():Object.prototype.toString.call(e)}catch(e){return"Error while stringifying error: "+u(e,t+1)}}var c=function(e){if(!e)return e;var t=!1;return function(){if(!t)return t=!0,e.apply(this,arguments)}};function s(){}function d(e,t,n){return e.addEventListener?e.addEventListener(t,n):e.attachEvent("on"+t,n),{cancel:function(){e.removeEventListener?e.removeEventListener(t,n):e.detachEvent("on"+t,n)}}}function f(){var e="0123456789abcdef";return"xxxxxxxxxx".replace(/./g,function(){return e.charAt(Math.floor(Math.random()*e.length))})}function l(e,t){for(var n=0;n<e.length;n++)t(e[n],n)}function p(e,t){for(var n in e)e.hasOwnProperty(n)&&t(e[n],n)}function h(e,t){Array.isArray(e)?l(e,t):"object"===(void 0===e?"undefined":a(e))&&null!==e&&p(e,t)}function w(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:1;if(n>=100)throw new Error("Self-referential object passed, or object contained too many layers");var r=void 0;if("object"!==(void 0===e?"undefined":a(e))||null===e||Array.isArray(e)){if(!Array.isArray(e))throw new TypeError("Invalid type: "+(void 0===e?"undefined":a(e)));r=[]}else r={};return h(e,function(e,o){var i=t(e,o);void 0!==i?r[o]=i:"object"===(void 0===e?"undefined":a(e))&&null!==e?r[o]=w(e,t,n+1):r[o]=e}),r}function m(e,t){var n=void 0;return n=setTimeout(function r(){n=setTimeout(r,t),e.call()},t),{cancel:function(){clearTimeout(n)}}}function v(e){return"[object RegExp]"===Object.prototype.toString.call(e)}var y=function(e){var t=new r.a;return function(n){var r=t.get(n);return void 0!==r?r:(void 0!==(r=e.call(this,n))&&t.set(n,r),r)}};function g(){return Object(o.t)()?i.b.WINDOW_TYPES.POPUP:Object(o.r)()?i.b.WINDOW_TYPES.IFRAME:i.b.WINDOW_TYPES.FULLPAGE}function E(e,t,n){var r=void 0,o=void 0;try{if("{}"!==JSON.stringify({})&&(r=Object.prototype.toJSON,delete Object.prototype.toJSON),"{}"!==JSON.stringify({}))throw new Error("Can not correctly serialize JSON objects");if("[]"!==JSON.stringify([])&&(o=Array.prototype.toJSON,delete Array.prototype.toJSON),"[]"!==JSON.stringify([]))throw new Error("Can not correctly serialize JSON objects")}catch(e){throw new Error("Can not repair JSON.stringify: "+e.message)}var i=JSON.stringify.call(this,e,t,n);try{r&&(Object.prototype.toJSON=r),o&&(Array.prototype.toJSON=o)}catch(e){throw new Error("Can not repair JSON.stringify: "+e.message)}return i}function b(e){return JSON.parse(e)}function O(){return!!Object(o.o)(window).match(/MSIE|trident|edge\/12|edge\/13/i)||!i.a.ALLOW_POSTMESSAGE_POPUP}var _=n(1),S=n(4),T="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};S.a.methods=S.a.methods||new r.a;var P=c(function(){S.a.on(i.b.POST_MESSAGE_NAMES.METHOD,{origin:i.b.WILDCARD},function(e){var t=e.source,n=e.origin,r=e.data,i=S.a.methods.get(t);if(!i)throw new Error("Could not find any methods this window has privileges to call");var a=i[r.id];if(!a)throw new Error("Could not find method with id: "+r.id);if(!Object(o.A)(a.domain,n))throw new Error("Method domain "+a.domain+" does not match origin "+n);return _.a.try(function(){return a.method.apply({source:t,origin:n,data:r},r.args)}).then(function(e){return{result:e,id:r.id,name:r.name}})})});function C(e,t){return"object"===(void 0===e?"undefined":T(e))&&null!==e&&e.__type__===t}function A(e,t,n,r){var o=f(),a=S.a.methods.get(e);return a||(a={},S.a.methods.set(e,a)),a[o]={domain:t,method:n},{__type__:i.b.SERIALIZATION_TYPES.METHOD,__id__:o,__name__:r}}function j(e,t,n){return w({obj:n},function(n,r){return"function"==typeof n?A(e,t,n,r.toString()):n instanceof Error?(o=n,{__type__:i.b.SERIALIZATION_TYPES.ERROR,__message__:u(o),__code__:o.code}):window.Promise&&n instanceof window.Promise?function(e,t,n,r){return{__type__:i.b.SERIALIZATION_TYPES.PROMISE,__then__:A(e,t,function(e,t){return n.then(e,t)},r+".then")}}(e,t,n,r.toString()):_.a.isPromise(n)?function(e,t,n,r){return{__type__:i.b.SERIALIZATION_TYPES.ZALGO_PROMISE,__then__:A(e,t,function(e,t){return n.then(e,t)},r+".then")}}(e,t,n,r.toString()):v(n)?(a=n,{__type__:i.b.SERIALIZATION_TYPES.REGEX,__source__:a.source}):void 0;var o,a}).obj}function L(e,t,n){function r(){var r=Array.prototype.slice.call(arguments);return S.a.send(e,i.b.POST_MESSAGE_NAMES.METHOD,{id:n.__id__,name:n.__name__,args:r},{domain:t,timeout:-1}).then(function(e){return e.data.result},function(e){throw e})}return r.__name__=n.__name__,r.__xdomain__=!0,r.source=e,r.origin=t,r}function I(e,t,n){var r=new Error(n.__message__);return n.__code__&&(r.code=n.__code__),r}function N(e,t,n){return new _.a(function(r,o){return L(e,t,n.__then__)(r,o)})}function R(e,t,n){return window.Promise?new window.Promise(function(r,o){return L(e,t,n.__then__)(r,o)}):N(e,t,n)}function D(e,t,n){return new RegExp(n.__source__)}function x(e,t,n){return w({obj:n},function(n){if("object"===(void 0===n?"undefined":T(n))&&null!==n)return C(n,i.b.SERIALIZATION_TYPES.METHOD)?L(e,t,n):C(n,i.b.SERIALIZATION_TYPES.ERROR)?I(0,0,n):C(n,i.b.SERIALIZATION_TYPES.PROMISE)?R(e,t,n):C(n,i.b.SERIALIZATION_TYPES.ZALGO_PROMISE)?N(e,t,n):C(n,i.b.SERIALIZATION_TYPES.REGEX)?D(0,0,n):void 0}).obj}function M(e){S.a.on(i.b.POST_MESSAGE_NAMES.HELLO,{domain:i.b.WILDCARD},function(t){var n=t.source,r=t.origin;return e({source:n,origin:r})})}function W(e){return S.a.send(e,i.b.POST_MESSAGE_NAMES.HELLO,{},{domain:i.b.WILDCARD,timeout:-1}).then(function(e){return{origin:e.origin}})}function k(){M(function(e){var t=e.source,n=e.origin,r=S.a.readyPromises.get(t)||new _.a;r.resolve({origin:n}),S.a.readyPromises.set(t,r)});var e=Object(o.e)();e&&W(e).catch(s)}function B(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:5e3,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"Window",r=S.a.readyPromises.get(e);return r||(r=new _.a,S.a.readyPromises.set(e,r),-1!==t&&setTimeout(function(){return r.reject(new Error(n+" did not load after "+t+"ms"))},t),r)}S.a.readyPromises=S.a.readyPromises||new r.a,n.d(t,"p",function(){return u}),n.d(t,"l",function(){return c}),n.d(t,"j",function(){return s}),n.d(t,"a",function(){return d}),n.d(t,"q",function(){return f}),n.d(t,!1,function(){return l}),n.d(t,!1,function(){return p}),n.d(t,!1,function(){return h}),n.d(t,!1,function(){return w}),n.d(t,"m",function(){return m}),n.d(t,"e",function(){return v}),n.d(t,"r",function(){return y}),n.d(t,"c",function(){return g}),n.d(t,"g",function(){return E}),n.d(t,"f",function(){return b}),n.d(t,"i",function(){return O}),n.d(t,"h",function(){return P}),n.d(t,!1,function(){return A}),n.d(t,"o",function(){return j}),n.d(t,!1,function(){return L}),n.d(t,!1,function(){return I}),n.d(t,!1,function(){return N}),n.d(t,!1,function(){return R}),n.d(t,!1,function(){return D}),n.d(t,"b",function(){return x}),n.d(t,!1,function(){return M}),n.d(t,"n",function(){return W}),n.d(t,"d",function(){return k}),n.d(t,"k",function(){return B})},function(e,t,n){"use strict";var r=n(0);function o(e,t){for(var n=0;n<e.length;n++)try{if(e[n]===t)return n}catch(e){}return-1}var i=function(){function e(){if(function(t,n){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this),this.name="__weakmap_"+(1e9*Math.random()>>>0)+"__",function(){if("undefined"==typeof WeakMap)return!1;if(void 0===Object.freeze)return!1;try{var e=new WeakMap,t={};return Object.freeze(t),e.set(t,"__testvalue__"),"__testvalue__"===e.get(t)}catch(e){return!1}}())try{this.weakmap=new WeakMap}catch(e){}this.keys=[],this.values=[]}return e.prototype._cleanupClosedWindows=function(){for(var e=this.weakmap,t=this.keys,n=0;n<t.length;n++){var o=t[n];if(Object(r.x)(o)&&Object(r.y)(o)){if(e)try{e.delete(o)}catch(e){}t.splice(n,1),this.values.splice(n,1),n-=1}}},e.prototype.isSafeToReadWrite=function(e){if(Object(r.x)(e))return!1;try{e&&e.self,e&&e[this.name]}catch(e){return!1}return!0},e.prototype.set=function(e,t){if(!e)throw new Error("WeakMap expected key");var n=this.weakmap;if(n)try{n.set(e,t)}catch(e){delete this.weakmap}if(this.isSafeToReadWrite(e))try{var r=this.name,i=e[r];return void(i&&i[0]===e?i[1]=t:Object.defineProperty(e,r,{value:[e,t],writable:!0}))}catch(e){}this._cleanupClosedWindows();var a=this.keys,u=this.values,c=o(a,e);-1===c?(a.push(e),u.push(t)):u[c]=t},e.prototype.get=function(e){if(!e)throw new Error("WeakMap expected key");var t=this.weakmap;if(t)try{if(t.has(e))return t.get(e)}catch(e){delete this.weakmap}if(this.isSafeToReadWrite(e))try{var n=e[this.name];return n&&n[0]===e?n[1]:void 0}catch(e){}this._cleanupClosedWindows();var r=o(this.keys,e);if(-1!==r)return this.values[r]},e.prototype.delete=function(e){if(!e)throw new Error("WeakMap expected key");var t=this.weakmap;if(t)try{t.delete(e)}catch(e){delete this.weakmap}if(this.isSafeToReadWrite(e))try{var n=e[this.name];n&&n[0]===e&&(n[0]=n[1]=void 0)}catch(e){}this._cleanupClosedWindows();var r=this.keys,i=o(r,e);-1!==i&&(r.splice(i,1),this.values.splice(i,1))},e.prototype.has=function(e){if(!e)throw new Error("WeakMap expected key");var t=this.weakmap;if(t)try{if(t.has(e))return!0}catch(e){delete this.weakmap}if(this.isSafeToReadWrite(e))try{var n=e[this.name];return!(!n||n[0]!==e)}catch(e){}return this._cleanupClosedWindows(),-1!==o(this.keys,e)},e.prototype.getOrSet=function(e,t){if(this.has(e))return this.get(e);var n=t();return this.set(e,n),n},e}();n.d(t,"a",function(){return i})},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),n.d(t,"ZOID",function(){return r}),n.d(t,"__ZOID__",function(){return o}),n.d(t,"POST_MESSAGE",function(){return i}),n.d(t,"PROP_TYPES",function(){return a}),n.d(t,"INITIAL_PROPS",function(){return u}),n.d(t,"WINDOW_REFERENCES",function(){return c}),n.d(t,"PROP_TYPES_LIST",function(){return s}),n.d(t,"CONTEXT_TYPES",function(){return d}),n.d(t,"CLASS_NAMES",function(){return f}),n.d(t,"EVENTS",function(){return l}),n.d(t,"ATTRIBUTES",function(){return p}),n.d(t,"ANIMATION_NAMES",function(){return h}),n.d(t,"EVENT_NAMES",function(){return w}),n.d(t,"CLOSE_REASONS",function(){return m}),n.d(t,"CONTEXT_TYPES_LIST",function(){return v}),n.d(t,"DELEGATE",function(){return y}),n.d(t,"WILDCARD",function(){return g}),n.d(t,"DEFAULT_DIMENSIONS",function(){return E});var r="zoid",o="__"+r+"__",i={INIT:r+"_init",PROPS:r+"_props",PROP_CALLBACK:r+"_prop_callback",CLOSE:r+"_close",CHECK_CLOSE:r+"_check_close",REDIRECT:r+"_redirect",RESIZE:r+"_resize",DELEGATE:r+"_delegate",ALLOW_DELEGATE:r+"_allow_delegate",ERROR:r+"_error",HIDE:r+"_hide",SHOW:r+"_show"},a={STRING:"string",OBJECT:"object",FUNCTION:"function",BOOLEAN:"boolean",NUMBER:"number"},u={RAW:"raw",UID:"uid"},c={OPENER:"opener",TOP:"top",PARENT:"parent",GLOBAL:"global"},s=Object.keys(a).map(function(e){return a[e]}),d={IFRAME:"iframe",POPUP:"popup"},f={ZOID:""+r,OUTLET:r+"-outlet",COMPONENT_FRAME:r+"-component-frame",PRERENDER_FRAME:r+"-prerender-frame",VISIBLE:r+"-visible",INVISIBLE:r+"-invisible"},l={CLOSE:r+"-close"},p={IFRAME_PLACEHOLDER:"data-zoid-"+r+"-placeholder"},h={SHOW_CONTAINER:r+"-show-container",SHOW_COMPONENT:r+"-show-component",HIDE_CONTAINER:r+"-hide-container",HIDE_COMPONENT:r+"-hide-component"},w={CLICK:"click"},m={PARENT_CALL:"parent_call",CHILD_CALL:"child_call",CLOSE_DETECTED:"close_detected",USER_CLOSED:"user_closed",PARENT_CLOSE_DETECTED:"parent_close_detected"},v=Object.keys(d).map(function(e){return d[e]}),y={CALL_ORIGINAL:"call_original",CALL_DELEGATE:"call_delegate"},g="*",E={WIDTH:300,HEIGHT:150}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r={};n.d(r,"cleanUpWindow",function(){return B}),n.d(r,"Promise",function(){return c.a}),n.d(r,"bridge",function(){return G}),n.d(r,"init",function(){return U}),n.d(r,"parent",function(){return k}),n.d(r,"send",function(){return j}),n.d(r,"request",function(){return A}),n.d(r,"sendToParent",function(){return L}),n.d(r,"client",function(){return I}),n.d(r,"on",function(){return D}),n.d(r,"listen",function(){return R}),n.d(r,"once",function(){return x}),n.d(r,"listener",function(){return M}),n.d(r,"CONFIG",function(){return a.a}),n.d(r,"CONSTANTS",function(){return a.b}),n.d(r,"disable",function(){return W});var o=n(5),i=n(0),a=n(2),u=n(4),c=n(1),s={};s[a.b.SEND_STRATEGIES.POST_MESSAGE]=function(e,t,r){try{n(12).emulateIERestrictions(window,e)}catch(e){return}(Array.isArray(r)?r:"string"==typeof r?[r]:[a.b.WILDCARD]).map(function(t){if(0===t.indexOf(a.b.MOCK_PROTOCOL)){if(window.location.protocol===a.b.FILE_PROTOCOL)return a.b.WILDCARD;if(!Object(i.p)(e))throw new Error("Attempting to send messsage to mock domain "+t+", but window is actually cross-domain");return Object(i.c)(e)}return 0===t.indexOf(a.b.FILE_PROTOCOL)?a.b.WILDCARD:t}).forEach(function(n){return e.postMessage(t,n)})};var d=n(10),f=d.sendBridgeMessage,l=d.needsBridgeForBrowser,p=d.isBridge;s[a.b.SEND_STRATEGIES.BRIDGE]=function(e,t,n){if(l()||p()){if(Object(i.u)(e))throw new Error("Post message through bridge disabled between same domain windows");if(!1!==Object(i.v)(window,e))throw new Error("Can only use bridge to communicate between two different windows, not between frames");return f(e,t,n)}},s[a.b.SEND_STRATEGIES.GLOBAL]=function(e,t){if(Object(o.i)()){if(!Object(i.u)(e))throw new Error("Post message through global disabled between different domain windows");if(!1!==Object(i.v)(window,e))throw new Error("Can only use global to communicate between two different windows, not between frames");var n=e[a.b.WINDOW_PROPS.POSTROBOT];if(!n)throw new Error("Can not find postRobot global on foreign window");return n.receiveMessage({source:window,origin:Object(i.g)(),data:t})}};var h=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e};function w(e,t,n){return c.a.try(function(){var r;if(t=function(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},r=Object(o.q)(),a=Object(o.c)(),u=Object(i.g)(window);return h({},t,n,{sourceDomain:u,id:t.id||r,windowType:a})}(e,t,{data:Object(o.o)(e,n,t.data),domain:n}),e===window&&!a.a.ALLOW_SAME_ORIGIN)throw new Error("Attemping to send message to self");if(Object(i.y)(e))throw new Error("Window is closed");var u=[],d=Object(o.g)(((r={})[a.b.WINDOW_PROPS.POSTROBOT]=t,r),null,2);return c.a.map(Object.keys(s),function(t){return c.a.try(function(){if(!a.a.ALLOWED_POST_MESSAGE_METHODS[t])throw new Error("Strategy disallowed: "+t);return s[t](e,d,n)}).then(function(){return u.push(t+": success"),!0},function(e){return u.push(t+": "+Object(o.p)(e)+"\n"),!1})}).then(function(e){var n=e.some(Boolean),r=t.type+" "+t.name+" "+(n?"success":"error")+":\n  - "+u.join("\n  - ")+"\n";if(!n)throw new Error(r)})})}var m=n(6);u.a.responseListeners=u.a.responseListeners||{},u.a.requestListeners=u.a.requestListeners||{},u.a.WINDOW_WILDCARD=u.a.WINDOW_WILDCARD||new function(){},u.a.erroredResponseListeners=u.a.erroredResponseListeners||{};var v,y="__domain_regex__";function g(e){return u.a.responseListeners[e]}function E(e){delete u.a.responseListeners[e]}function b(e){return Boolean(u.a.erroredResponseListeners[e])}function O(e){var t=e.name,n=e.win,r=e.domain;if(n===a.b.WILDCARD&&(n=null),r===a.b.WILDCARD&&(r=null),!t)throw new Error("Name required to get request listener");var o=u.a.requestListeners[t];if(o)for(var c=0,s=[n,u.a.WINDOW_WILDCARD],d=null==s?0:s.length;c<d;c++){var f=s[c],l=f&&o.get(f);if(l){if(r&&"string"==typeof r){if(l[r])return l[r];if(l[y])for(var p=0,h=l[y],w=null==h?0:h.length;p<w;p++){var m=h[p],v=m.regex,g=m.listener;if(Object(i.A)(v,r))return g}}if(l[a.b.WILDCARD])return l[a.b.WILDCARD]}}}var _=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},S=((v={})[a.b.POST_MESSAGE_TYPE.ACK]=function(e,t,n){if(!b(n.hash)){var r=g(n.hash);if(!r)throw new Error("No handler found for post message ack for message: "+n.name+" from "+t+" in "+window.location.protocol+"//"+window.location.host+window.location.pathname);if(!Object(i.A)(r.domain,t))throw new Error("Ack origin "+t+" does not match domain "+r.domain.toString());r.ack=!0}},v[a.b.POST_MESSAGE_TYPE.REQUEST]=function(e,t,n){var r=O({name:n.name,win:e,domain:t});function u(r){return n.fireAndForget||Object(i.y)(e)?c.a.resolve():w(e,_({target:n.originalSource,hash:n.hash,name:n.name},r),t)}return c.a.all([u({type:a.b.POST_MESSAGE_TYPE.ACK}),c.a.try(function(){if(!r)throw new Error("No handler found for post message: "+n.name+" from "+t+" in "+window.location.protocol+"//"+window.location.host+window.location.pathname);if(!Object(i.A)(r.domain,t))throw new Error("Request origin "+t+" does not match domain "+r.domain.toString());var o=n.data;return r.handler({source:e,origin:t,data:o})}).then(function(e){return u({type:a.b.POST_MESSAGE_TYPE.RESPONSE,ack:a.b.POST_MESSAGE_ACK.SUCCESS,data:e})},function(e){var t=Object(o.p)(e).replace(/^Error: /,""),n=e.code;return u({type:a.b.POST_MESSAGE_TYPE.RESPONSE,ack:a.b.POST_MESSAGE_ACK.ERROR,error:t,code:n})})]).then(o.j).catch(function(e){if(r&&r.handleError)return r.handleError(e);throw e})},v[a.b.POST_MESSAGE_TYPE.RESPONSE]=function(e,t,n){if(!b(n.hash)){var r=g(n.hash);if(!r)throw new Error("No handler found for post message response for message: "+n.name+" from "+t+" in "+window.location.protocol+"//"+window.location.host+window.location.pathname);if(!Object(i.A)(r.domain,t))throw new Error("Response origin "+t+" does not match domain "+Object(i.C)(r.domain));if(E(n.hash),n.ack===a.b.POST_MESSAGE_ACK.ERROR){var o=new Error(n.error);return n.code&&(o.code=n.code),r.respond(o,null)}if(n.ack===a.b.POST_MESSAGE_ACK.SUCCESS){var u=n.data||n.response;return r.respond(null,{source:e,origin:t,data:u})}}},v),T="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};function P(e){if(window&&!window.closed){try{if(!e.source)return}catch(e){return}var t=e.source,n=e.origin,r=function(e){var t=void 0;try{t=Object(o.f)(e)}catch(e){return}if(t&&"object"===(void 0===t?"undefined":T(t))&&null!==t&&(t=t[a.b.WINDOW_PROPS.POSTROBOT])&&"object"===(void 0===t?"undefined":T(t))&&null!==t&&t.type&&"string"==typeof t.type&&S[t.type])return t}(e.data);if(r){if(!r.sourceDomain||"string"!=typeof r.sourceDomain)throw new Error("Expected message to have sourceDomain");0!==r.sourceDomain.indexOf(a.b.MOCK_PROTOCOL)&&0!==r.sourceDomain.indexOf(a.b.FILE_PROTOCOL)||(n=r.sourceDomain),-1===u.a.receivedMessages.indexOf(r.id)&&(u.a.receivedMessages.push(r.id),Object(i.y)(t)&&!r.fireAndForget||(r.data&&(r.data=Object(o.b)(t,n,r.data)),S[r.type](t,n,r)))}}}function C(e){try{Object(o.j)(e.source)}catch(e){return}var t={source:e.source||e.sourceElement,origin:e.origin||e.originalEvent&&e.originalEvent.origin,data:e.data};try{n(12).emulateIERestrictions(t.source,window)}catch(e){return}P(t)}function A(e){return c.a.try(function(){if(!e.name)throw new Error("Expected options.name");var t=e.name,n=void 0,r=void 0;if("string"==typeof e.window){var s=document.getElementById(e.window);if(!s)throw new Error("Expected options.window "+Object.prototype.toString.call(e.window)+" to be a valid element id");if("iframe"!==s.tagName.toLowerCase())throw new Error("Expected options.window "+Object.prototype.toString.call(e.window)+" to be an iframe");if(!s.contentWindow)throw new Error("Iframe must have contentWindow.  Make sure it has a src attribute and is in the DOM.");n=s.contentWindow}else if(e.window instanceof HTMLIFrameElement){if("iframe"!==e.window.tagName.toLowerCase())throw new Error("Expected options.window "+Object.prototype.toString.call(e.window)+" to be an iframe");if(e.window&&!e.window.contentWindow)throw new Error("Iframe must have contentWindow.  Make sure it has a src attribute and is in the DOM.");e.window&&e.window.contentWindow&&(n=e.window.contentWindow)}else n=e.window;if(!n)throw new Error("Expected options.window to be a window object, iframe, or iframe element id.");var d=n;r=e.domain||a.b.WILDCARD;var f=e.name+"_"+Object(o.q)();if(Object(i.y)(d))throw new Error("Target window is closed");var l=!1,p=u.a.requestPromises.get(d);p||(p=[],u.a.requestPromises.set(d,p));var h=c.a.try(function(){if(Object(i.q)(window,d))return Object(o.k)(d,e.timeout||a.a.CHILD_WINDOW_TIMEOUT)}).then(function(){var e=(arguments.length>0&&void 0!==arguments[0]?arguments[0]:{}).origin;if(Object(o.e)(r)&&!e)return Object(o.n)(d)}).then(function(){var n=(arguments.length>0&&void 0!==arguments[0]?arguments[0]:{}).origin;if(Object(o.e)(r)){if(!Object(i.A)(r,n))throw new Error("Remote window domain "+n+" does not match regex: "+r.toString());r=n}if("string"!=typeof r&&!Array.isArray(r))throw new TypeError("Expected domain to be a string or array");var s=r;return new c.a(function(n,r){var o=void 0;if(e.fireAndForget||function(e,t){u.a.responseListeners[e]=t}(f,o={name:t,window:d,domain:s,respond:function(e,t){e||(l=!0,p.splice(p.indexOf(h,1))),e?r(e):n(t)}}),w(d,{type:a.b.POST_MESSAGE_TYPE.REQUEST,hash:f,name:t,data:e.data,fireAndForget:e.fireAndForget},s).catch(r),e.fireAndForget)return n();var c=a.a.ACK_TIMEOUT,m=e.timeout||a.a.RES_TIMEOUT,v=100;setTimeout(function n(){if(!l){if(Object(i.y)(d))return o.ack?r(new Error("Window closed for "+t+" before response")):r(new Error("Window closed for "+t+" before ack"));if(c=Math.max(c-v,0),-1!==m&&(m=Math.max(m-v,0)),o.ack){if(-1===m)return;v=Math.min(m,2e3)}else{if(0===c)return r(new Error("No ack for postMessage "+t+" in "+Object(i.g)()+" in "+a.a.ACK_TIMEOUT+"ms"));if(0===m)return r(new Error("No response for postMessage "+t+" in "+Object(i.g)()+" in "+(e.timeout||a.a.RES_TIMEOUT)+"ms"))}setTimeout(n,v)}},v)})});return h.catch(function(){!function(e){u.a.erroredResponseListeners[e]=!0}(f),E(f)}),p.push(h),h})}function j(e,t,n,r){return(r=r||{}).window=e,r.name=t,r.data=n,A(r)}function L(e,t,n){var r=Object(i.e)();return r?j(r,e,t,n):new c.a(function(e,t){return t(new Error("Window does not have a parent"))})}function I(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};if(!e.window)throw new Error("Expected options.window");var t=e.window;return{send:function(n,r){return j(t,n,r,e)}}}u.a.receivedMessages=u.a.receivedMessages||[],u.a.receiveMessage=P,u.a.requestPromises=u.a.requestPromises||new m.a,u.a.send=j;var N="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};function R(e){if(!e.name)throw new Error("Expected options.name");if(!e.handler)throw new Error("Expected options.handler");var t=e.name,n=e.window,r=e.domain,c={handler:e.handler,handleError:e.errorHandler||function(e){throw e},window:n,domain:r||a.b.WILDCARD,name:t},s=function e(t,n){var r=t.name,i=t.win,c=t.domain;if(!r||"string"!=typeof r)throw new Error("Name required to add request listener");if(Array.isArray(i)){for(var s=[],d=0,f=i,l=null==f?0:f.length;d<l;d++){var p=f[d];s.push(e({name:r,domain:c,win:p},n))}return{cancel:function(){for(var e=0,t=null==s?0:s.length;e<t;e++)s[e].cancel()}}}if(Array.isArray(c)){for(var h=[],w=0,v=c,g=null==v?0:v.length;w<g;w++){var E=v[w];h.push(e({name:r,win:i,domain:E},n))}return{cancel:function(){for(var e=0,t=null==h?0:h.length;e<t;e++)h[e].cancel()}}}var b=O({name:r,win:i,domain:c});if(i&&i!==a.b.WILDCARD||(i=u.a.WINDOW_WILDCARD),c=c||a.b.WILDCARD,b)throw i&&c?new Error("Request listener already exists for "+r+" on domain "+c.toString()+" for "+(i===u.a.WINDOW_WILDCARD?"wildcard":"specified")+" window"):i?new Error("Request listener already exists for "+r+" for "+(i===u.a.WINDOW_WILDCARD?"wildcard":"specified")+" window"):c?new Error("Request listener already exists for "+r+" on domain "+c.toString()):new Error("Request listener already exists for "+r);var _=u.a.requestListeners,S=_[r];S||(S=new m.a,_[r]=S);var T=S.get(i);T||(T={},S.set(i,T));var P=c.toString(),C=T[y],A=void 0;return Object(o.e)(c)?(C||(C=[],T[y]=C),A={regex:c,listener:n},C.push(A)):T[P]=n,{cancel:function(){T&&(delete T[P],i&&0===Object.keys(T).length&&S.delete(i),A&&C.splice(C.indexOf(A,1)))}}}({name:t,win:n,domain:r},c);if(e.once){var d=c.handler;c.handler=Object(o.l)(function(){return s.cancel(),d.apply(this,arguments)})}if(c.window&&e.errorOnClose)var f=Object(o.m)(function(){n&&"object"===(void 0===n?"undefined":N(n))&&Object(i.y)(n)&&(f.cancel(),c.handleError(new Error("Post message target window is closed")))},50);return{cancel:function(){s.cancel()}}}function D(e,t,n){return"function"==typeof t&&(n=t,t={}),(t=t||{}).name=e,t.handler=n||t.handler,R(t)}function x(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=arguments[2];"function"==typeof t&&(n=t,t={}),t=t||{},n=n||t.handler;var r=t.errorHandler,o=new c.a(function(o,i){(t=t||{}).name=e,t.once=!0,t.handler=function(e){if(o(e),n)return n(e)},t.errorHandler=function(e){if(i(e),r)return r(e)}}),i=R(t);return o.cancel=i.cancel,o}function M(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return{on:function(t,n){return D(t,e,n)}}}function W(){delete window[a.b.WINDOW_PROPS.POSTROBOT],window.removeEventListener("message",C)}u.a.on=D;var k=Object(i.e)();function B(e){var t=u.a.requestPromises.get(e);if(t)for(var n=0,r=null==t?0:t.length;n<r;n++)t[n].reject(new Error("No response from window - cleaned up"));u.a.popupWindowsByWin&&u.a.popupWindowsByWin.delete(e),u.a.remoteWindows&&u.a.remoteWindows.delete(e),u.a.requestPromises.delete(e),u.a.methods.delete(e),u.a.readyPromises.delete(e)}var G=n(14);function U(){u.a.initialized||(Object(o.a)(window,"message",C),n(10).openTunnelToOpener(),Object(o.d)(),Object(o.h)({on:D,send:j})),u.a.initialized=!0}U(),n.d(t,"cleanUpWindow",function(){return B}),n.d(t,"Promise",function(){return c.a}),n.d(t,"bridge",function(){return G}),n.d(t,"init",function(){return U}),n.d(t,"parent",function(){return k}),n.d(t,"send",function(){return j}),n.d(t,"request",function(){return A}),n.d(t,"sendToParent",function(){return L}),n.d(t,"client",function(){return I}),n.d(t,"on",function(){return D}),n.d(t,"listen",function(){return R}),n.d(t,"once",function(){return x}),n.d(t,"listener",function(){return M}),n.d(t,"CONFIG",function(){return a.a}),n.d(t,"CONSTANTS",function(){return a.b}),n.d(t,"disable",function(){return W}),t.default=r},function(e,t,n){"use strict";function r(e){this.message=e}function o(e){this.message=e}function i(e){this.message=e}t.b=r,t.a=o,t.c=i,r.prototype=Object.create(Error.prototype),o.prototype=Object.create(Error.prototype),i.prototype=Object.create(Error.prototype)},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(1),o=n(0),i=n(2),a=n(5),u=n(4);function c(e){try{u.a.tunnelWindows[e]&&delete u.a.tunnelWindows[e].source}catch(e){}delete u.a.tunnelWindows[e]}u.a.tunnelWindows=u.a.tunnelWindows||{},u.a.tunnelWindowId=0,u.a.openTunnelToParent=function(e){var t=e.name,n=e.source,r=e.canary,s=e.sendMessage,d=Object(o.m)(window);if(!d)throw new Error("No parent window found to open tunnel to");var f=function(e){var t=e.name,n=e.source,r=e.canary,i=e.sendMessage;return function(){for(var e=u.a.tunnelWindows,t=0,n=Object.keys(e),r=null==n?0:n.length;t<r;t++){var i=n[t],s=e[i];try{Object(a.j)(s.source)}catch(e){c(i);continue}Object(o.y)(s.source)&&c(i)}}(),u.a.tunnelWindowId+=1,u.a.tunnelWindows[u.a.tunnelWindowId]={name:t,source:n,canary:r,sendMessage:i},u.a.tunnelWindowId}({name:t,source:n,canary:r,sendMessage:s});return u.a.send(d,i.b.POST_MESSAGE_NAMES.OPEN_TUNNEL,{name:t,sendMessage:function(){var e=function(e){return u.a.tunnelWindows[e]}(f);try{Object(a.j)(e&&e.source)}catch(e){return void c(f)}if(e&&e.source&&!Object(o.y)(e.source)){try{e.canary()}catch(e){return}e.sendMessage.apply(this,arguments)}}},{domain:i.b.WILDCARD})};var s=n(6);function d(){return!!Object(o.o)(window).match(/MSIE|trident|edge\/12|edge\/13/i)||!i.a.ALLOW_POSTMESSAGE_POPUP}function f(e){return!Object(o.v)(window,e)}function l(e,t){if(e){if(Object(o.g)()!==Object(o.h)(e))return!0}else if(t&&!Object(o.u)(t))return!0;return!1}function p(e){var t=e.win,n=e.domain;return!(!d()||n&&!l(n,t)||t&&!f(t))}function h(e){var t=(e=e||Object(o.h)(e)).replace(/[^a-zA-Z0-9]+/g,"_");return i.b.BRIDGE_NAME_PREFIX+"_"+t}function w(){return Boolean(window.name&&window.name===h(Object(o.g)()))}var m=new r.a(function(e){if(window.document&&window.document.body)return e(window.document.body);var t=setInterval(function(){if(window.document&&window.document.body)return clearInterval(t),e(window.document.body)},10)});function v(e){u.a.remoteWindows.set(e,{sendMessagePromise:new r.a})}function y(e){return u.a.remoteWindows.get(e)}function g(e,t,n){var i=y(e);if(!i)throw new Error("Window not found to register sendMessage to");var a=function(r,i,a){if(r!==e)throw new Error("Remote window does not match window");if(!Object(o.A)(a,t))throw new Error("Remote domain "+a+" does not match domain "+t);n(i)};i.sendMessagePromise.resolve(a),i.sendMessagePromise=r.a.resolve(a)}function E(e,t){var n=y(e);if(!n)throw new Error("Window not found on which to reject sendMessage");n.sendMessagePromise.asyncReject(t)}function b(e,t,n){var r=Object(o.s)(window,e),i=Object(o.s)(e,window);if(!r&&!i)throw new Error("Can only send messages to and from parent and popup windows");var a=y(e);if(!a)throw new Error("Window not found to send message to");return a.sendMessagePromise.then(function(r){return r(e,t,n)})}u.a.remoteWindows=u.a.remoteWindows||new s.a;var O=Object(a.r)(function(e){return r.a.try(function(){for(var t=0,n=Object(o.j)(e),a=null==n?0:n.length;t<a;t++){var u=n[t];try{if(u&&u!==window&&Object(o.u)(u)&&u[i.b.WINDOW_PROPS.POSTROBOT])return u}catch(e){continue}}try{var c=Object(o.i)(e,h(Object(o.g)()));if(!c)return;return Object(o.u)(c)&&c[i.b.WINDOW_PROPS.POSTROBOT]?c:new r.a(function(e){var t=void 0,n=void 0;t=setInterval(function(){if(c&&Object(o.u)(c)&&c[i.b.WINDOW_PROPS.POSTROBOT])return clearInterval(t),clearTimeout(n),e(c)},100),n=setTimeout(function(){return clearInterval(t),e()},2e3)})}catch(e){}})});function _(){return r.a.try(function(){var e=Object(o.l)(window);if(e&&p({win:e}))return v(e),O(e).then(function(t){return t?window.name?t[i.b.WINDOW_PROPS.POSTROBOT].openTunnelToParent({name:window.name,source:window,canary:function(){},sendMessage:function(e){try{Object(a.j)(window)}catch(e){return}if(window&&!window.closed)try{u.a.receiveMessage({data:e,origin:this.origin,source:this.source})}catch(e){r.a.reject(e)}}}).then(function(t){var n=t.source,r=t.origin,o=t.data;if(n!==e)throw new Error("Source does not match opener");g(n,r,o.sendMessage)}).catch(function(t){throw E(e,t),t}):E(e,new Error("Can not register with opener: window does not have a name")):E(e,new Error("Can not register with opener: no bridge found in opener"))})})}function S(e,t){return t=t||Object(o.h)(e),Boolean(u.a.bridges[t])}function T(e,t){return t=t||Object(o.h)(e),u.a.bridges[t]?u.a.bridges[t]:(u.a.bridges[t]=r.a.try(function(){if(Object(o.g)()===t)throw new Error("Can not open bridge on the same domain as current domain: "+t);var n=h(t);if(Object(o.i)(window,n))throw new Error("Frame with name "+n+" already exists on page");var c=function(e,t){var n=document.createElement("iframe");return n.setAttribute("name",e),n.setAttribute("id",e),n.setAttribute("style","display: none; margin: 0; padding: 0; border: 0px none; overflow: hidden;"),n.setAttribute("frameborder","0"),n.setAttribute("border","0"),n.setAttribute("scrolling","no"),n.setAttribute("allowTransparency","true"),n.setAttribute("tabindex","-1"),n.setAttribute("hidden","true"),n.setAttribute("title",""),n.setAttribute("role","presentation"),n.src=t,n}(n,e);return u.a.bridgeFrames[t]=c,m.then(function(n){n.appendChild(c);var o=c.contentWindow;return function(e,t){u.a.on(i.b.POST_MESSAGE_NAMES.OPEN_TUNNEL,{window:e,domain:t},function(e){var n=e.origin,o=e.data;if(n!==t)throw new Error("Domain "+t+" does not match origin "+n);if(!o.name)throw new Error("Register window expected to be passed window name");if(!o.sendMessage)throw new Error("Register window expected to be passed sendMessage method");if(!u.a.popupWindowsByName[o.name])throw new Error("Window with name "+o.name+" does not exist, or was not opened by this window");if(!u.a.popupWindowsByName[o.name].domain)throw new Error("We do not have a registered domain for window "+o.name);if(u.a.popupWindowsByName[o.name].domain!==n)throw new Error("Message origin "+n+" does not matched registered window origin "+u.a.popupWindowsByName[o.name].domain);return g(u.a.popupWindowsByName[o.name].win,t,o.sendMessage),{sendMessage:function(e){if(window&&!window.closed){var t=u.a.popupWindowsByName[o.name];if(t)try{u.a.receiveMessage({data:e,origin:t.domain,source:t.win})}catch(e){r.a.reject(e)}}}}})}(o,t),new r.a(function(e,t){c.onload=e,c.onerror=t}).then(function(){return Object(a.k)(o,i.a.BRIDGE_TIMEOUT,"Bridge "+e)}).then(function(){return o})})}),u.a.bridges[t])}u.a.bridges=u.a.bridges||{},u.a.bridgeFrames=u.a.bridgeFrames||{},u.a.popupWindowsByWin=u.a.popupWindowsByWin||new s.a,u.a.popupWindowsByName=u.a.popupWindowsByName||{};var P=window.open;function C(e,t){var n=u.a.popupWindowsByWin.get(e);n&&(n.domain=Object(o.h)(t),v(e))}function A(){for(var e=0,t=Object.keys(u.a.bridgeFrames),n=null==t?0:t.length;e<n;e++){var r=t[e],o=u.a.bridgeFrames[r];o.parentNode&&o.parentNode.removeChild(o)}u.a.bridgeFrames={},u.a.bridges={}}window.open=function(e,t,n,r){var a=e;if(e&&0===e.indexOf(i.b.MOCK_PROTOCOL)){var c=e.split("|");a=c[0],e=c[1]}a&&(a=Object(o.h)(a));var s=P.call(this,e,t,n,r);if(!s)return s;e&&v(s);for(var d=0,f=Object.keys(u.a.popupWindowsByName),l=null==f?0:f.length;d<l;d++){var p=f[d];Object(o.y)(u.a.popupWindowsByName[p].win)&&delete u.a.popupWindowsByName[p]}if(t&&s){var h=u.a.popupWindowsByWin.get(s)||u.a.popupWindowsByName[t]||{};h.name=h.name||t,h.win=h.win||s,h.domain=h.domain||a,u.a.popupWindowsByWin.set(s,h),u.a.popupWindowsByName[t]=h}return s},n.d(t,"openTunnelToOpener",function(){return _}),n.d(t,"needsBridgeForBrowser",function(){return d}),n.d(t,"needsBridgeForWin",function(){return f}),n.d(t,"needsBridgeForDomain",function(){return l}),n.d(t,"needsBridge",function(){return p}),n.d(t,"getBridgeName",function(){return h}),n.d(t,"isBridge",function(){return w}),n.d(t,"documentBodyReady",function(){return m}),n.d(t,"registerRemoteWindow",function(){return v}),n.d(t,"findRemoteWindow",function(){return y}),n.d(t,"registerRemoteSendMessage",function(){return g}),n.d(t,"rejectRemoteSendMessage",function(){return E}),n.d(t,"sendBridgeMessage",function(){return b}),n.d(t,"hasBridge",function(){return S}),n.d(t,"openBridge",function(){return T}),n.d(t,"linkUrl",function(){return C}),n.d(t,"destroyBridges",function(){return A})},function(e,t,n){"use strict";var r={};n.d(r,"track",function(){return M}),n.d(r,"buffer",function(){return v}),n.d(r,"tracking",function(){return y}),n.d(r,"getTransport",function(){return E}),n.d(r,"setTransport",function(){return b}),n.d(r,"print",function(){return _}),n.d(r,"immediateFlush",function(){return S}),n.d(r,"flush",function(){return A}),n.d(r,"log",function(){return L}),n.d(r,"prefix",function(){return I}),n.d(r,"debug",function(){return N}),n.d(r,"info",function(){return R}),n.d(r,"warn",function(){return D}),n.d(r,"error",function(){return x}),n.d(r,"init",function(){return H}),n.d(r,"startTransition",function(){return J}),n.d(r,"endTransition",function(){return K}),n.d(r,"transition",function(){return V}),n.d(r,"payloadBuilders",function(){return u}),n.d(r,"metaBuilders",function(){return c}),n.d(r,"trackingBuilders",function(){return s}),n.d(r,"headerBuilders",function(){return d}),n.d(r,"addPayloadBuilder",function(){return f}),n.d(r,"addMetaBuilder",function(){return l}),n.d(r,"addTrackingBuilder",function(){return p}),n.d(r,"addHeaderBuilder",function(){return h}),n.d(r,"config",function(){return w}),n.d(r,"logLevels",function(){return m});var o=n(1);function i(e,t){var n=!(arguments.length>2&&void 0!==arguments[2])||arguments[2];for(var r in e=e||{},t=t||{})t.hasOwnProperty(r)&&(!n&&e.hasOwnProperty(r)||(e[r]=t[r]));return e}function a(){var e="0123456789abcdef";return"xxxxxxxxxx".replace(/./g,function(){return e.charAt(Math.floor(Math.random()*e.length))})}var u=[],c=[],s=[],d=[];function f(e){u.push(e)}function l(e){c.push(e)}function p(e){s.push(e)}function h(e){d.push(e)}var w={uri:"",prefix:"",initial_state_name:"init",flushInterval:6e5,debounceInterval:10,sizeLimit:300,silent:!1,heartbeat:!0,heartbeatConsoleLog:!0,heartbeatInterval:5e3,heartbeatTooBusy:!1,heartbeatTooBusyThreshold:1e4,logLevel:"warn",autoLog:["warn","error"],logUnload:!0,logPerformance:!0},m=["error","warn","info","debug"],v=[],y=[],g=function(e,t,n){return function(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},r=arguments.length>3&&void 0!==arguments[3]?arguments[3]:{},i=(arguments.length>4&&void 0!==arguments[4]?arguments[4]:{}).fireAndForget,a=void 0!==i&&i;return new o.a(function(o){var i=window.XMLHttpRequest||window.ActiveXObject;if(window.XDomainRequest&&!function(e){var t=e.match(/https?:\/\/[^/]+/);return!t||t[0]===window.location.protocol+"//"+window.location.host}(t)){if(!function(e){return window.location.protocol===e.split("/")[0]}(t))return o();i=window.XDomainRequest}var u=new i("MSXML2.XMLHTTP.3.0");if(u.open(e.toUpperCase(),t,!0),"function"==typeof u.setRequestHeader)for(var c in u.setRequestHeader("X-Requested-With","XMLHttpRequest"),u.setRequestHeader("Content-type","application/json"),n)n.hasOwnProperty(c)&&u.setRequestHeader(c,n[c]);a?o():u.onreadystatechange=function(){u.readyState>3&&o()},u.send(JSON.stringify(r).replace(/&/g,"%26"))})}("post",w.uri,e,t,n)};function E(){return g}function b(e){g=e}var O=!1;function _(e,t,n){if("undefined"!=typeof window&&window.console&&window.console.log){if(!O)return setTimeout(function(){return _(e,t,n)},1);var r=w.logLevel;if(window.LOG_LEVEL&&(r=window.LOG_LEVEL),!(m.indexOf(e)>m.indexOf(r))){n=n||{};var o=[t];Boolean(window.document.documentMode)&&(n=JSON.stringify(n)),o.push(n),(n.error||n.warning)&&o.push("\n\n",n.error||n.warning);try{window.console[e]&&window.console[e].apply?window.console[e].apply(window.console,o):window.console.log&&window.console.log.apply&&window.console.log.apply(window.console,o)}catch(e){}}}}function S(){var e=(arguments.length>0&&void 0!==arguments[0]?arguments[0]:{}).fireAndForget,t=void 0!==e&&e;if("undefined"!=typeof window&&w.uri){var n=v.length,r=y.length;if(n||r){for(var o={},a=0,u=null==c?0:c.length;a<u;a++){var s=c[a];try{i(o,s(o),!1)}catch(e){console.error("Error in custom meta builder:",e.stack||e.toString())}}for(var f={},l=0,p=null==d?0:d.length;l<p;l++){var h=d[l];try{i(f,h(f),!1)}catch(e){console.error("Error in custom header builder:",e.stack||e.toString())}}var m=g(f,{events:v,meta:o,tracking:y},{fireAndForget:t});return v=[],y=[],m}}}setTimeout(function(){O=!0},1);var T,P,C,A=(T=S,P=w.debounceInterval,C={},function(){var e=arguments;return C.timeout&&(clearTimeout(C.timeout),delete C.timeout),C.timeout=setTimeout(function(){var t=C.resolver,n=C.rejector;return delete C.promise,delete C.resolver,delete C.rejector,delete C.timeout,o.a.resolve().then(function(){return T.apply(null,e)}).then(t,n)},P),C.promise=C.promise||new o.a(function(e,t){C.resolver=e,C.rejector=t}),C.promise});function j(e,t,n){v.push({level:e,event:t,payload:n}),w.autoLog.indexOf(e)>-1&&A()}function L(e,t,n){if("undefined"!=typeof window){w.prefix&&(t=w.prefix+"_"+t),"string"==typeof(n=n||{})?n={message:n}:n instanceof Error&&(n={error:n.stack||n.toString()});try{JSON.stringify(n)}catch(e){return}n.timestamp=Date.now();for(var r=0,o=null==u?0:u.length;r<o;r++){var a=u[r];try{i(n,a(n),!1)}catch(e){console.error("Error in custom payload builder:",e.stack||e.toString())}}w.silent||_(e,t,n),v.length===w.sizeLimit?j("info","logger_max_buffer_length"):v.length<w.sizeLimit&&j(e,t,n)}}function I(e){return{debug:function(t,n){return L("debug",e+"_"+t,n)},info:function(t,n){return L("info",e+"_"+t,n)},warn:function(t,n){return L("warn",e+"_"+t,n)},error:function(t,n){return L("error",e+"_"+t,n)},track:function(e){return M(e)},flush:function(){return A()}}}function N(e,t){return L("debug",e,t)}function R(e,t){return L("info",e,t)}function D(e,t){return L("warn",e,t)}function x(e,t){return L("error",e,t)}function M(e){if("undefined"!=typeof window&&e){try{JSON.stringify(e)}catch(e){return}for(var t=0,n=null==s?0:s.length;t<n;t++){var r=s[t];try{i(e,r(e),!1)}catch(e){console.error("Error in custom tracking builder:",e.stack||e.toString())}}_("debug","tracking",e),y.push(e)}}var W=window&&window.performance&&performance.now&&performance.timing&&performance.timing.connectEnd&&performance.timing.navigationStart&&Math.abs(performance.now()-Date.now())>1e3&&performance.now()-(performance.timing.connectEnd-performance.timing.navigationStart)>0;function k(){return W?performance.now():Date.now()}function B(e){return{startTime:e=void 0!==e?e:k(),elapsed:function(){return parseInt(k()-e,10)},reset:function(){e=k()}}}function G(){if(W){var e=window.performance.timing;return parseInt(e.connectEnd-e.navigationStart,10)}}var U=B(),F=B(G()),z=!1;function H(e){var t,n,r,a;i(w,e||{}),z||(z=!0,w.logPerformance&&function(){if(!W)return R("no_performance_data");f(function(){var e={};return e.client_elapsed=U.elapsed(),W&&(e.req_elapsed=F.elapsed()),e}),new o.a(function(e){"undefined"!=typeof document&&"complete"===document.readyState&&e(),window.addEventListener("load",e)}).then(function(){var e={};["connectEnd","connectStart","domComplete","domContentLoadedEventEnd","domContentLoadedEventStart","domInteractive","domLoading","domainLookupEnd","domainLookupStart","fetchStart","loadEventEnd","loadEventStart","navigationStart","redirectEnd","redirectStart","requestStart","responseEnd","responseStart","secureConnectionStart","unloadEventEnd","unloadEventStart"].forEach(function(t){e[t]=parseInt(window.performance.timing[t],10)||0});var t=e.connectEnd-e.navigationStart;e.connectEnd&&Object.keys(e).forEach(function(n){var r=e[n];r&&R("timing_"+n,{client_elapsed:parseInt(r-e.connectEnd-(U.startTime-t),10),req_elapsed:parseInt(r-e.connectEnd,10)})}),R("timing",e),R("memory",window.performance.memory),R("navigation",window.performance.navigation),window.performance.getEntries&&window.performance.getEntries().forEach(function(e){["link","script","img","css"].indexOf(e.initiatorType)>-1&&R(e.initiatorType,e)})})}(),w.heartbeat&&(r=B(),a=0,t=function(){if(!(w.heartbeatMaxThreshold&&a>w.heartbeatMaxThreshold)){a+=1;var e=r.elapsed(),t=e-w.heartbeatInterval,n={count:a,elapsed:e};w.heartbeatTooBusy&&(n.lag=t,t>=w.heartbeatTooBusyThreshold&&R("toobusy",n,w.heartbeatConsoleLog)),R("heartbeat",n,w.heartbeatConsoleLog)}},n=w.heartbeatInterval,function e(){setTimeout(function(){t(),e()},n)}()),w.logUnload&&(window.addEventListener("beforeunload",function(){R("window_beforeunload"),S({fireAndForget:!0})}),window.addEventListener("unload",function(){R("window_unload"),S({fireAndForget:!0})})),w.flushInterval&&setInterval(A,w.flushInterval),window.beaverLogQueue&&(window.beaverLogQueue.forEach(function(e){L(e.level,e.event,e)}),delete window.beaverLogQueue))}var q=a(),Y=a(),X=w.initial_state_name,Z=void 0;function J(){Z=k()}function K(e){Z=Z||G();var t=k(),n=void 0;void 0!==Z&&(n=parseInt(t-Z,0));var r="transition_"+X+"_to_"+e;R(r,{duration:n}),M({transition:r,transition_time:n}),S(),Z=t,X=e,Y=a()}function V(e){J(),K(e)}f(function(){return{windowID:q,pageID:Y}}),l(function(){return{state:"ui_"+X}}),n.d(t,!1,function(){return M}),n.d(t,!1,function(){return v}),n.d(t,!1,function(){return y}),n.d(t,!1,function(){return E}),n.d(t,!1,function(){return b}),n.d(t,!1,function(){return _}),n.d(t,!1,function(){return S}),n.d(t,"c",function(){return A}),n.d(t,!1,function(){return L}),n.d(t,!1,function(){return I}),n.d(t,!1,function(){return N}),n.d(t,"d",function(){return R}),n.d(t,"f",function(){return D}),n.d(t,"b",function(){return x}),n.d(t,!1,function(){return H}),n.d(t,!1,function(){return J}),n.d(t,!1,function(){return K}),n.d(t,!1,function(){return V}),n.d(t,!1,function(){return u}),n.d(t,!1,function(){return c}),n.d(t,!1,function(){return s}),n.d(t,!1,function(){return d}),n.d(t,!1,function(){return f}),n.d(t,!1,function(){return l}),n.d(t,!1,function(){return p}),n.d(t,!1,function(){return h}),n.d(t,"a",function(){return w}),n.d(t,"e",function(){return m})},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),o=n(2);function i(e,t){if(!o.a.ALLOW_POSTMESSAGE_POPUP&&!1===Object(r.v)(e,t))throw new Error("Can not send and receive post messages between two different windows (disabled to emulate IE)")}n.d(t,"emulateIERestrictions",function(){return i})},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r={};n.d(r,"create",function(){return re}),n.d(r,"getByTag",function(){return oe}),n.d(r,"getCurrentScriptDir",function(){return u.s}),n.d(r,"destroyAll",function(){return ie}),n.d(r,"postRobot",function(){return ae}),n.d(r,"CONSTANTS",function(){return ue}),n.d(r,"PopupOpenError",function(){return S.b}),n.d(r,"IntegrationError",function(){return S.a}),n.d(r,"RenderError",function(){return S.c});var o=n(1),i=n(8),a=n(0),u=n(3),c=function(){function e(){var t,n,r;!function(t,n){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this),this.clean=(t=this,n=[],r=!1,{set:function(e,n){return r?n:(t[e]=n,this.register(function(){delete t[e]}),n)},register:function(e,t){if("function"==typeof e&&(t=e,e="<anonymous-cleanup-handler>"),"function"!=typeof t)throw new TypeError("Expected to be passed function to clean.register");r?t():n.push({complete:!1,name:e,run:function(){this.complete||(this.complete=!0,t&&t())}})},hasTasks:function(){return Boolean(n.filter(function(e){return!e.complete}).length)},all:function(){var e=[];for(r=!0;n.length;)e.push(n.pop().run());return o.a.all(e).then(function(){})},run:function(e){for(var t=[],r=0,i=null==n?0:n.length;r<i;r++){var a=n[r];a.name===e&&t.push(a.run())}return o.a.all(t).then(u.E)}}),this.event=Object(u.o)()}return e.prototype.addProp=function(e,t,n){Object(u.g)(e,this,t,n)},e.prototype.on=function(e,t){return this.event.on(e,t)},e.prototype.listeners=function(){throw new Error("Expected listeners to be implemented")},e.prototype.error=function(e){throw new Error("Expected error to be implemented - got "+Object(u.P)(e))},e.prototype.listen=function(e,t){var n=this;if(!e)throw this.component.createError("window to listen to not set");if(!t)throw new Error("Must pass domain to listen to");if(this.listeners)for(var r=this.listeners(),o=function(o,a,u){var c=a[o],s=c.replace(/^zoid_/,""),d=function(e){n.error(e)},f=Object(i.on)(c,{window:e,domain:t,errorHandler:d},function(e){var t=e.source,o=e.data;return n.component.log("listener_"+s),r[c].call(n,t,o)}),l=Object(i.on)(c,{window:e,errorHandler:d},function(e){var r=e.origin;n.component.logError("unexpected_listener_"+s,{origin:r,domain:t.toString()}),n.error(new Error("Unexpected "+s+" message from domain "+r+" -- expected message from "+t.toString()))});n.clean.register(function(){f.cancel(),l.cancel()})},a=0,u=Object.keys(r),c=null==u?0:u.length;a<c;a++)o(a,u)},e}(),s=n(11);n(6),"function"==typeof Symbol&&Symbol.iterator;function d(){var e="0123456789abcdef";return"xxxxxxxxxx".replace(/./g,function(){return e.charAt(Math.floor(Math.random()*e.length))})+"_"+function(e){if("function"==typeof btoa)return btoa(encodeURIComponent(e).replace(/%([0-9A-F]{2})/g,function(e,t){return String.fromCharCode(parseInt(t,16))}));if("undefined"!=typeof Buffer)return Buffer.from(e,"utf8").toString("base64");throw new Error("Can not find window.btoa or Buffer")}((new Date).toISOString().slice(11,19).replace("T",".")).replace(/[^a-zA-Z0-9]/g,"").toLowerCase()}var f="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};function l(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},r=n.width,o=void 0===r||r,i=n.height,a=void 0===i||i,u=n.interval,c=void 0===u?100:u,s=n.win,d=void 0===s?window:s,f=e.offsetWidth,l=e.offsetHeight;t({width:f,height:l});var p=function(){var n=e.offsetWidth,r=e.offsetHeight;(o&&n!==f||a&&r!==l)&&t({width:n,height:r}),f=n,l=r},h=void 0,w=void 0;return void 0!==d.ResizeObserver?(h=new d.ResizeObserver(p)).observe(e):void 0!==d.MutationObserver?((h=new d.MutationObserver(p)).observe(e,{attributes:!0,childList:!0,subtree:!0,characterData:!1}),d.addEventListener("resize",p)):function e(){p(),w=setTimeout(e,c)}(),{cancel:function(){h.disconnect(),window.removeEventListener("resize",p),clearTimeout(w)}}}function p(e){for(;e.parentNode;)e=e.parentNode;return"[object ShadowRoot]"===e.toString()}Object.assign,Object.create(Error.prototype);var h=n(15),w=n.n(h),m=n(7);function v(e){return e.replace(/^[^a-z0-9A-Z]+|[^a-z0-9A-Z]+$/g,"").replace(/[^a-z0-9A-Z]+/g,"_")}var y=Object(u.C)(function(){return!!window.name&&"xcomponent"===window.name.split("__")[0]}),g=Object(u.C)(function(){if(!window.name)throw new Error("Can not get component meta without window name");var e=window.name.split("__"),t=e[0],n=e[1],r=e[2],o=e[3];if("xcomponent"!==t)throw new Error("Window not rendered by zoid - got "+t);var i,a=void 0;try{a=JSON.parse((i=o,w.a.decode(i.toUpperCase())))}catch(e){throw new Error("Can not decode component-meta: "+o+" "+Object(u.P)(e))}return a.name=n,a.version=r.replace(/_/g,"."),a});function E(){return g().domain}function b(e){var t=e.ref,n=e.uid,r=e.distance,o=void 0;if(t===m.WINDOW_REFERENCES.OPENER?o=Object(a.l)(window):t===m.WINDOW_REFERENCES.TOP?o=Object(a.n)(window):t===m.WINDOW_REFERENCES.PARENT&&(o=r?Object(a.k)(window,r):Object(a.m)(window)),t===m.WINDOW_REFERENCES.GLOBAL){var i=Object(a.e)(window);if(i)for(var c=0,s=Object(a.d)(i),d=null==s?0:s.length;c<d;c++){var f=s[c],l=Object(u.v)(f);if(l&&l.windows&&l.windows[n]){o=l.windows[n];break}}}if(!o)throw new Error("Unable to find window by ref");return o}var O=Object(u.C)(function(){var e=g();if(!e)throw new Error("Can not get parent component window - window not rendered by zoid");return b(e.componentParent)}),_=Object(u.C)(function(){var e=g();if(!e)throw new Error("Can not get parent component window - window not rendered by zoid");return b(e.renderParent)}),S=n(9);function T(e,t,n,r){var o=e.getProp(n);return o?"function"==typeof o.childDecorate?o.childDecorate(r):r:e.looseProps?r:void 0}var P=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},C="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};function A(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}var j=function(e){function t(n){!function(e,n){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this);var r=A(this,e.call(this));if(r.component=n,!r.hasValidParentDomain())return r.error(new S.c("Can not be rendered by domain: "+r.getParentDomain())),A(r);r.component.log("construct_child"),r.onPropHandlers=[];for(var o=function(e,t,n){for(var o=t[e],i=function(e,t,n){var i=t[e],a=i[0],u=i[1];Object.defineProperty(o,a,{configurable:!0,get:function(){return r.props||r.setProps(r.getInitialProps(),E()),delete o[a],o[a]=u(),o[a]}})},a=0,u=[["xchild",function(){return r}],["xprops",function(){return r.props}]],c=null==u?0:u.length;a<c;a++)i(a,u)},i=0,a=[r.component,window],u=null==a?0:a.length;i<u;i++)o(i,a);return r.component.log("init_child"),r.setWindows(),r.onInit=r.sendToParent(m.POST_MESSAGE.INIT,{exports:r.exports()}).then(function(e){var t=e.origin,n=e.data;return r.context=n.context,r.setProps(n.props,t),r.watchForResize(),r}).catch(function(e){throw r.error(e),e}),r}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,e),t.prototype.hasValidParentDomain=function(){return Object(a.A)(this.component.allowedParentDomains,this.getParentDomain())},t.prototype.init=function(){return this.onInit},t.prototype.getParentDomain=function(){return E()},t.prototype.onProps=function(e){this.onPropHandlers.push(e)},t.prototype.getParentComponentWindow=function(){return O()},t.prototype.getParentRenderWindow=function(){return _()},t.prototype.getInitialProps=function(){var e=this,t=g(),n=t.props;if(n.type===m.INITIAL_PROPS.RAW)n=n.value;else{if(n.type!==m.INITIAL_PROPS.UID)throw new Error("Unrecognized props type: "+n.type);var r=O();if(!Object(a.u)(r)){if("file:"===window.location.protocol)throw new Error("Can not get props from file:// domain");throw new Error("Parent component window is on a different domain - expected "+Object(a.g)()+" - can not retrieve props")}var o=Object(u.v)(r);if(!o)throw new Error("Can not find global for parent component - can not retrieve props");n=JSON.parse(o.props[t.uid])}if(!n)throw new Error("Initial props not found");return Object(u.j)(n,function(t){var n=t.fullKey,r=t.self,o=t.args;return e.onInit.then(function(){var t=Object(u.r)(e.props,n);if("function"!=typeof t)throw new TypeError("Expected "+n+" to be function, got "+(void 0===t?"undefined":C(t)));return t.apply(r,o)})})},t.prototype.setProps=function(e,t){var n=!(arguments.length>2&&void 0!==arguments[2])||arguments[2];this.props=this.props||{};var r=function(e,t,n){for(var r=!(arguments.length>3&&void 0!==arguments[3])||arguments[3],o={},i=0,u=Object.keys(t),c=null==u?0:u.length;i<c;i++){var s=u[i],d=e.getProp(s),f=t[s];d&&d.sameDomain&&n!==Object(a.g)(window)||(o[s]=T(e,0,s,f),d&&d.alias&&!o[d.alias]&&(o[d.alias]=f))}if(r)for(var l=0,p=e.getPropNames(),h=null==p?0:p.length;l<h;l++){var w=p[l];t.hasOwnProperty(w)||(o[w]=T(e,0,w,t[w]))}return o}(this.component,e,t,n);Object(u.p)(this.props,r),this.props.logLevel&&Object(u.L)(this.props.logLevel);for(var o=0,i=this.onPropHandlers,c=null==i?0:i.length;o<c;o++)i[o].call(this,this.props)},t.prototype.sendToParent=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},r=O();if(!r)throw new Error("Can not find parent component window to message");return this.component.log("send_to_parent_"+e),Object(i.send)(r,e,t,P({domain:E()},n))},t.prototype.setWindows=function(){if(window.__activeZoidComponent__)throw this.component.createError("Can not attach multiple components to the same window");if(window.__activeZoidComponent__=this,!O())throw this.component.createError("Can not find parent window");var e=g();if(e.tag!==this.component.tag)throw this.component.createError("Parent is "+e.tag+" - can not attach "+this.component.tag);this.watchForClose()},t.prototype.watchForClose=function(){var e=this;window.addEventListener("unload",function(){return e.checkClose()})},t.prototype.enableAutoResize=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=e.width,n=void 0===t||t,r=e.height,o=void 0===r||r;this.autoResize={width:n,height:o},this.watchForResize()},t.prototype.getAutoResize=function(){var e=!1,t=!1,n=this.autoResize||this.component.autoResize;return"object"===(void 0===n?"undefined":C(n))?(e=Boolean(n.width),t=Boolean(n.height)):n&&(e=!0,t=!0),{width:e,height:t,element:n.element?Object(u.t)(n.element):document.body}},t.prototype.watchForResize=function(){var e=this,t=this.getAutoResize(),n=t.width,r=t.height,o=t.element;(n||r)&&this.context!==m.CONTEXT_TYPES.POPUP&&(this.watchingForResize||(this.watchingForResize=!0,l(o,function(t){var o=t.width,i=t.height;e.resize(n?o:void 0,r?i:void 0)},{width:n,height:r})))},t.prototype.exports=function(){var e=this;return{updateProps:function(t){var n=this;return o.a.try(function(){return e.setProps(t,n.origin,!1)})},close:function(){return o.a.try(function(){return e.destroy()})}}},t.prototype.resize=function(e,t){var n=this;return o.a.resolve().then(function(){if(n.component.log("resize",{width:Object(u.O)(e),height:Object(u.O)(t)}),n.context!==m.CONTEXT_TYPES.POPUP)return n.sendToParent(m.POST_MESSAGE.RESIZE,{width:e,height:t}).then(u.E)})},t.prototype.hide=function(){return this.sendToParent(m.POST_MESSAGE.HIDE).then(u.E)},t.prototype.show=function(){return this.sendToParent(m.POST_MESSAGE.SHOW).then(u.E)},t.prototype.userClose=function(){return this.close(m.CLOSE_REASONS.USER_CLOSED)},t.prototype.close=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:m.CLOSE_REASONS.CHILD_CALL;this.component.log("close_child"),this.sendToParent(m.POST_MESSAGE.CLOSE,{reason:e})},t.prototype.checkClose=function(){this.sendToParent(m.POST_MESSAGE.CHECK_CLOSE,{},{fireAndForget:!0})},t.prototype.destroy=function(){return Object(s.c)().then(function(){window.close()})},t.prototype.focus=function(){this.component.log("focus"),window.focus()},t.prototype.error=function(e){var t=Object(u.P)(e);return this.component.logError("error",{error:t}),this.sendToParent(m.POST_MESSAGE.ERROR,{error:t}).then(u.E)},t}(c),L=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},I={};I[m.CONTEXT_TYPES.IFRAME]={focusable:!1,renderedIntoContainerTemplate:!0,allowResize:!0,openOnClick:!1,needsBridge:!1,open:function(e){var t=this,n=this.component.attributes.iframe||{};return this.iframe=Object(u.x)({url:e,attributes:L({name:this.childWindowName,title:this.component.name,scrolling:this.component.scrolling?"yes":"no"},n),class:[m.CLASS_NAMES.COMPONENT_FRAME,m.CLASS_NAMES.INVISIBLE]},this.element),Object(u.f)(this.iframe).then(function(e){t.window=e;var n=function(){return o.a.try(function(){return t.props.onClose(m.CLOSE_REASONS.CLOSE_DETECTED)}).finally(function(){return t.destroy()})},r=Object(u.T)(t.iframe,n),a=Object(u.T)(t.element,n);t.clean.register("destroyWindow",function(){r.cancel(),a.cancel(),Object(i.cleanUpWindow)(t.window),delete t.window,t.iframe&&(Object(u.k)(t.iframe),delete t.iframe)})})},openPrerender:function(){var e=this,t=this.component.attributes.iframe||{};return this.prerenderIframe=Object(u.x)({attributes:L({name:"__prerender__"+this.childWindowName,scrolling:this.component.scrolling?"yes":"no"},t),class:[m.CLASS_NAMES.PRERENDER_FRAME,m.CLASS_NAMES.VISIBLE]},this.element),Object(u.f)(this.prerenderIframe).then(function(t){e.prerenderWindow=t,e.clean.register("destroyPrerender",function(){e.prerenderIframe&&(Object(u.k)(e.prerenderIframe),delete e.prerenderIframe)})})},switchPrerender:function(){var e=this;Object(u.a)(this.prerenderIframe,m.CLASS_NAMES.INVISIBLE),Object(u.I)(this.prerenderIframe,m.CLASS_NAMES.VISIBLE),Object(u.a)(this.iframe,m.CLASS_NAMES.VISIBLE),Object(u.I)(this.iframe,m.CLASS_NAMES.INVISIBLE),setTimeout(function(){e.prerenderIframe&&Object(u.k)(e.prerenderIframe)},1e3)},delegateOverrides:{openContainer:m.DELEGATE.CALL_DELEGATE,destroyComponent:m.DELEGATE.CALL_DELEGATE,destroyContainer:m.DELEGATE.CALL_DELEGATE,cancelContainerEvents:m.DELEGATE.CALL_DELEGATE,createPrerenderTemplate:m.DELEGATE.CALL_DELEGATE,elementReady:m.DELEGATE.CALL_DELEGATE,showContainer:m.DELEGATE.CALL_DELEGATE,showComponent:m.DELEGATE.CALL_DELEGATE,hideContainer:m.DELEGATE.CALL_DELEGATE,hideComponent:m.DELEGATE.CALL_DELEGATE,hide:m.DELEGATE.CALL_DELEGATE,show:m.DELEGATE.CALL_DELEGATE,resize:m.DELEGATE.CALL_DELEGATE,loadUrl:m.DELEGATE.CALL_DELEGATE,hijackSubmit:m.DELEGATE.CALL_DELEGATE,openPrerender:m.DELEGATE.CALL_DELEGATE,switchPrerender:m.DELEGATE.CALL_DELEGATE,renderTemplate:m.DELEGATE.CALL_ORIGINAL,openContainerFrame:m.DELEGATE.CALL_ORIGINAL,getOutlet:m.DELEGATE.CALL_ORIGINAL,open:function(e,t){return function(){var e=this;return t.apply(this,arguments).then(function(){if(e.clean.set("window",Object(a.b)(O(),e.childWindowName)),!e.window)throw new Error("Unable to find parent component iframe window")})}}},resize:function(e,t){e&&(this.container.style.width=Object(u.Q)(e),this.element.style.width=Object(u.Q)(e)),t&&(this.container.style.height=Object(u.Q)(t),this.element.style.height=Object(u.Q)(t))},show:function(){Object(u.N)(this.element)},hide:function(){Object(u.w)(this.element)},loadUrl:function(e){this.iframe.setAttribute("src",e)}};var N="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};function R(e,t,n,r){var o=!(arguments.length>4&&void 0!==arguments[4])||arguments[4];if(null!==n&&void 0!==n&&""!==n){if(!n||"function"!=typeof n.then||!e.promise){if("function"===e.type){if("function"!=typeof n)throw new TypeError("Prop is not of type function: "+t)}else if("string"===e.type){if("string"!=typeof n)throw new TypeError("Prop is not of type string: "+t)}else if("object"===e.type){if(!1!==e.sendToChild)try{JSON.stringify(n)}catch(e){throw new Error("Unable to serialize prop: "+t)}}else if("number"===e.type&&isNaN(parseInt(n,10)))throw new TypeError("Prop is not a number: "+t);"function"==typeof e.validate&&n&&e.validate(n,r)}}else if(o&&!1!==e.required&&!e.hasOwnProperty("def"))throw new Error("Prop is required: "+t)}var D="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};function x(e,t,n,r,o){var i=e.getProp(r),a=void 0;!(a=i.value?i.value:!i.def||n.hasOwnProperty(r)&&function(e){return null!==e&&void 0!==e&&""!==e}(o)?o:i.def.call(e,n))&&i.alias&&n[i.alias]&&(a=n[i.alias]);var c=!1;i.decorate&&null!==a&&void 0!==a&&(a=i.decorate.call(t,a,n),c=!0);var s=i.type;if("boolean"===s)a=Boolean(a);else if("function"===s){if(!a&&i.noop&&(a=u.E,!c&&i.decorate&&(a=i.decorate.call(t,u.E,n))),a&&"function"==typeof a){a=a.bind(t),i.denodeify&&(a=Object(u.i)(a)),i.promisify&&(a=Object(u.H)(a));var d=a;a=function(){return e.log("call_prop_"+r),d.apply(this,arguments)},i.once&&(a=Object(u.F)(a)),i.memoize&&(a=Object(u.C)(a))}}else"string"===s||"object"===s||"number"===s&&void 0!==a&&(a=parseInt(a,10));return a}var M,W=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},k="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},B=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}();function G(e,t,n,r,o){var i={};return Object.keys(r).forEach(function(e){i[e]=r[e]}),i.enumerable=!!i.enumerable,i.configurable=!!i.configurable,("value"in i||i.initializer)&&(i.writable=!0),i=n.slice().reverse().reduce(function(n,r){return r(e,t,n)||n},i),o&&void 0!==i.initializer&&(i.value=i.initializer?i.initializer.call(o):void 0,i.initializer=void 0),void 0===i.initializer&&(Object.defineProperty(e,t,i),i=null),i}u.u.props=u.u.props||{},u.u.windows=u.u.windows||{};var U=(G((M=function(e){function t(n,r,i){var a=i.props;!function(e,n){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this);var c=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,e.call(this));c.component=n,c.validateParentDomain(),c.context=r;try{c.setProps(a)}catch(e){throw a.onError&&a.onError(e),e}return c.props.logLevel&&Object(u.L)(c.props.logLevel),c.childWindowName=c.buildChildWindowName({renderTo:window}),c.registerActiveComponent(),c.component.log("construct_parent"),c.watchForUnload(),c.onInit=new o.a,c.onInit.catch(function(e){return c.error(e)}),c}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,e),t.prototype.render=function(e){var t=this,n=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];return this.tryInit(function(){t.component.log("render_"+t.context,{context:t.context,element:e,loadUrl:Object(u.O)(n)});var r={};return r.onRender=t.props.onRender(),r.getDomain=t.getDomain(),r.elementReady=o.a.try(function(){if(e)return t.elementReady(e)}),r.openContainer=r.elementReady.then(function(){return t.openContainer(e)}),r.showContainer=r.openContainer.then(function(){return t.showContainer()}),r.openPrerender=r.openContainer.then(function(){return t.openPrerender()}),r.switchPrerender=o.a.all([r.openPrerender,t.onInit]).then(function(){return t.switchPrerender()}),r.open=t.driver.openOnClick?t.open():r.openContainer.then(function(){return t.open()}),r.listen=o.a.hash({domain:r.getDomain,open:r.open}).then(function(e){var n=e.domain;t.listen(t.window,n)}),r.watchForClose=r.open.then(function(){return t.watchForClose()}),r.linkDomain=o.a.all([r.getDomain,r.open]).then(function(e){var n=e[0];if(i.bridge&&"string"==typeof n)return i.bridge.linkUrl(t.window,n)}),t.html||(r.createPrerenderTemplate=r.openPrerender.then(function(){return t.createPrerenderTemplate()}),r.showComponent=r.createPrerenderTemplate.then(function(){return t.showComponent()})),r.openBridge=o.a.all([r.getDomain,r.open]).then(function(e){var n=e[0];return t.openBridge("string"==typeof n?n:null)}),t.html?r.loadHTML=r.open.then(function(){return t.loadHTML()}):n&&(r.buildUrl=t.buildUrl(),r.loadUrl=o.a.all([r.buildUrl,r.open,r.linkDomain,r.listen,r.open,r.openBridge,r.createPrerenderTemplate]).then(function(e){var n=e[0];return t.loadUrl(n)}),r.runTimeout=r.loadUrl.then(function(){return t.runTimeout()})),o.a.hash(r)}).then(function(){return t.props.onEnter()}).then(function(){return t})},t.prototype.getOutlet=function(){var e=document.createElement("div");return Object(u.a)(e,m.CLASS_NAMES.OUTLET),e},t.prototype.validateParentDomain=function(){var e=Object(a.g)();if(!Object(a.A)(this.component.allowedParentDomains,e))throw new S.c("Can not be rendered by domain: "+e)},t.prototype.renderTo=function(e,t){var n=this;return this.tryInit(function(){if(e===window)return n.render(t);if(!Object(a.v)(window,e))throw new Error("Can only renderTo an adjacent frame");if(t&&"string"!=typeof t)throw new Error("Element passed to renderTo must be a string selector, got "+(void 0===t?"undefined":k(t))+" "+t);return n.checkAllowRenderTo(e),n.component.log("render_"+n.context+"_to_win",{element:Object(u.O)(t),context:n.context}),n.childWindowName=n.buildChildWindowName({renderTo:e}),n.delegate(e),n.render(t)})},t.prototype.prefetch=function(){var e=this;return o.a.try(function(){e.html=e.buildUrl().then(function(e){return Object(u.G)(e).then(function(t){return'\n                        <base href="'+e.split("/").slice(0,3).join("/")+'">\n\n                        '+t+"\n\n                        <script>\n                            if (window.history && window.history.pushState) {\n                                window.history.pushState({}, '', '/"+e.split("/").slice(3).join("/")+"');\n                            }\n                        <\/script>\n                    "})})})},t.prototype.loadHTML=function(){var e=this;return o.a.try(function(){if(!e.html)throw new Error("Html not prefetched");return e.html.then(function(t){return Object(u.V)(e.window,t)})})},t.prototype.checkAllowRenderTo=function(e){if(!e)throw this.component.createError("Must pass window to renderTo");if(!Object(a.u)(e)){var t=Object(a.g)(),n=this.component.getDomain(null,this.props.env);if(!n)throw new Error("Could not determine domain to allow remote render");if(!Object(a.A)(n,t))throw new Error("Can not render remotely to "+n.toString()+" - can only render to "+t)}},t.prototype.registerActiveComponent=function(){var e=this;t.activeComponents.push(this),this.clean.register(function(){t.activeComponents.splice(t.activeComponents.indexOf(e),1)})},t.prototype.getComponentParentRef=function(){if(this.component.getDomain(null,this.props.env)===Object(a.g)(window)){var e=Object(u.R)();return u.u.windows=u.u.windows||{},u.u.windows[e]=window,this.clean.register(function(){delete u.u.windows[e]}),{ref:m.WINDOW_REFERENCES.GLOBAL,uid:e}}return this.context===m.CONTEXT_TYPES.POPUP?{ref:m.WINDOW_REFERENCES.OPENER}:Object(a.w)(window)?{ref:m.WINDOW_REFERENCES.TOP}:{ref:m.WINDOW_REFERENCES.PARENT,distance:Object(a.f)(window)}},t.prototype.getRenderParentRef=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:window;if(e===window)return this.getComponentParentRef();var t=Object(u.R)();return u.u.windows[t]=e,this.clean.register(function(){delete u.u.windows[t]}),{ref:m.WINDOW_REFERENCES.GLOBAL,uid:t}},t.prototype.buildChildWindowName=function(){var e=(arguments.length>0&&void 0!==arguments[0]?arguments[0]:{}).renderTo,t=void 0===e?window:e,n=this.component.getDomain(null,this.props.env),r=Object(a.u)(t),o=Object(u.R)(),i=this.component.tag,c=Object(u.K)(this.getPropsForChild()),s=this.getComponentParentRef(),d=this.getRenderParentRef(t),f=r||this.component.unsafeRenderTo?{type:m.INITIAL_PROPS.RAW,value:c}:{type:m.INITIAL_PROPS.UID,uid:o};return f.type===m.INITIAL_PROPS.UID&&(u.u.props[o]=JSON.stringify(c),this.clean.register(function(){delete u.u.props[o]})),function(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};n.id=Object(u.R)(),n.domain=Object(a.g)(window);var r,o=v(e),i=v(t),c=(r=JSON.stringify(n),w.a.encode(r).replace(/\=/g,"").toLowerCase());if(!o)throw new Error("Invalid name: "+e+" - must contain alphanumeric characters");if(!i)throw new Error("Invalid version: "+t+" - must contain alphanumeric characters");return["xcomponent",o,i,c,""].join("__")}(this.component.name,this.component.version,{uid:o,tag:i,componentParent:s,renderParent:d,props:f,childDomain:n})},t.prototype.sendToParent=function(e,t){if(!O())throw new Error("Can not find parent component window to message");return this.component.log("send_to_parent_"+e),Object(i.send)(O(),e,t,{domain:E()})},t.prototype.setProps=function(e){var t=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];!function(e,t){var n=!(arguments.length>2&&void 0!==arguments[2])||arguments[2];if((t=t||{}).env&&"object"===N(e.url)&&!e.url[t.env])throw new Error("Invalid env: "+t.env);for(var r=0,o=e.getPropNames(),i=null==o?0:o.length;r<i;r++){var a=o[r],u=e.getProp(a);if(u.alias&&t.hasOwnProperty(u.alias)){var c=t[u.alias];delete t[u.alias],t[a]||(t[a]=c)}}for(var s=0,d=Object.keys(t),f=null==d?0:d.length;s<f;s++){var l=d[s],p=e.getProp(l),h=t[l];p&&R(p,l,h,t,n)}for(var w=0,m=e.getPropNames(),v=null==m?0:m.length;w<v;w++){var y=m[w],g=e.getProp(y),E=t[y];g&&!t.hasOwnProperty(y)&&R(g,y,E,t,n)}}(this.component,e,t),this.component.validate&&this.component.validate(this.component,e),this.props=this.props||{},Object(u.p)(this.props,function(e,t,n){var r={};n=n||{};for(var o=0,i=Object.keys(n),a=null==i?0:i.length;o<a;o++){var u=i[o];-1!==e.getPropNames().indexOf(u)?r[u]=x(e,t,n,u,n[u]):r[u]=n[u]}for(var c=0,s=e.getPropNames(),d=null==s?0:s.length;c<d;c++){var f=s[c];if(!(n.hasOwnProperty(f)||t.props&&t.props.hasOwnProperty(f))){var l=x(e,t,n,f,n[f]);void 0!==l&&(r[f]=l)}}return r}(this.component,this,e))},t.prototype.buildUrl=function(){var e,t,n,r=this,i=this.props.url;return o.a.all([i,(e=W({},this.component.props,this.component.builtinProps),t=this.props,n={},o.a.all(Object.keys(t).map(function(r){var i=e[r];if(i)return o.a.resolve().then(function(){var e=t[r];if(e&&i.queryParam)return e}).then(function(e){if(e)return o.a.all([function(e,t,n){return o.a.try(function(){return"function"==typeof e.queryParam?e.queryParam(n):"string"==typeof e.queryParam?e.queryParam:t})}(i,r,e),function(e,t,n){return o.a.try(function(){return"function"==typeof e.queryValue?e.queryValue(n):n})}(i,0,e)]).then(function(e){var t=e[0],o=e[1],a=void 0;if("boolean"==typeof o)a="1";else if("string"==typeof o)a=o.toString();else{if("function"==typeof o)return;if("object"===(void 0===o?"undefined":D(o))&&null!==o){if("json"!==i.serialization){a=Object(u.l)(o,r);for(var c=0,s=Object.keys(a),d=null==s?0:s.length;c<d;c++){var f=s[c];n[f]=a[f]}return}a=JSON.stringify(o)}else"number"==typeof o&&(a=o.toString())}n[t]=a})})})).then(function(){return Object.keys(n).forEach(function(e){n[e]=escape(n[e])}),n}))]).then(function(e){var t=e[0],n=e[1];return t&&!r.component.getValidDomain(t)?t:o.a.try(function(){return t||r.component.getUrl(r.props.env,r.props)}).then(function(e){return n.xcomponent="1",Object(u.q)(e,{query:n})})})},t.prototype.getDomain=function(){var e=this;return o.a.try(function(){return e.props.url}).then(function(t){return e.component.getDomain(t,e.props.env)||(e.component.buildUrl?o.a.try(function(){return e.component.buildUrl(e.props)}).then(function(t){return e.component.getDomain(t,e.props.env)}):void 0)}).then(function(e){if(!e)throw new Error("Could not determine domain");return e})},t.prototype.getPropsForChild=function(){for(var e={},t=0,n=Object.keys(this.props),r=null==n?0:n.length;t<r;t++){var o=n[t],i=this.component.getProp(o);i&&!1===i.sendToChild||(e[o]=this.props[o])}return e},t.prototype.updateProps=function(e){var t=this;return this.setProps(e,!1),this.onInit.then(function(){if(t.childExports)return t.childExports.updateProps(t.getPropsForChild());throw new Error("Child exports were not available")})},t.prototype.openBridge=function(e){var t=this;return o.a.try(function(){if(i.bridge&&t.driver.needsBridge){var n={win:t.window};e&&(n.domain=e);var r=i.bridge.needsBridge(n),o=t.component.getBridgeUrl(t.props.env);if(o){o=Object(u.q)(o,{query:{version:t.component.version}});var a=t.component.getBridgeDomain(t.props.env);if(!a)throw new Error("Can not determine domain for bridge");return r?i.bridge.openBridge(o,a).then(function(e){if(e)return e}):void 0}if(r&&e&&!i.bridge.hasBridge(e,e))throw new Error("Bridge url needed to render "+t.context)}})},t.prototype.open=function(){var e=this;return o.a.try(function(){e.component.log("open_"+e.context,{windowName:e.childWindowName});var t=e.props.win;return t?(e.clean.set("window",t),window.addEventListener("beforeunload",function(){return t.close()}),window.addEventListener("unload",function(){return t.close()}),void(Object(a.a)(e.window).name=e.childWindowName)):e.driver.open.call(e)})},t.prototype.openPrerender=function(){var e=this;return o.a.try(function(){if(e.component.prerenderTemplate)return e.driver.openPrerender.call(e)})},t.prototype.switchPrerender=function(){var e=this;return o.a.try(function(){if(e.prerenderWindow&&e.driver.switchPrerender)return e.driver.switchPrerender.call(e)})},t.prototype.elementReady=function(e){return Object(u.m)(e).then(u.E)},t.prototype.delegate=function(e){var t=this;this.component.log("delegate_"+this.context);for(var n={uid:this.props.uid,dimensions:this.props.dimensions,onClose:this.props.onClose,onDisplay:this.props.onDisplay},r=0,o=this.component.getPropNames(),c=null==o?0:o.length;r<c;r++){var s=o[r];this.component.getProp(s).allowDelegate&&(n[s]=this.props[s])}for(var d=Object(i.send)(e,m.POST_MESSAGE.DELEGATE+"_"+this.component.name,{context:this.context,env:this.props.env,options:{context:this.context,childWindowName:this.childWindowName,isWindowClosed:function(){return Object(a.y)(t.window)},props:n,overrides:{focus:function(){return t.focus()},userClose:function(){return t.userClose()},getDomain:function(){return t.getDomain()},error:function(e){return t.error(e)},on:function(e,n){return t.on(e,n)}}}}).then(function(e){var n=e.data;return t.clean.register(n.destroy),n}).catch(function(e){throw new Error("Unable to delegate rendering. Possibly the component is not loaded in the target window.\n\n"+Object(u.P)(e))}),f=this.driver.delegateOverrides,l=function(e,n,r){var o=n[e],i=f[o];if(i===m.DELEGATE.CALL_ORIGINAL)return"continue";var a=t[o];t[o]=function(){var e=this,t=arguments;return d.then(function(n){var r=n.overrides[o];if(i===m.DELEGATE.CALL_DELEGATE)return r.apply(e,t);if("function"==typeof i)return i(a,r).apply(e,t);throw new Error("Expected delgate to be CALL_ORIGINAL, CALL_DELEGATE, or factory method")})}},p=0,h=Object.keys(f),w=null==h?0:h.length;p<w;p++)l(p,h)},t.prototype.watchForClose=function(){var e=this,t=Object(a.B)(this.window,function(){return e.component.log("detect_close_child"),o.a.try(function(){return e.props.onClose(m.CLOSE_REASONS.CLOSE_DETECTED)}).finally(function(){return e.destroy()})},3e3);this.clean.register("destroyCloseWindowListener",t.cancel)},t.prototype.watchForUnload=function(){var e=this,t=Object(u.F)(function(){e.component.log("navigate_away"),Object(s.c)(),e.destroyComponent()}),n=Object(u.b)(window,"unload",t);this.clean.register("destroyUnloadWindowListener",n.cancel)},t.prototype.loadUrl=function(e){var t=this;return o.a.try(function(){var n;return t.component.log("load_url"),window.location.href.split("#")[0]===e.split("#")[0]&&(e=Object(u.q)(e,{query:(n={},n[Object(u.R)()]="1",n)})),t.driver.loadUrl.call(t,e)})},t.prototype.hijack=function(e){e.target=this.childWindowName},t.prototype.runTimeout=function(){var e=this,t=this.props.timeout;if(t){var n=this.timeout=setTimeout(function(){e.component.log("timed_out",{timeout:t.toString()});var n=e.component.createError("Loading component timed out after "+t+" milliseconds");e.onInit.reject(n),e.props.onTimeout(n)},t);this.clean.register(function(){clearTimeout(n),delete e.timeout})}},t.prototype.listeners=function(){var e;return(e={})[m.POST_MESSAGE.INIT]=function(e,t){return this.childExports=t.exports,this.onInit.resolve(this),this.timeout&&clearTimeout(this.timeout),{props:this.getPropsForChild(),context:this.context}},e[m.POST_MESSAGE.CLOSE]=function(e,t){this.close(t.reason)},e[m.POST_MESSAGE.CHECK_CLOSE]=function(){this.checkClose()},e[m.POST_MESSAGE.RESIZE]=function(e,t){var n=this;return o.a.try(function(){if(n.driver.allowResize)return n.resize(t.width,t.height)})},e[m.POST_MESSAGE.HIDE]=function(){this.hide()},e[m.POST_MESSAGE.SHOW]=function(){this.show()},e[m.POST_MESSAGE.ERROR]=function(e,t){this.error(new Error(t.error))},e},t.prototype.resize=function(e,t){var n=this;return o.a.try(function(){n.component.log("resize",{height:Object(u.O)(t),width:Object(u.O)(e)}),n.driver.resize.call(n,e,t),n.props.onResize&&n.props.onResize()})},t.prototype.hide=function(){return this.container&&Object(u.w)(this.container),this.driver.hide.call(this)},t.prototype.show=function(){return this.container&&Object(u.N)(this.container),this.driver.show.call(this)},t.prototype.checkClose=function(){var e=this,t=Object(a.B)(this.window,function(){e.userClose()},50,500);this.clean.register(t.cancel)},t.prototype.userClose=function(){return this.close(m.CLOSE_REASONS.USER_CLOSED)},t.prototype.close=function(){var e=this,t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:m.CLOSE_REASONS.PARENT_CALL;return o.a.try(function(){return e.component.log("close",{reason:t}),e.event.triggerOnce(m.EVENTS.CLOSE),e.props.onClose(t)}).then(function(){return o.a.all([e.closeComponent(),e.closeContainer()])}).then(function(){return e.destroy()})},t.prototype.closeContainer=function(){var e=this,t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:m.CLOSE_REASONS.PARENT_CALL;return o.a.try(function(){return e.event.triggerOnce(m.EVENTS.CLOSE),e.props.onClose(t)}).then(function(){return o.a.all([e.closeComponent(t),e.hideContainer()])}).then(function(){return e.destroyContainer()})},t.prototype.destroyContainer=function(){var e=this;return o.a.try(function(){e.clean.run("destroyContainerEvents"),e.clean.run("destroyContainerTemplate")})},t.prototype.closeComponent=function(){var e=this,t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:m.CLOSE_REASONS.PARENT_CALL,n=this.window;return o.a.try(function(){return e.cancelContainerEvents()}).then(function(){return e.event.triggerOnce(m.EVENTS.CLOSE),e.props.onClose(t)}).then(function(){return e.hideComponent()}).then(function(){return e.destroyComponent()}).then(function(){e.childExports&&e.context===m.CONTEXT_TYPES.POPUP&&!Object(a.y)(n)&&e.childExports.close().catch(u.E)})},t.prototype.destroyComponent=function(){this.clean.run("destroyUnloadWindowListener"),this.clean.run("destroyCloseWindowListener"),this.clean.run("destroyContainerEvents"),this.clean.run("destroyWindow")},t.prototype.showContainer=function(){var e=this;return o.a.try(function(){if(e.props.onDisplay)return e.props.onDisplay()}).then(function(){if(e.container)return Object(u.M)(e.container,m.ANIMATION_NAMES.SHOW_CONTAINER,e.clean.register)})},t.prototype.showComponent=function(){var e=this;return o.a.try(function(){if(e.props.onDisplay)return e.props.onDisplay()}).then(function(){if(e.element)return Object(u.M)(e.element,m.ANIMATION_NAMES.SHOW_COMPONENT,e.clean.register)})},t.prototype.hideContainer=function(){var e=this;return o.a.try(function(){return e.container?Object(u.c)(e.container,m.ANIMATION_NAMES.HIDE_CONTAINER,e.clean.register):o.a.resolve()})},t.prototype.hideComponent=function(){var e=this;return o.a.try(function(){return e.element?Object(u.c)(e.element,m.ANIMATION_NAMES.HIDE_COMPONENT,e.clean.register):o.a.resolve()})},t.prototype.focus=function(){if(!this.window||Object(a.y)(this.window))throw new Error("No window to focus");this.component.log("focus"),this.window.focus()},t.prototype.createPrerenderTemplate=function(){var e=this;return o.a.try(function(){return e.component.prerenderTemplate?o.a.try(function(){return e.prerenderIframe?Object(u.e)(e.prerenderIframe).then(function(){return e.prerenderWindow}):e.prerenderWindow}).then(function(t){var n=void 0;try{n=t.document}catch(e){return}var r=void 0;try{r=e.renderTemplate(e.component.prerenderTemplate,{jsxDom:u.B.bind(n),document:n})}catch(t){return e.component.logError("preprender_error",{err:t.stack?t.stack:t.toString()}),void console.error(t.stack?t.stack:t)}try{Object(u.U)(t,r)}catch(t){e.component.logError("preprender_error",{err:t.stack?t.stack:t.toString()}),console.error(t.stack?t.stack:t)}var o="object"===k(e.component.autoResize)&&null!==e.component.autoResize?e.component.autoResize:{},i=o.width,a=void 0!==i&&i,c=o.height,s=void 0!==c&&c,d=o.element,p=void 0===d?"body":d;(p=function(e){var t,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:document;return(t=e)instanceof window.Element||null!==t&&"object"===(void 0===t?"undefined":f(t))&&1===t.nodeType&&"object"===f(t.style)&&"object"===f(t.ownerDocument)?e:"string"==typeof e?n.querySelector(e):void 0}(p,n))&&(a||s)&&l(p,function(t){var n=t.width,r=t.height;e.resize(a?n:void 0,s?r:void 0)},{width:a,height:s,win:t})}):o.a.resolve()})},t.prototype.renderTemplate=function(e){var t=this,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r=this.component.dimensions||{},o=r.width,i=void 0===o?m.DEFAULT_DIMENSIONS.WIDTH+"px":o,a=r.height,c=void 0===a?m.DEFAULT_DIMENSIONS.HEIGHT+"px":a;return e.call(this,W({id:m.CLASS_NAMES.ZOID+"-"+this.component.tag+"-"+this.props.uid,props:e.__xdomain__?null:this.props,tag:this.component.tag,context:this.context,outlet:this.getOutlet(),CLASS:m.CLASS_NAMES,ANIMATION:m.ANIMATION_NAMES,CONTEXT:m.CONTEXT_TYPES,EVENT:m.EVENTS,actions:{close:function(){return t.userClose()},focus:function(){return t.focus()}},on:function(e,n){return t.on(e,n)},jsxDom:u.B,document:document,dimensions:{width:i,height:c}},n))},t.prototype.openContainer=function(e){var t=this;return o.a.try(function(){var n=void 0;if(!(n=e?Object(u.t)(e):document.body))throw new Error("Could not find element to open container into");if(p(n)&&(n=function(e){var t=function(e){var t=function(e){for(;e.parentNode;)e=e.parentNode;if(p(e))return e}(e);if(t.host)return t.host}(e);if(!t)throw new Error("Element is not in shadow dom");if(p(t))throw new Error("Host element is also in shadow dom");var n="shadow-slot-"+d(),r=document.createElement("slot");r.setAttribute("name",n),e.appendChild(r);var o=document.createElement("div");return o.setAttribute("slot",n),t.appendChild(o),o}(n)),t.component.containerTemplate){var r=t.renderTemplate(t.component.containerTemplate,{container:n});if(t.container=r,Object(u.w)(t.container),Object(u.d)(n,t.container),t.driver.renderedIntoContainerTemplate){if(t.element=t.getOutlet(),Object(u.w)(t.element),!t.element)throw new Error("Could not find element to render component into");Object(u.w)(t.element)}t.clean.register("destroyContainerTemplate",function(){t.container&&t.container.parentNode&&t.container.parentNode.removeChild(t.container),delete t.container})}else if(t.driver.renderedIntoContainerTemplate)throw new Error("containerTemplate needed to render "+t.context)})},t.prototype.cancelContainerEvents=function(){this.clean.run("destroyContainerEvents")},t.prototype.destroy=function(){var e=this;return o.a.try(function(){if(e.clean.hasTasks())return e.component.log("destroy"),Object(s.c)(),e.clean.all()}).then(function(){if(e.props&&e.props.onDestroy)return e.props.onDestroy()})},t.prototype.tryInit=function(e){var t=this;return o.a.try(e).catch(function(e){t.onInit.reject(e)}).then(function(){return t.onInit})},t.prototype.error=function(e){var t=this;return o.a.try(function(){if(t.handledErrors=t.handledErrors||[],-1===t.handledErrors.indexOf(e))return t.handledErrors.push(e),t.onInit.reject(e),t.destroy()}).then(function(){if(t.props.onError)return t.props.onError(e)}).catch(function(t){throw new Error("An error was encountered while handling error:\n\n "+Object(u.P)(e)+"\n\n"+Object(u.P)(t))}).then(function(){if(!t.props.onError)throw e})},t.destroyAll=function(){for(var e=[];t.activeComponents.length;)e.push(t.activeComponents[0].destroy());return o.a.all(e).then(u.E)},B(t,[{key:"driver",get:function(){if(!this.context)throw new Error("Context not set");return I[this.context]}}]),t}(c)).prototype,"getOutlet",[u.D],Object.getOwnPropertyDescriptor(M.prototype,"getOutlet"),M.prototype),G(M.prototype,"prefetch",[u.D],Object.getOwnPropertyDescriptor(M.prototype,"prefetch"),M.prototype),G(M.prototype,"loadHTML",[u.D],Object.getOwnPropertyDescriptor(M.prototype,"loadHTML"),M.prototype),G(M.prototype,"buildUrl",[u.D],Object.getOwnPropertyDescriptor(M.prototype,"buildUrl"),M.prototype),G(M.prototype,"open",[u.D],Object.getOwnPropertyDescriptor(M.prototype,"open"),M.prototype),G(M.prototype,"openPrerender",[u.D],Object.getOwnPropertyDescriptor(M.prototype,"openPrerender"),M.prototype),G(M.prototype,"switchPrerender",[u.D],Object.getOwnPropertyDescriptor(M.prototype,"switchPrerender"),M.prototype),G(M.prototype,"close",[u.D],Object.getOwnPropertyDescriptor(M.prototype,"close"),M.prototype),G(M.prototype,"closeContainer",[u.D],Object.getOwnPropertyDescriptor(M.prototype,"closeContainer"),M.prototype),G(M.prototype,"destroyContainer",[u.D],Object.getOwnPropertyDescriptor(M.prototype,"destroyContainer"),M.prototype),G(M.prototype,"closeComponent",[u.D],Object.getOwnPropertyDescriptor(M.prototype,"closeComponent"),M.prototype),G(M.prototype,"showContainer",[u.D],Object.getOwnPropertyDescriptor(M.prototype,"showContainer"),M.prototype),G(M.prototype,"showComponent",[u.D],Object.getOwnPropertyDescriptor(M.prototype,"showComponent"),M.prototype),G(M.prototype,"hideContainer",[u.D],Object.getOwnPropertyDescriptor(M.prototype,"hideContainer"),M.prototype),G(M.prototype,"hideComponent",[u.D],Object.getOwnPropertyDescriptor(M.prototype,"hideComponent"),M.prototype),G(M.prototype,"createPrerenderTemplate",[u.D],Object.getOwnPropertyDescriptor(M.prototype,"createPrerenderTemplate"),M.prototype),G(M.prototype,"openContainer",[u.D],Object.getOwnPropertyDescriptor(M.prototype,"openContainer"),M.prototype),M);U.activeComponents=[];var F=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),z=function(e){function t(n,r,i){!function(e,n){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this);var a=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,e.call(this));a.component=n,a.clean.set("source",r),a.context=i.context,a.props={uid:i.props.uid,dimensions:i.props.dimensions,onClose:i.props.onClose,onDisplay:i.props.onDisplay};for(var c=0,s=n.getPropNames(),d=null==s?0:s.length;c<d;c++){var f=s[c];a.component.getProp(f).allowDelegate&&(a.props[f]=i.props[f])}a.focus=function(){return o.a.all([a.isWindowClosed().then(function(e){e||window.open("",a.childWindowName)}),i.overrides.focus.call(a)]).then(u.E)},a.clean.register("destroyFocusOverride",function(){a.focus=u.E}),a.userClose=i.overrides.userClose,a.getDomain=i.overrides.getDomain,a.error=i.overrides.error,a.on=i.overrides.on;for(var l=I[i.context].delegateOverrides,p=0,h=Object.keys(l),w=null==h?0:h.length;p<w;p++){var m=h[p];a[m]=U.prototype[m]}return a.childWindowName=i.childWindowName,a.isWindowClosed=i.isWindowClosed,U.prototype.registerActiveComponent.call(a),a.watchForClose(),a}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,e),t.prototype.watchForClose=function(){var e=this,t=Object(a.B)(this.source,function(){return e.destroy()},3e3);this.clean.register("destroyCloseWindowListener",t.cancel)},t.prototype.getOverrides=function(e){for(var t=I[e].delegateOverrides,n={},r=this,o=function(e,t,o){var i=t[e];n[i]=function(){return U.prototype[i].apply(r,arguments)}},i=0,a=Object.keys(t),u=null==a?0:a.length;i<u;i++)o(i,a);return n},t.prototype.destroy=function(){return this.clean.all()},F(t,[{key:"driver",get:function(){if(!this.context)throw new Error("Context not set");return I[this.context]}}]),t}(c),H=n(18),q="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};function Y(e){var t=e.id,n=e.tag,r=e.context,o=e.CLASS,i=e.outlet,a=e.jsxDom,u=e.dimensions,c=u.width,s=u.height;return a("div",{id:t,class:o.ZOID+" "+o.ZOID+"-tag-"+n+" "+o.ZOID+"-context-"+r},a("style",null,"\n                    #"+t+", #"+t+" > ."+o.OUTLET+" {\n                        width: "+c+";\n                        height: "+s+";\n                    }\n\n                    #"+t+" > ."+o.OUTLET+" {\n                        display: inline-block;\n                        position: relative;\n                    }\n\n                    #"+t+" > ."+o.OUTLET+" > iframe {\n                        height: 100%;\n                        width: 100%;\n                        position: absolute;\n                        top: 0;\n                        left: 0;\n                        transition: opacity .2s ease-in-out;\n                    }\n\n                    #"+t+" > ."+o.OUTLET+" > iframe."+o.VISIBLE+" {\n                        opacity: 1;\n                    }\n\n                    #"+t+" > ."+o.OUTLET+" > iframe."+o.INVISIBLE+" {\n                        opacity: 0;\n                    }\n                "),i)}function X(e){var t=e.jsxDom;return t("html",null,t("head",null,t("style",null,"\n                        html, body {\n                            width: 100%;\n                            height: 100%;\n                            overflow: hidden;\n                            top: 0;\n                            left: 0;\n                            margin: 0;\n                            text-align: center;\n                        }\n\n                        .spinner {\n                            position: absolute;\n                            max-height: 60vmin;\n                            max-width: 60vmin;\n                            height: 40px;\n                            width: 40px;\n                            top: 50%;\n                            left: 50%;\n                            transform: translateX(-50%) translateY(-50%);\n                            z-index: 10;\n                        }\n\n                        .spinner .loader {\n                            height: 100%;\n                            width: 100%;\n                            box-sizing: border-box;\n                            border: 3px solid rgba(0, 0, 0, .2);\n                            border-top-color: rgba(33, 128, 192, 0.8);\n                            border-radius: 100%;\n                            animation: rotation .7s infinite linear;\n\n                        }\n\n                        @keyframes rotation {\n                            from {\n                                transform: rotate(0deg)\n                            }\n                            to {\n                                transform: rotate(359deg)\n                            }\n                        }\n                    ")),t("body",null,t("div",{class:"spinner"},t("div",{id:"loader",class:"loader"}))))}n(26);var Z,J,K,V,$,Q,ee="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},te={angular:H.angular,angular2:H.angular2,glimmer:H.glimmer,react:H.react,vue:H.vue,script:H.script},ne=(Z=function(e){function t(n){!function(e,n){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this);var r=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,e.call(this));if(function(e){if(!e)throw new Error("Expecred options to be passed");if(!e.tag||!e.tag.match(/^[a-z0-9-]+$/))throw new Error("Invalid options.tag: "+e.tag);if(function(e){if(e.props&&"object"!==q(e.props))throw new Error("Expected options.props to be an object");if(e.props)for(var t=0,n=Object.keys(e.props),r=null==n?0:n.length;t<r;t++){var o=n[t],i=e.props[o];if(!i||"object"!==(void 0===i?"undefined":q(i)))throw new Error("Expected options.props."+o+" to be an object");if(!i.type)throw new Error("Expected prop.type");if(-1===m.PROP_TYPES_LIST.indexOf(i.type))throw new Error("Expected prop.type to be one of "+m.PROP_TYPES_LIST.join(", "));if(i.required&&i.def)throw new Error("Required prop can not have a default value")}}(e),e.dimensions){if(e.dimensions&&!Object(u.A)(e.dimensions.width)&&!Object(u.z)(e.dimensions.width))throw new Error("Expected options.dimensions.width to be a px or % string value");if(e.dimensions&&!Object(u.A)(e.dimensions.height)&&!Object(u.z)(e.dimensions.height))throw new Error("Expected options.dimensions.height to be a px or % string value")}if(e.contexts){if(e.contexts.popup)throw new Error("Popups not supported in this build -- please use the full zoid.js build");for(var t=!1,n=0,r=Object.keys(e.contexts),o=null==r?0:r.length;n<o;n++){var i=r[n];if(-1===m.CONTEXT_TYPES_LIST.indexOf(i))throw new Error("Unsupported context type: "+i);(e.contexts&&e.contexts[i]||e.contexts&&void 0===e.contexts[i])&&(t=!0)}if(!t)throw new Error("No context type is enabled")}if(e.defaultContext){if(-1===m.CONTEXT_TYPES_LIST.indexOf(e.defaultContext))throw new Error("Unsupported context type: "+(e.defaultContext||"unknown"));if(e.contexts&&e.defaultContext&&!e.contexts[e.defaultContext])throw new Error("Disallowed default context type: "+(e.defaultContext||"unknown"))}if(e.url&&e.buildUrl)throw new Error("Can not pass both options.url and options.buildUrl");if(e.defaultEnv){if("string"!=typeof e.defaultEnv)throw new TypeError("Expected options.defaultEnv to be a string");if(!e.buildUrl&&"object"!==q(e.url))throw new Error("Expected options.url to be an object mapping env->url");if(e.url&&"object"===q(e.url)&&!e.url[e.defaultEnv])throw new Error("No url found for default env: "+e.defaultEnv)}if(e.url&&"object"===q(e.url)){if(!e.defaultEnv)throw new Error("Must pass options.defaultEnv with env->url mapping");for(var a=0,c=Object.keys(e.url),s=null==c?0:c.length;a<s;a++){var d=c[a];if(!e.url[d])throw new Error("No url specified for env: "+d)}}if(e.prerenderTemplate&&"function"!=typeof e.prerenderTemplate)throw new Error("Expected options.prerenderTemplate to be a function");if(e.containerTemplate&&"function"!=typeof e.containerTemplate)throw new Error("Expected options.containerTemplate to be a function")}(n),r.addProp(n,"tag"),r.addProp(n,"defaultLogLevel","info"),r.addProp(n,"allowedParentDomains",m.WILDCARD),Object(u.L)(r.defaultLogLevel),t.components[r.tag])throw new Error("Can not register multiple components with the same tag");return r.addProp(n,"name",r.tag.replace(/-/g,"_")),r.builtinProps={env:{type:"string",required:!1,queryParam:!0,def:function(){return this.defaultEnv}},uid:{type:"string",def:function(){return Object(u.R)()},queryParam:!0},logLevel:{type:"string",required:!1,queryParam:!0,def:function(){return this.defaultLogLevel}},url:{type:"string",required:!1,promise:!0,sendToChild:!1},win:{type:"object",required:!1,sendToChild:!1},dimensions:{type:"object",required:!1},version:{type:"string",required:!1,queryParam:!0,def:function(){return this.version}},timeout:{type:"number",required:!1,sendToChild:!1},onDisplay:{type:"function",required:!1,noop:!0,promisify:!0,memoize:!0,sendToChild:!1},onEnter:{type:"function",required:!1,noop:!0,promisify:!0,sendToChild:!1},onRender:{type:"function",required:!1,noop:!0,promisify:!0,sendToChild:!1},onClose:{type:"function",required:!1,noop:!0,once:!0,promisify:!0,sendToChild:!1},onDestroy:{type:"function",required:!1,noop:!0,once:!0,promisify:!0,sendToChild:!1},onResize:{type:"function",required:!1,noop:!0,sendToChild:!1},onTimeout:{type:"function",required:!1,memoize:!0,promisify:!0,sendToChild:!1,def:function(){return function(e){if(this.props.onError)return this.props.onError(e);throw e}}},onError:{type:"function",required:!1,promisify:!0,sendToChild:!0,once:!0,def:function(){return function(e){setTimeout(function(){throw e})}}}},r.props=n.props||{},n.props||(r.looseProps=!0),r.addProp(n,"dimensions"),r.addProp(n,"scrolling"),r.addProp(n,"listenForResize"),r.addProp(n,"version","latest"),r.addProp(n,"defaultEnv"),r.addProp(n,"buildUrl"),r.addProp(n,"url"),r.addProp(n,"domain"),r.addProp(n,"bridgeUrl"),r.addProp(n,"bridgeDomain"),r.addProp(n,"attributes",{}),r.addProp(n,"contexts",{iframe:!0,popup:!1}),r.addProp(n,"defaultContext"),r.addProp(n,"autoResize",!1),r.addProp(n,"containerTemplate",Y),r.addProp(n,"prerenderTemplate",X),r.addProp(n,"validate"),r.addProp(n,"unsafeRenderTo",!1),t.components[r.tag]=r,r.registerDrivers(),r.registerChild(),r.listenDelegate(),r}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(t,e),t.prototype.getPropNames=function(){for(var e=Object.keys(this.props),t=0,n=Object.keys(this.builtinProps),r=null==n?0:n.length;t<r;t++){var o=n[t];-1===e.indexOf(o)&&e.push(o)}return e},t.prototype.getProp=function(e){return this.props[e]||this.builtinProps[e]},t.prototype.registerDrivers=function(){this.driverCache={};for(var e=0,t=Object.keys(te),n=null==t?0:t.length;e<n;e++){var r=t[e];if(0!==r.indexOf("_")){var o=te[r].global();o&&this.driver(r,o)}}},t.prototype.driver=function(e,t){if(!te[e])throw new Error("Could not find driver for framework: "+e);return this.driverCache[e]||(this.driverCache[e]=te[e].register(this,t)),this.driverCache[e]},t.prototype.registerChild=function(){var e=this;return o.a.try(function(){if(e.isChild())return new j(e)})},t.prototype.listenDelegate=function(){var e=this;Object(i.on)(m.POST_MESSAGE.ALLOW_DELEGATE+"_"+this.name,function(){return!0}),Object(i.on)(m.POST_MESSAGE.DELEGATE+"_"+this.name,function(t){var n=t.source,r=t.origin,o=t.data,i=e.getDomain(null,o.env||e.defaultEnv);if(!i)throw new Error("Could not determine domain to allow remote render");if(!Object(a.A)(i,r))throw new Error("Can not render from "+r+" - expected "+i.toString());var u=e.delegate(n,o.options);return{overrides:u.getOverrides(o.context),destroy:function(){return u.destroy()}}})},t.prototype.canRenderTo=function(e){return Object(i.send)(e,m.POST_MESSAGE.ALLOW_DELEGATE+"_"+this.name).then(function(e){return e.data}).catch(function(){return!1})},t.prototype.getValidDomain=function(e){if(e){var t=Object(a.h)(e);if("string"==typeof this.domain&&t===this.domain)return t;var n=this.domain;if(n&&"object"===(void 0===n?"undefined":ee(n))&&!(n instanceof RegExp))for(var r=0,o=Object.keys(n),i=null==o?0:o.length;r<i;r++){var u=o[r];if("test"!==u&&t===n[u])return t}}},t.prototype.getDomain=function(e,t){var n=this.getForEnv(this.domain,t);if(n)return n;if(n=this.getValidDomain(e))return n;var r=this.getForEnv(this.url,t);return r?Object(a.h)(r):e?Object(a.h)(e):void 0},t.prototype.getBridgeUrl=function(e){return this.getForEnv(this.bridgeUrl,e)},t.prototype.getForEnv=function(e,t){if(e){if("string"==typeof e||e instanceof RegExp)return e;if(t||(t=this.defaultEnv),t)return t&&"object"===(void 0===e?"undefined":ee(e))&&e[t]?e[t]:void 0}},t.prototype.getBridgeDomain=function(e){var t=this.getForEnv(this.bridgeDomain,e);if(t)return t;var n=this.getBridgeUrl(e);return n?Object(a.h)(n):void 0},t.prototype.getUrl=function(e,t){var n=this.getForEnv(this.url,e);if(n)return n;if(this.buildUrl)return this.buildUrl(t);throw new Error("Unable to get url")},t.prototype.isZoidComponent=function(){return y()},t.prototype.isChild=function(){if(!y())return!1;var e=g(),t=e.tag,n=e.childDomain;return(!n||n===Object(a.g)())&&t===this.tag},t.prototype.createError=function(e,t){return new Error("["+(t||this.tag)+"] "+e)},t.prototype.init=function(e,t,n){return new U(this,this.getRenderContext(t,n),{props:e})},t.prototype.delegate=function(e,t){return new z(this,e,t)},t.prototype.validateRenderContext=function(e,t){if(e&&!this.contexts[e])throw new Error("["+this.tag+"] Can not render to "+e);if(!t&&e===m.CONTEXT_TYPES.IFRAME)throw new Error("["+this.tag+"] Context type "+m.CONTEXT_TYPES.IFRAME+" requires an element selector")},t.prototype.getDefaultContext=function(){if(this.defaultContext)return this.defaultContext;if(this.contexts[m.CONTEXT_TYPES.IFRAME])return m.CONTEXT_TYPES.IFRAME;if(this.contexts[m.CONTEXT_TYPES.POPUP])return m.CONTEXT_TYPES.POPUP;throw new Error("Can not determine default context")},t.prototype.getRenderContext=function(e,t){return e=e||this.getDefaultContext(),this.validateRenderContext(e,t),e},t.prototype.render=function(e,t){var n=this;return o.a.try(function(){return new U(n,n.getRenderContext(null,t),{props:e}).render(t)})},t.prototype.renderIframe=function(e,t){var n=this;return o.a.try(function(){return new U(n,n.getRenderContext(m.CONTEXT_TYPES.IFRAME,t),{props:e}).render(t)})},t.prototype.renderPopup=function(e){var t=this;return o.a.try(function(){return new U(t,t.getRenderContext(m.CONTEXT_TYPES.POPUP),{props:e}).render()})},t.prototype.renderTo=function(e,t,n){var r=this;return o.a.try(function(){return new U(r,r.getRenderContext(null,n),{props:t}).renderTo(e,n)})},t.prototype.renderIframeTo=function(e,t,n){var r=this;return o.a.try(function(){return new U(r,r.getRenderContext(m.CONTEXT_TYPES.IFRAME,n),{props:t}).renderTo(e,n)})},t.prototype.renderPopupTo=function(e,t){var n=this;return o.a.try(function(){return new U(n,n.getRenderContext(m.CONTEXT_TYPES.POPUP),{props:t}).renderTo(e)})},t.prototype.prerender=function(e,t){var n=new U(this,this.getRenderContext(null,t),{props:e});return n.prefetch(),{render:function(e,t){return e&&n.updateProps(e),n.render(t)},renderTo:function(e,t,r){return t&&n.updateProps(t),n.renderTo(e,r)},get html(){return n.html},set html(e){n.html=e}}},t.prototype.log=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};Object(u.y)(this.name,e,t)},t.prototype.logWarning=function(e,t){Object(u.S)(this.name,e,t)},t.prototype.logError=function(e,t){Object(u.n)(this.name,e,t)},t.getByTag=function(e){return t.components[e]},t}(c),J=Z.prototype,K=[u.C],V=Object.getOwnPropertyDescriptor(Z.prototype,"getPropNames"),$=Z.prototype,Q={},Object.keys(V).forEach(function(e){Q[e]=V[e]}),Q.enumerable=!!Q.enumerable,Q.configurable=!!Q.configurable,("value"in Q||Q.initializer)&&(Q.writable=!0),Q=K.slice().reverse().reduce(function(e,t){return t(J,"getPropNames",e)||e},Q),$&&void 0!==Q.initializer&&(Q.value=Q.initializer?Q.initializer.call($):void 0,Q.initializer=void 0),void 0===Q.initializer&&(Object.defineProperty(J,"getPropNames",Q),Q=null),Z);function re(e){return new ne(e)}function oe(e){return ne.getByTag(e)}function ie(){return U.destroyAll()}ne.components={};var ae=i,ue=m;n.d(t,"create",function(){return re}),n.d(t,"getByTag",function(){return oe}),n.d(t,"getCurrentScriptDir",function(){return u.s}),n.d(t,"destroyAll",function(){return ie}),n.d(t,"postRobot",function(){return ae}),n.d(t,"CONSTANTS",function(){return ue}),n.d(t,"PopupOpenError",function(){return S.b}),n.d(t,"IntegrationError",function(){return S.a}),n.d(t,"RenderError",function(){return S.c}),t.default=r},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(10);n.d(t,"openBridge",function(){return r.openBridge}),n.d(t,"linkUrl",function(){return r.linkUrl}),n.d(t,"isBridge",function(){return r.isBridge}),n.d(t,"needsBridge",function(){return r.needsBridge}),n.d(t,"needsBridgeForBrowser",function(){return r.needsBridgeForBrowser}),n.d(t,"hasBridge",function(){return r.hasBridge}),n.d(t,"needsBridgeForWin",function(){return r.needsBridgeForWin}),n.d(t,"needsBridgeForDomain",function(){return r.needsBridgeForDomain}),n.d(t,"openTunnelToOpener",function(){return r.openTunnelToOpener}),n.d(t,"destroyBridges",function(){return r.destroyBridges})},function(e,t,n){(function(e){var t,r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};!function(){"use strict";var o="object"===("undefined"==typeof window?"undefined":r(window))?window:{};!o.HI_BASE32_NO_NODE_JS&&"object"===("undefined"==typeof process?"undefined":r(process))&&process.versions&&process.versions.node&&(o=window);var i=!o.HI_BASE32_NO_COMMON_JS&&"object"===r(e)&&e.exports,a=n(17),u="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".split(""),c={A:0,B:1,C:2,D:3,E:4,F:5,G:6,H:7,I:8,J:9,K:10,L:11,M:12,N:13,O:14,P:15,Q:16,R:17,S:18,T:19,U:20,V:21,W:22,X:23,Y:24,Z:25,2:26,3:27,4:28,5:29,6:30,7:31},s=[0,0,0,0,0,0,0,0],d=function(e,t){t.length>10&&(t="..."+t.substr(-10));var n=new Error("Decoded data is not valid UTF-8. Maybe try base32.decode.asBytes()? Partial data after reading "+e+" bytes: "+t+" <-");throw n.position=e,n},f=function(e){if(!/^[A-Z2-7=]+$/.test(e))throw new Error("Invalid base32 characters");for(var t,n,r,o,i,a,u,s,d=[],f=0,l=(e=e.replace(/=/g,"")).length,p=0,h=l>>3<<3;p<h;)t=c[e.charAt(p++)],n=c[e.charAt(p++)],r=c[e.charAt(p++)],o=c[e.charAt(p++)],i=c[e.charAt(p++)],a=c[e.charAt(p++)],u=c[e.charAt(p++)],s=c[e.charAt(p++)],d[f++]=255&(t<<3|n>>>2),d[f++]=255&(n<<6|r<<1|o>>>4),d[f++]=255&(o<<4|i>>>1),d[f++]=255&(i<<7|a<<2|u>>>3),d[f++]=255&(u<<5|s);var w=l-h;return 2===w?(t=c[e.charAt(p++)],n=c[e.charAt(p++)],d[f++]=255&(t<<3|n>>>2)):4===w?(t=c[e.charAt(p++)],n=c[e.charAt(p++)],r=c[e.charAt(p++)],o=c[e.charAt(p++)],d[f++]=255&(t<<3|n>>>2),d[f++]=255&(n<<6|r<<1|o>>>4)):5===w?(t=c[e.charAt(p++)],n=c[e.charAt(p++)],r=c[e.charAt(p++)],o=c[e.charAt(p++)],i=c[e.charAt(p++)],d[f++]=255&(t<<3|n>>>2),d[f++]=255&(n<<6|r<<1|o>>>4),d[f++]=255&(o<<4|i>>>1)):7===w&&(t=c[e.charAt(p++)],n=c[e.charAt(p++)],r=c[e.charAt(p++)],o=c[e.charAt(p++)],i=c[e.charAt(p++)],a=c[e.charAt(p++)],u=c[e.charAt(p++)],d[f++]=255&(t<<3|n>>>2),d[f++]=255&(n<<6|r<<1|o>>>4),d[f++]=255&(o<<4|i>>>1),d[f++]=255&(i<<7|a<<2|u>>>3)),d},l=function(e,t){if(!t)return function(e){for(var t,n,r="",o=e.length,i=0,a=0;i<o;)if((t=e[i++])<=127)r+=String.fromCharCode(t);else{t>191&&t<=223?(n=31&t,a=1):t<=239?(n=15&t,a=2):t<=247?(n=7&t,a=3):d(i,r);for(var u=0;u<a;++u)((t=e[i++])<128||t>191)&&d(i,r),n<<=6,n+=63&t;n>=55296&&n<=57343&&d(i,r),n>1114111&&d(i,r),n<=65535?r+=String.fromCharCode(n):(n-=65536,r+=String.fromCharCode(55296+(n>>10)),r+=String.fromCharCode(56320+(1023&n)))}return r}(f(e));if(!/^[A-Z2-7=]+$/.test(e))throw new Error("Invalid base32 characters");var n,r,o,i,a,u,s,l,p="",h=e.indexOf("=");-1===h&&(h=e.length);for(var w=0,m=h>>3<<3;w<m;)n=c[e.charAt(w++)],r=c[e.charAt(w++)],o=c[e.charAt(w++)],i=c[e.charAt(w++)],a=c[e.charAt(w++)],u=c[e.charAt(w++)],s=c[e.charAt(w++)],l=c[e.charAt(w++)],p+=String.fromCharCode(255&(n<<3|r>>>2))+String.fromCharCode(255&(r<<6|o<<1|i>>>4))+String.fromCharCode(255&(i<<4|a>>>1))+String.fromCharCode(255&(a<<7|u<<2|s>>>3))+String.fromCharCode(255&(s<<5|l));var v=h-m;return 2===v?(n=c[e.charAt(w++)],r=c[e.charAt(w++)],p+=String.fromCharCode(255&(n<<3|r>>>2))):4===v?(n=c[e.charAt(w++)],r=c[e.charAt(w++)],o=c[e.charAt(w++)],i=c[e.charAt(w++)],p+=String.fromCharCode(255&(n<<3|r>>>2))+String.fromCharCode(255&(r<<6|o<<1|i>>>4))):5===v?(n=c[e.charAt(w++)],r=c[e.charAt(w++)],o=c[e.charAt(w++)],i=c[e.charAt(w++)],a=c[e.charAt(w++)],p+=String.fromCharCode(255&(n<<3|r>>>2))+String.fromCharCode(255&(r<<6|o<<1|i>>>4))+String.fromCharCode(255&(i<<4|a>>>1))):7===v&&(n=c[e.charAt(w++)],r=c[e.charAt(w++)],o=c[e.charAt(w++)],i=c[e.charAt(w++)],a=c[e.charAt(w++)],u=c[e.charAt(w++)],s=c[e.charAt(w++)],p+=String.fromCharCode(255&(n<<3|r>>>2))+String.fromCharCode(255&(r<<6|o<<1|i>>>4))+String.fromCharCode(255&(i<<4|a>>>1))+String.fromCharCode(255&(a<<7|u<<2|s>>>3))),p},p={encode:function(e,t){var n="string"!=typeof e;return n&&e.constructor===ArrayBuffer&&(e=new Uint8Array(e)),n?function(e){for(var t,n,r,o,i,a="",c=e.length,s=0,d=5*parseInt(c/5);s<d;)t=e[s++],n=e[s++],r=e[s++],o=e[s++],i=e[s++],a+=u[t>>>3]+u[31&(t<<2|n>>>6)]+u[n>>>1&31]+u[31&(n<<4|r>>>4)]+u[31&(r<<1|o>>>7)]+u[o>>>2&31]+u[31&(o<<3|i>>>5)]+u[31&i];var f=c-d;return 1===f?(t=e[s],a+=u[t>>>3]+u[t<<2&31]+"======"):2===f?(t=e[s++],n=e[s],a+=u[t>>>3]+u[31&(t<<2|n>>>6)]+u[n>>>1&31]+u[n<<4&31]+"===="):3===f?(t=e[s++],n=e[s++],r=e[s],a+=u[t>>>3]+u[31&(t<<2|n>>>6)]+u[n>>>1&31]+u[31&(n<<4|r>>>4)]+u[r<<1&31]+"==="):4===f&&(t=e[s++],n=e[s++],r=e[s++],o=e[s],a+=u[t>>>3]+u[31&(t<<2|n>>>6)]+u[n>>>1&31]+u[31&(n<<4|r>>>4)]+u[31&(r<<1|o>>>7)]+u[o>>>2&31]+u[o<<3&31]+"="),a}(e):t?function(e){for(var t,n,r,o,i,a="",c=e.length,s=0,d=5*parseInt(c/5);s<d;)t=e.charCodeAt(s++),n=e.charCodeAt(s++),r=e.charCodeAt(s++),o=e.charCodeAt(s++),i=e.charCodeAt(s++),a+=u[t>>>3]+u[31&(t<<2|n>>>6)]+u[n>>>1&31]+u[31&(n<<4|r>>>4)]+u[31&(r<<1|o>>>7)]+u[o>>>2&31]+u[31&(o<<3|i>>>5)]+u[31&i];var f=c-d;return 1===f?(t=e.charCodeAt(s),a+=u[t>>>3]+u[t<<2&31]+"======"):2===f?(t=e.charCodeAt(s++),n=e.charCodeAt(s),a+=u[t>>>3]+u[31&(t<<2|n>>>6)]+u[n>>>1&31]+u[n<<4&31]+"===="):3===f?(t=e.charCodeAt(s++),n=e.charCodeAt(s++),r=e.charCodeAt(s),a+=u[t>>>3]+u[31&(t<<2|n>>>6)]+u[n>>>1&31]+u[31&(n<<4|r>>>4)]+u[r<<1&31]+"==="):4===f&&(t=e.charCodeAt(s++),n=e.charCodeAt(s++),r=e.charCodeAt(s++),o=e.charCodeAt(s),a+=u[t>>>3]+u[31&(t<<2|n>>>6)]+u[n>>>1&31]+u[31&(n<<4|r>>>4)]+u[31&(r<<1|o>>>7)]+u[o>>>2&31]+u[o<<3&31]+"="),a}(e):function(e){var t,n,r,o,i,a,c,d=!1,f="",l=0,p=0,h=e.length;do{for(s[0]=s[5],s[1]=s[6],s[2]=s[7],c=p;l<h&&c<5;++l)(a=e.charCodeAt(l))<128?s[c++]=a:a<2048?(s[c++]=192|a>>6,s[c++]=128|63&a):a<55296||a>=57344?(s[c++]=224|a>>12,s[c++]=128|a>>6&63,s[c++]=128|63&a):(a=65536+((1023&a)<<10|1023&e.charCodeAt(++l)),s[c++]=240|a>>18,s[c++]=128|a>>12&63,s[c++]=128|a>>6&63,s[c++]=128|63&a);p=c-5,l===h&&++l,l>h&&c<6&&(d=!0),t=s[0],c>4?(n=s[1],r=s[2],o=s[3],i=s[4],f+=u[t>>>3]+u[31&(t<<2|n>>>6)]+u[n>>>1&31]+u[31&(n<<4|r>>>4)]+u[31&(r<<1|o>>>7)]+u[o>>>2&31]+u[31&(o<<3|i>>>5)]+u[31&i]):1===c?f+=u[t>>>3]+u[t<<2&31]+"======":2===c?(n=s[1],f+=u[t>>>3]+u[31&(t<<2|n>>>6)]+u[n>>>1&31]+u[n<<4&31]+"===="):3===c?(n=s[1],r=s[2],f+=u[t>>>3]+u[31&(t<<2|n>>>6)]+u[n>>>1&31]+u[31&(n<<4|r>>>4)]+u[r<<1&31]+"==="):(n=s[1],r=s[2],o=s[3],f+=u[t>>>3]+u[31&(t<<2|n>>>6)]+u[n>>>1&31]+u[31&(n<<4|r>>>4)]+u[31&(r<<1|o>>>7)]+u[o>>>2&31]+u[o<<3&31]+"=")}while(!d);return f}(e)},decode:l};l.asBytes=f,i?e.exports=p:(o.base32=p,a&&(void 0===(t=function(){return p}.call(p,n,p,e))||(e.exports=t)))}()}).call(t,n(16)(e))},function(e,t){e.exports=function(e){return e.webpackPolyfill||(e.deprecate=function(){},e.paths=[],e.children||(e.children=[]),Object.defineProperty(e,"loaded",{enumerable:!0,get:function(){return e.l}}),Object.defineProperty(e,"id",{enumerable:!0,get:function(){return e.i}}),e.webpackPolyfill=1),e}},function(e,t){(function(t){e.exports=t}).call(t,{})},function(e,t,n){"use strict";var r=n(19);n.d(t,"script",function(){return r.a});var o=n(20);n.d(t,"react",function(){return o.a});var i=n(21);n.d(t,"vue",function(){return i.a});var a=n(22);n.d(t,"angular",function(){return a.a});var u=n(23);n.n(u),n.o(u,"angular2")&&n.d(t,"angular2",function(){return u.angular2}),n.o(u,"glimmer")&&n.d(t,"glimmer",function(){return u.glimmer});var c=n(24);n.d(t,"glimmer",function(){return c.a});var s=n(25);n.d(t,"angular2",function(){return s.a})},function(module,__webpack_exports__,__webpack_require__){"use strict";__webpack_require__.d(__webpack_exports__,"a",function(){return script});var script={global:function(){return window.document},register:function register(component,document){function render(element){if(element&&element.tagName&&"script"===element.tagName.toLowerCase()&&element.attributes.type&&"application/x-component"===element.attributes.type.value&&element.parentNode){var tag=element.getAttribute("data-component");if(tag&&tag===component.tag){component.log("instantiate_script_component");var props=element.innerText?eval("("+element.innerText+")"):{},container=document.createElement("div");if(!element.parentNode)throw new Error("Element has no parent");element.parentNode.replaceChild(container,element),component.render(props,container)}}}function scan(){for(var e=Array.prototype.slice.call(document.getElementsByTagName("script")),t=0,n=null==e?0:e.length;t<n;t++)render(e[t])}scan(),document.addEventListener("DOMContentLoaded",scan),window.addEventListener("load",scan),document.addEventListener("DOMNodeInserted",function(e){render(e.target)})}}},function(e,t,n){"use strict";n.d(t,"a",function(){return o});var r=n(3),o={global:function(){if(window.React&&window.ReactDOM)return{React:window.React,ReactDOM:window.ReactDOM}},register:function(e,t){var n=t.React,o=t.ReactDOM;return n.createClass?e.react=n.createClass({render:function(){return n.createElement("div",null)},componentDidMount:function(){e.log("instantiate_react_component");var t=o.findDOMNode(this),n=e.init(Object(r.p)({},this.props),null,t);this.setState({parent:n}),n.render(t)},componentDidUpdate:function(){this.state&&this.state.parent&&this.state.parent.updateProps(Object(r.p)({},this.props))},componentWillUnmount:function(){this.state&&this.state.parent&&this.state.parent.destroy()}}):e.react=function(t){function i(){return function(e,t){if(!(e instanceof i))throw new TypeError("Cannot call a class as a function")}(this),function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,t.apply(this,arguments))}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(i,t),i.prototype.render=function(){return n.createElement("div",null)},i.prototype.componentDidMount=function(){e.log("instantiate_react_component");var t=o.findDOMNode(this),n=e.init(Object(r.p)({},this.props),null,t);this.setState({parent:n}),n.render(t)},i.prototype.componentDidUpdate=function(){this.state&&this.state.parent&&this.state.parent.updateProps(Object(r.p)({},this.props))},i.prototype.componentWillUnmount=function(){this.state&&this.state.parent&&this.state.parent.destroy()},i}(n.Component),e.react}}},function(e,t,n){"use strict";n.d(t,"a",function(){return o});var r=n(3),o={global:function(){},register:function(e){return{render:function(e){return e("div")},inheritAttrs:!1,mounted:function(){var t=this.$el;this.parent=e.init(Object(r.p)({},this.$attrs),null,t),this.parent.render(t)},beforeUpdate:function(){this.parent&&this.$attrs&&this.parent.updateProps(Object(r.p)({},this.$attrs))}}}}},function(e,t,n){"use strict";n.d(t,"a",function(){return o});var r=n(3),o={global:function(){return window.angular},register:function(e,t){return t.module(e.tag,[]).directive(Object(r.h)(e.tag),function(){for(var t={},n=0,o=e.getPropNames(),i=null==o?0:o.length;n<i;n++){var a=o[n];t[a]="="}return e.looseProps&&(t.props="="),{scope:t,restrict:"E",controller:["$scope","$element",function(n,o){if(e.looseProps&&!n.props)throw new Error("For angular bindings to work, prop definitions must be passed to zoid.create");e.log("instantiate_angular_component");var i=function(){var e=void 0;if(n.props)e=n.props;else{e={};for(var o=0,i=Object.keys(t),a=null==i?0:i.length;o<a;o++){var u=i[o];void 0!==n[u]&&(e[u]=n[u])}}return Object(r.J)(e,{function:function(e){return function(){var t=e.apply(this,arguments);return function(){if("$apply"!==n.$root.$$phase&&"$digest"!==n.$root.$$phase)try{n.$apply()}catch(e){}}(),t}}})},a=e.init(i(),null,o[0]);a.render(o[0]),n.$watch(function(){a.updateProps(i())})}]}})}}},function(e,t){},function(e,t,n){"use strict";n.d(t,"a",function(){return o});var r=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},o={global:function(){},register:function(e,t){return function(t){function n(){return function(e,t){if(!(e instanceof n))throw new TypeError("Cannot call a class as a function")}(this),function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}(this,t.apply(this,arguments))}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}(n,t),n.prototype.didInsertElement=function(){e.render(r({},this.args),this.element)},n}(t)}}},function(e,t,n){"use strict";n.d(t,"a",function(){return i});var r=n(3),o=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},i={global:function(){},register:function(e,t){var n=t.Component,i=t.NgModule,a=t.ElementRef,u=t.NgZone;e.log("initializing angular2 component");var c=function(e){return Object(r.J)(o({},e.internalProps,e.props),{function:function(t){if("function"==typeof t)return function(){var n=this,r=arguments;return e.zone.run(function(){return t.apply(n,r)})}}})},s=n({selector:e.tag,template:"<div></div>",inputs:["props"]}).Class({constructor:[a,u,function(e,t){this.elementRef=e,this.zone=t}],ngOnInit:function(){var t=this.elementRef.nativeElement,n=e.init(c(this),null,t);n.render(t),this.parent=n},ngOnChanges:function(){this.parent&&this.parent.updateProps(c(this))}});return i({declarations:[s],exports:[s]}).Class({constructor:function(){}})}}},function(e,t){}])});

}).call(this)}).call(this,require('_process'),require("buffer").Buffer)
},{"_process":4,"buffer":2}],6:[function(require,module,exports){
"use strict";

var _zoidFrameMin = _interopRequireDefault(require("./node_modules/zoid/dist/zoid.frame.min.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const userAttributes = document.getElementById('springboard-script');
function webFormMarkup() {
  document.getElementById('springboard-modal').innerHTML = `
<style>
  /* zoid-container start */
  .zoid-button {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background: ` + userAttributes.dataset.buttonColor + `;
    border-radius: 0.25em;
    color: white;
    cursor: pointer;
    display: inline-block;
    font-weight: 500;
    height: 3em;
    line-height: 3em;
    padding: 0 1em;
  }
  .zoid-button:hover {
    background-color: ` + userAttributes.dataset.buttonColorHover + `;
  }
  .zoid-container {
    text-align: center;
    max-width: 40em;
    padding: 2em;
    margin-left: auto;
    margin-right: auto;
  }
  .zoid-container > h1 {
    font-weight: 700;
    font-size: 2rem;
    line-height: normal;
    color: #111827;
  }
  .zoid-container > p {
    margin-top: 2em;
    margin-bottom: 2em;
  }
  .zoid-container sup {
    font-size: 1rem;
    margin-left: 0.25em;
    opacity: 0.5;
    position: relative;
  }
  .zoid-logo {
    text-align: center;
    padding: 10px;
  }
  /* zoid-container end */
  /* modal start */
  .zoid-details-modal {
    background: #ffffff;
    border-radius: 0.5em;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    transform: translate(-50%, -50%);
    position: absolute;
    left: 50%;
    top: 50%;
    width: ` + userAttributes.dataset.modalWidth + `;
    pointer-events: none;
  }
  .zoid-details-modal-title {
    height: 70px;
  }
  .zoid-details-modal .zoid-details-modal-close {
    align-items: center;
    color: #111827;
    display: flex;
    height: 4.5em;
    justify-content: center;
    pointer-events: none;
    position: absolute;
    right: 0;
    top: 0;
    width: 4.5em;
  }
  .zoid-details-modal .zoid-details-modal-close svg {
    display: block;
  }
  .zoid-details-modal .zoid-details-modal-content {
    border-top: 1px solid #e0e0e0;
    padding: 2em;
    pointer-events: all;
    overflow: auto;
    max-height: 500px !important;
  }
  .zoid-details-modal-overlay {
    transition: opacity 0.2s ease-out;
    pointer-events: none;
    background: rgba(15, 23, 42, 0.8);
    position: fixed;
    opacity: 0;
    bottom: 0;
    right: 0;
    left: 0;
    top: 0;
  }
  details[open] .zoid-details-modal-overlay {
    pointer-events: all;
    opacity: 0.5;
  }
  details summary {
    list-style: none;
  }
  details summary:focus {
    outline: none;
  }
  details summary::-webkit-details-marker {
    display: none;
  }
  /* modal stop */
</style>
<!-- modal start -->
<div class="zoid-container">
  <details>
    <summary>
      <!-- button that triggers the modal to open -->
      <div class="zoid-button">` + userAttributes.dataset.buttonText + `</div>
      <!-- background overlay for when modal opens -->
      <div class="zoid-details-modal-overlay"></div>
    </summary>
    <div class="zoid-details-modal">
      <!-- closing button for modal -->
      <div class="zoid-details-modal-close">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M13.7071 1.70711C14.0976 1.31658 14.0976 0.683417 13.7071 0.292893C13.3166 -0.0976311 12.6834 -0.0976311 12.2929 0.292893L7 5.58579L1.70711 0.292893C1.31658 -0.0976311 0.683417 -0.0976311 0.292893 0.292893C-0.0976311 0.683417 -0.0976311 1.31658 0.292893 1.70711L5.58579 7L0.292893 12.2929C-0.0976311 12.6834 -0.0976311 13.3166 0.292893 13.7071C0.683417 14.0976 1.31658 14.0976 1.70711 13.7071L7 8.41421L12.2929 13.7071C12.6834 14.0976 13.3166 14.0976 13.7071 13.7071C14.0976 13.3166 14.0976 12.6834 13.7071 12.2929L8.41421 7L13.7071 1.70711Z" fill="black" />
        </svg>
      </div>
      <div class="zoid-details-modal-title">
        <!-- you can insert a custom 50px by 50px logo here -->
        <img src="` + userAttributes.dataset.modalLogo + `" alt="logo" class="zoid-logo">
      </div>
      <div class="zoid-details-modal-content">
        <!-- this is where the springboard iframe renders -->
        <div id="zoid-component"></div>
      </div>
    </div>
  </details>
</div>
<!-- modal end -->
`;
}
const springboard = _zoidFrameMin.default.create({
  tag: 'springboard-frame',
  url: userAttributes.dataset.formUrl,
  dimensions: {
    width: userAttributes.dataset.modalWidth,
    height: userAttributes.dataset.modalHeight
  }
});
const options = {};
const element = 'zoid-component';
window.onload = function () {
  webFormMarkup();
  springboard.render(options, element);
  setTimeout(() => {
    // https://github.com/krakenjs/zoid/issues/387
    document.getElementsByClassName('zoid-invisible')[0].style.opacity = '1';
  }, '1000');
};

},{"./node_modules/zoid/dist/zoid.frame.min.js":5}]},{},[6]);
