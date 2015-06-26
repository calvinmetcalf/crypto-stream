crypto stream
===

```bash
npm install --save crypto-stream
```

Streaming authenticated encryption, exports 2 functions `encrypt` and `decrypt`,
both of which take a single argument being a buffer for the key.

```js
var cryptoStream = require('crypto-stream');

var encrypter = cryptoStream.encrypt(getKeySomehow());

var decrypter = cryptoStream.decrypt(getKeySomehow());
```

How it works
===

Data is encrypted with AES in CTR mode. Key size is picked according to the size
of the key you pass in. If the key is 16 bytes, 24 bytes, or 32 bytes it just
picks the appropriate version of AES, if the key is some other size (and larger
than 8 bytes) then the buffer is passed through sha256 and AES-256 is used. If
it's smaller then 8 bytes an error is thrown because your key is too small.

When encrypting a 16 byte random salt is generated and passed at the beginning
of the stream. When decrypting, this salt is extracted automatically.

A zeroed out buffer is encrypted and used as the key for an
[hmac-stream](https://github.com/calvinmetcalf/hmac-stream).  Which the encrypted
data is passed through and then is authenticated with before decryption.
