const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
//mongoose.Schema() is a replacement for the mongoose.model() but it gives us the flexibility
//to add instance methods.
//it takes in the argument only the model.{object fields:{validators}}.
var UserSchema = new mongoose.Schema({
  email:{
    type : String,
    required : true,
    minlength : 1,
    maxlength : 50,
    unique : true,
    trim : true,
    validate:{
      validator : (value)=>{
        return validator.isEmail(value);
      },
      message : '{VALUE} is not a valid e-mail.'
    }
  },
  password:{
    type : String ,
    default:'123abc',
    required:true,
    minlength:6
  },
  tokens:[{
    access:{
      type:String,
      required:true
    },
    token:{
      type:String,
      required:true
    }
  }]
});
//UserSchema.methods/new mongoose.Schema().methods is an object that stores
//all the instance methods of the Mongoose model.

//we have used function here to specify that ()=>{} does not support the this keyword.
UserSchema.methods.generateAuthToken = function(){
  var user = this;
  var access = 'auth';
  var token = jwt.sign({_id: user._id.toHexString(),access},'123abc').toString();
  user.tokens.push({access,token});
  //here in order to chain then promise we return promise and the token value as response.
  return user.save().then(()=>{
    return token;
  });
};
//UserSchema.methods.toJSON is a built in mongoose function which is overidden.
UserSchema.methods.toJSON = function(){
  var user = this;
  var body = _.pick(user,['email','_id']);
  return body;
};
UserSchema.methods.deleteToken = function(token){
  var user = this;
  return user.update({$pull:{
    tokens:{token}
  }});
};
//the model methods are defined using the UserSchema.statics used on the model
UserSchema.statics.findByToken = function(token){
  var User = this;
  //we will verify the token and then make changes acc to that
  try{
    var decoded = jwt.verify(token,'123abc');
  }
  //if some error in verification then pass a rejected promise
  catch(e){
    return new Promise((resolve,reject)=>{
      reject();
    })
  }
  //in order to put a query for the wrraped fields inside the model we use 'tokens.token'
  return User.findOne({
    '_id' : decoded._id,
    'tokens.access' : 'auth',
    'tokens.token': token
  }).then((user)=>{
    return user;
  });
};
//one more model method for the login request
UserSchema.statics.findByCredentials = function (email,password){
 var User = this;
  return User.findOne({email}).then((user)=>{
    if(!user){
    return new Promise.reject();
    }
    return new Promise((resolve,reject)=>{
    bcrypt.compare(password,user.password,(err,res)=>{
      if(res){
        resolve(user);
      }
      else{
        reject();
      }
    });
    });
    });
  }
UserSchema.pre('save',function(next){
  var user = this;
  if(user.isModified('password')){
    bcrypt.genSalt(10,(err,salt)=>{
      bcrypt.hash(user.password,salt,(err,hash)=>{
        user.password = hash;
        next();
            });
    });
  }
  else{
    next();
  }
});



var User = mongoose.model('User',UserSchema);
module.exports={User};
