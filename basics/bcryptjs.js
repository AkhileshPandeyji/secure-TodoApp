const bcrypt = require('bcryptjs');

var password = '123abcABC';
var hashedpass = '$2a$10$Yo.O6aVI4N9JLluuCDbHHOMx89rVZ0hV4ltly7WNpnZceXx2YMvUu';
//asynchronous function
bcrypt.genSalt(10,(err,salt)=>{
  bcrypt.hash(password,salt,(err,hash)=>{
    console.log(hash);
  });
});
//synchronous function
bcrypt.compare(password,hashedpass,(err,res)=>{
  console.log(res);
});
