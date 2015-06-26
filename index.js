'use strict';
var aes = require('browserify-aes');
var hmacStream = require('hmac-stream');
var duplexify = require('duplexify');
var HeaderStream = require('headerstream');
var randomBytes = require('randombytes');
var PassThrough = require('readable-stream').PassThrough;
var createHash = require('create-hash');
var ZEROBUF = new Buffer(32);
ZEROBUF.fill(0);
exports.encrypt = encrypt;

function encrypt(key) {
  var iv = randomBytes(16);
  var readableStream = new PassThrough();
  var writableStream = getCipher(key, iv);
  var hmac = new hmacStream.Authenticate(writableStream.update(ZEROBUF), iv);
  readableStream.write(iv);
  writableStream.pipe(hmac).pipe(readableStream);
  return duplexify(writableStream, readableStream);
}
exports.decrypt = decrypt;

function decrypt(key) {
  var dup = duplexify();
  var writableStream = new HeaderStream(16, function (err, iv) {
    if (err) {
      return dup.emit('error', err);
    }
    var readableStream = getCipher(key, iv);
    var hmac = new hmacStream.Verify(readableStream.update(ZEROBUF), iv);

    writableStream.pipe(hmac).on('error', function (e) {
      readableStream.emit('error', e);
    }).pipe(readableStream);
    dup.setReadable(readableStream);
  });
  dup.setWritable(writableStream);
  return dup;
}


function getCipher(key, iv) {
  if (key.length < 8) {
    throw new Error('key is way too small');
  }
  switch (key.length) {
    case 16:
      return aes.createCipheriv('aes-128-ctr', key, iv);
    case 24:
      return aes.createCipheriv('aes-192-ctr', key, iv);
    case 32:
      return aes.createCipheriv('aes-256-ctr', key, iv);
    default:
      return aes.createCipheriv('aes-256-ctr', createHash('sha256').update(key).digest(), iv);
  }
}
