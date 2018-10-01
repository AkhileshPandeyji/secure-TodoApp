const {SHA256,MD5} = require('crypto-js');
const jwt = require('jsonwebtoken');
//encryption is performed only on string
//to apply it to the object we use JSON.stringify()
//sha256 encryption
var message1 = 'I am the user 1';
var hash1 = SHA256(message1).toString();
console.log(`Message : ${message1}`);
console.log(`SHA256 Hash : ${hash1}`);
//md5 encryption
var message2 = 'I am the user 2';
var hash2 = MD5(message2).toString();
console.log(`Message : ${message2}`);
console.log(`MD5 Hash : ${hash2}`);
//jsonwebtoken -jwt
//jwt.sign()
//jwt.verify()

//abstract data
var data ={
  id : 10
}
//hashing the token from the client
var primarytoken = {
  data,
  hash: SHA256(JSON.stringify(data)).toString()
}
//salted token
var saltedToken = {
  data,
  hash:SHA256(JSON.stringify(data)+"secretData").toString()
}
//procedure for verification from server
primarytoken.data.id = 5;
var clienthash = SHA256(JSON.stringify(primarytoken.data)+"1").toString();//altered hash/token
var serverhash = SHA256(JSON.stringify(primarytoken.data)).toString();
if(clienthash === serverhash){
  console.log('proceed');
}
else{
  console.log('reject');
}

//jwt hashing or tokenizing from client
var token = jwt.sign(data,'secretData');
//jwt decoding or detokenizing from server
var decode = jwt.verify(token,'secretData');
console.log(token);
console.log(decode);
//jwt hashing or encryption or tokenizing
//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 - header-ALGORITHM & TOKEN TYPE{
//   "alg": "HS256",
//   "typ": "JWT"
// }
//.eyJpZCI6NSwiaWF0IjoxNTM4MzMwMTQ3fQ - payload-DATA-{
//   "id": 5,
//   "iat": 1538330147
// }
//.UhjMDoNvQ8xteXooRfMuqfs3_f7I5ctXJa4kon7NklE- signature-actual hashing
// HMACSHA256(
//   base64UrlEncode(header) + "." +
//   base64UrlEncode(payload),
//
// your-256-bit-secret
//
// )
//procedure for verification from server
if(decode.id === data.id)
{
  console.log('Data is not changed');
}
else{
  console.log("Data is changed don't trust");
}

//www.jwt.io
