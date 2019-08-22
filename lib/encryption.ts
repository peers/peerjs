var crypto = require("crypto");
var eccrypto = require("eccrypto");
import logger from "./logger";


export class Encryption{
    static encryptString(value, publicKey){
        let buffer = Buffer.from(value, "hex");
        let publicKeyBufferFromHexEncoded = Buffer.from(publicKey, 'hex')

        return eccrypto.encrypt(publicKeyBufferFromHexEncoded, buffer)
            .then(function(encrypted){
                console.log("encrypt first then:-", encrypted)

                let encodedEncrypted = {}
                for (let key of Object.keys(encrypted)) {
                    encodedEncrypted[key] = encrypted[key].toString('hex')
                }
                let enryptedString = JSON.stringify(encodedEncrypted);
                return enryptedString;
            })
            .catch(function(error){
                logger.error("Asymmetric string encryption failed:- ", value, publicKey, error);
                return "false";
            })
    }
    
    static decryptString(value, privateKey){
        let valueObject = JSON.parse(value);
        let decodedEncrypted = {}
        for (let key of Object.keys(valueObject)) {
            decodedEncrypted[key] = Buffer.from(valueObject[key], 'hex');
        }
        let privateKeyBufferFromPrivateKeyHex = Buffer.from(privateKey, 'hex')
        return eccrypto.decrypt(privateKeyBufferFromPrivateKeyHex, decodedEncrypted).
            then(function(plaintext){
                let decryptedString = plaintext.toString("hex");
                return decryptedString;
            })
            .catch(function(error){
                logger.error("Asymmetric string decryption failed:-", value, privateKey, error);
            });
    }

    static encryptStringSymmetric(value, key){
        var cipher = crypto.createCipher('aes-256-ctr', key)
        var crypted = cipher.update(value, 'utf8', 'hex')
        crypted += cipher.final('hex');
        return crypted;
      }
       
    static decryptStringSymmetric(value, key){  
        var decipher = crypto.createDecipher('aes-256-ctr', key)
        var dec = decipher.update(value, 'hex', 'utf8')
        dec += decipher.final('utf8');
        return dec;
      }
}

// res = Encryption.encryptString('hello', '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCzgyfBU0IlLMn89sNuIemd5Ot9hdzEkx4HvJu4b5ByT1vwmFjrxb4WLI4zoU3iBuIEpmkHNK5GZmyvXUFnquySMx7TGwDAWZTHubfCwatsy9sj9UzA4KS+pdu8mlmZMWVXy8zgxXNWGkWltLkHCQiaz7dK5j+yK6H2cl3H8kucpwIDAQAB\n-----END PUBLIC KEY-----')

// res1 = Encryption.decryptString(res, '-----BEGIN RSA PRIVATE KEY-----\nMIICWwIBAAKBgQCzgyfBU0IlLMn89sNuIemd5Ot9hdzEkx4HvJu4b5ByT1vwmFjrxb4WLI4zoU3iBuIEpmkHNK5GZmyvXUFnquySMx7TGwDAWZTHubfCwatsy9sj9UzA4KS+pdu8mlmZMWVXy8zgxXNWGkWltLkHCQiaz7dK5j+yK6H2cl3H8kucpwIDAQABAoGAco1GaELWGdzsBIX/jh8L8lsrv00V5UcwSaWdBWQEHD3yIKVHUSU9uO6zy9SqW4si3e7HZPbEI16nCn0LCLl0/oDDYS4QQ9Z+Q9ihiv76IOD1AAyt9bw+M2fuvtsnxqbuw+lU6EhJi5wQk8t9di/3OF6/R+5UTXEfVu0T/An/y7ECQQDgwo+1xhz4dJepfqrC0A7l+JaKSOdbQbEJVRV8jaQBsRo4y3D3Y1kaTxGaoOtTVa6I+OtxoXck8M5676VeCNEJAkEAzHaV10KxyMu/gtxgU/xFEcHbvgtudTJH1J7zG24VD9cKjWltnlExevnqXo9EmPzGUwZw8+KZ351j2uMTgJ5cLwJAVzusQ0StIdE+u84pwIq3/ZHJ+8nn4YdRium2+SyQJwfxwXFUWu/4OTnO/1DNhP6QSyExYFzmvTOpMBWq/SA24QJADuwMrYQpk30DQhqxUQ/VPqGGVw1gh18fDO540aSsFtbb50wteuN0GASLTVFpcTzpgH+02KfOERrcgcoWz0k/cwJAF8OlnEAKokZvMhS1HbtbDNTuc0zRJx2okl9MNDnw/mPO9Ll8+oXGfBoFa9R0d17uZGysUMXuwAKH0YiCE1XL3g==\n-----END RSA PRIVATE KEY-----')