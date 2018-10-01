const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

const {mongoose} = require('./mongoose-connection/mongoose.js');
const {Todo} = require('./models/todos.js');
const {User} = require('./models/users.js');

var app = express();
//express middleware
app.use(bodyParser.json());
app.post('/todos',(req,res)=>{
  var newtodo = new Todo({
    text : req.body.text
  });
  newtodo.save().then((result)=>{
    res.status(200).send(result);
  },(error)=>{
    res.status(404).send(error);
    console.log('could not write to the database');
  });
});
app.get('/todos',(req,res)=>{
  Todo.find().then((todos)=>{
    //this will be array so for addons we require object
    res.status(200).send({todos});
  },(error)=>{
    res.status(400).send(error);
  });
});
//GET/todos/12345
//req.params is an object that contains the key value pairs
//key=>/todos/:id url get variable and the value that is actually passed.
//key =>id and value=>12345
app.get('/todos/:id',(req,res)=>{
  var id = req.params.id;
  if(!ObjectID.isValid(id)){
    return res.status(404).send();
  }
  Todo.findById(id).then((result)=>{
    if(!result){
    return  res.status(404).send();
    }
    res.status(200).send(result);
  },(error)=>{
    res.status(400).send();
  })
});
app.delete('/todos/:id',(req,res)=>{
  var id = req.params.id;
  if(!ObjectID.isValid(id)){
    return res.status(404).send();
  }
  Todo.findByIdAndRemove(id).then((result)=>{
    if(!result){
      res.status(404).send();
    }
    res.status(200).send(result);
  }).catch((e)=>res.status(400).send());
});
app.patch('/todos/:id',(req,res)=>{
  var id = req.params.id;
  //_.pick(1,2);
  //1.object from which you want to extract the properties.
  //2.the array that contains the list of the properties that we want to extract.

  if(!ObjectID.isValid(id)){
    return res.status(404).send();
    }
    //console.log(req.body);
    var body = _.pick(req.body,['text','completed']);
    if(_.isBoolean(body.completed) && body.completed){
      body.completedAt = new Date().getTime();
    }
    else{
      body.completed = false;
      body.completedAt = null;
    }
    //console.log(Todo);
    //if we use $set:body it updates the entire model document body
  Todo.findOneAndUpdate({_id:id},{$set:body},{new :true}).then((result)=>{
    if(!result){
      return res.status(404).send();
      }

    res.status(200).send(result);
  }).catch((e)=>res.status(400).send());
});
//we have two methods for adding the tokens that we would
//generate to the logged or signed up user.
//model method- User.generateAuthToken()-for entire model
//instance method - user.generateAuthToken()-for the specific user document
app.post('/users',(req,res)=>{
  var body = _.pick(req.body,['email','password']);
  var newuser = new User(body);
  newuser.save().then((result)=>{
  //wrong  // if(!result){
    //   return res.status(400).send();
    // }
    // //res.status(200).send(result);
    //we will not use the result because it isnt updated
    return newuser.generateAuthToken();
  }).then((token)=>{
    //header is a property of response that takes in  2 args i.e.'x-auth'-custom header
    //not supported by http by default. and value.
    res.header('x-auth',token).send(newuser);
  }).catch((e)=>res.status(400).send(e));
});
//express middleware
var authenticate = (req,res,next)=>{
  var token = req.header('x-auth');
  User.findByToken(token).then((user)=>{
    if(!user){
      return  Promise().reject();
    }
    req.user = user;
    req.token = token;
    next();
  }).catch((e)=>{
    res.status(401).send();
    next();
  });
}
//authentication private route
//here we can add the express middleware onto the routes directly in the second argument.
app.get('/users/me',authenticate,(req,res)=>{
  res.status(200).send(req.user);
  //console.log(req.body);
});
//login route /users/login {email,password}
// app.post('/users/login',(req,res) => {
//   var body = _.pick(req.body,['email','password']);
//   var email = body.email;
// //  console.log(email);
//   var password = body.password;
// //  console.log(password);
//   User.findOne({email}).then((user)=>{
//     bcrypt.compare(password,user.password,(err,result)=>{
//       if(result){
//       return  res.status(200).send(user);
//       }
//       res.status(404).send('<h1>404 Not Found</h1><br><p>The requested resource could not be found but may be available again in the future. Subsequent requests by the client are permissible.</p>');
//     });
//   }).catch((e)=>{
//     res.status(400).send('<h1>400 Bad Request</h1><br><p>The request cannot be fulfilled due to bad syntax.</p>');
//   });
//   });
app.post('/users/login',(req,res)=>{
var body = _.pick(req.body,['email','password']);
User.findByCredentials(body.email,body.password).then((user)=>{

 return user.generateAuthToken().then((token)=>{
   res.status(200).header('x-auth',token).send(user);
 });
}).catch((e)=>{
res.status(404).send();
});
});
app.delete('/users/me/token',authenticate,(req,res)=>{
  var user = req.user;
  console.log(req.user);
  user.deleteToken(req.token).then(()=>{
    res.status(200).send();
  },()=>{
    res.status(400).send();
  });
});
app.listen(3000,()=>{
  console.log('Server is running on port 3000');
});
