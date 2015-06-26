'use strict';
var cryptoStream = require('./');
var test = require('tape');
var Transform = require('readable-stream').Transform;
var randomBytes = require('randombytes');

function run(length, chunks, keyLen) {
  test('simple run with ' + chunks + ' chunks of length ' + length + ' with keys of length ' + keyLen, function (t) {
    var inData = [];
    var interData = [];
    var outData = [];
    var key = randomBytes(keyLen);
    var encrypt = cryptoStream.encrypt(key);
    var decrypt = cryptoStream.decrypt(key);
    encrypt.pipe(new Transform({
      transform: function (chunk, _, next) {
        interData.push(chunk.toString('base64'));
        this.push(chunk);
        next();
      }
    })).pipe(decrypt);
    var i = 0;
    function pushChunk(done) {
      var chunk = randomBytes(length);
      inData.push(chunk.toString('base64'));
      encrypt.write(chunk, function (err) {
        i++;
        t.error(err, 'no error on write ' + i);
        if ((done + 1) === chunks) {
          encrypt.end();
        } else {
          process.nextTick(function () {
            pushChunk(done + 1);
          });
        }
      });
    }
    pushChunk(0);
    decrypt.on('data', function (d) {
      outData.push(d.toString('base64'));
    }).on('end', function () {
      var inStr = inData.join('');
      var outStr = outData.join('');
      var interStr = interData.join('');
      t.equal(inData.join(''), outData.join(''), 'strings are equals');
      t.notEqual(inStr, interStr, 'encrypted is not the same as input');
      t.notEqual(outStr, interStr, 'encrypted is not the same as output');
      t.end();
    });
  });
}
function modify(which) {
  var length = 256;
  var chunks = 8;
  var keyLen = 32;
  test('modify chunk ' + which, function (t) {
    t.plan(1);
    var key = randomBytes(keyLen);
    var encrypt = cryptoStream.encrypt(key);
    var decrypt = cryptoStream.decrypt(key);
    var sofar = 0;
    encrypt.pipe(new Transform({
      transform: function (chunk, _, next) {
        if (sofar++ === which) {
          chunk[0] ^= 1;
        }
        this.push(chunk);
        next();
      }
    })).pipe(decrypt);
    var i = 0;
    function pushChunk(done) {
      var chunk = randomBytes(length);
      encrypt.write(chunk, function (err) {
        if (err) {
          t.notOk(err, err.stack || err);
        }
        i++;
        if ((done + 1) === chunks) {
          encrypt.end();
        } else {
          process.nextTick(function () {
            pushChunk(done + 1);
          });
        }
      });
    }

    decrypt.on('error', function (err) {
      t.ok(err, 'got error');
    });
    pushChunk(0);
  });
  test('omit chunk ' + which, function (t) {
    t.plan(1);
    var key = randomBytes(keyLen);
    var encrypt = cryptoStream.encrypt(key);
    var decrypt = cryptoStream.decrypt(key);
    var sofar = 0;
    encrypt.pipe(new Transform({
      transform: function (chunk, _, next) {
        if (sofar++ === which) {
          return next();
        }
        this.push(chunk);
        next();
      }
    })).pipe(decrypt);
    var i = 0;
    function pushChunk(done) {
      var chunk = randomBytes(length);
      encrypt.write(chunk, function (err) {
        if (err) {
          t.notOk(err, err.stack || err);
        }
        i++;
        if ((done + 1) === chunks) {
          encrypt.end();
        } else {
          process.nextTick(function () {
            pushChunk(done + 1);
          });
        }
      });
    }

    decrypt.on('error', function (err) {
      t.ok(err, 'got error');
    });
    pushChunk(0);
  });
  test('double chunk ' + which, function (t) {
    t.plan(1);
    var key = randomBytes(keyLen);
    var encrypt = cryptoStream.encrypt(key);
    var decrypt = cryptoStream.decrypt(key);
    var sofar = 0;
    encrypt.pipe(new Transform({
      transform: function (chunk, _, next) {
        if (sofar++ === which) {
          this.push(chunk);
        }
        this.push(chunk);
        next();
      }
    })).pipe(decrypt);
    var i = 0;
    function pushChunk(done) {
      var chunk = randomBytes(length);
      encrypt.write(chunk, function (err) {
        if (err) {
          t.notOk(err, err.stack || err);
        }
        i++;
        if ((done + 1) === chunks) {
          encrypt.end();
        } else {
          process.nextTick(function () {
            pushChunk(done + 1);
          });
        }
      });
    }

    decrypt.on('error', function (err) {
      t.ok(err, 'got error');
    });
    pushChunk(0);
  });
  test('extra chunk before ' + which, function (t) {
    t.plan(1);
    var extra = new Buffer(3);
    var key = randomBytes(keyLen);
    var encrypt = cryptoStream.encrypt(key);
    var decrypt = cryptoStream.decrypt(key);
    var sofar = 0;
    encrypt.pipe(new Transform({
      transform: function (chunk, _, next) {
        if (sofar++ === which) {
          this.push(extra);
        }
        this.push(chunk);
        next();
      }
    })).pipe(decrypt);
    var i = 0;
    function pushChunk(done) {
      var chunk = randomBytes(length);
      encrypt.write(chunk, function (err) {
        if (err) {
          t.notOk(err, err.stack || err);
        }
        i++;
        if ((done + 1) === chunks) {
          encrypt.end();
        } else {
          process.nextTick(function () {
            pushChunk(done + 1);
          });
        }
      });
    }

    decrypt.on('error', function (err) {
      t.ok(err, 'got error');
    });
    pushChunk(0);
  });
}
var i = 0;
var len, kl;
while (++i <= 4) {
  len = 0;
  while (len <= 16) {
    kl = 8;
    while (kl <= 64) {
      run(1 << len, i * 4, kl);
      kl += 4;
    }
    len += 4;
  }
}

var chunk = -1;

while (++chunk < 36) {
  modify(chunk);
}
