//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// requiring bcrypt and setting salt count
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://127.0.0.1:27017/userDB")

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});




const User = mongoose.model("User", userSchema);

app.get("/", function(req, res){
    res.render("home")
});

app.get("/login", function(req, res){
    res.render("login")
});

app.get("/register", function(req, res){
    res.render("register")
});

app.post("/register", function(req, res){
    // using bcrypt to salt and hash a password
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const user = new User({
            email: req.body.userEmail,
            password: hash
        });
        user.save()
        .then(() => {
            res.render("secrets");
        })
        .catch(err => {
            console.log(err)
        })
    });
    
});

app.post("/login", function(req, res) {
    const userEmail = req.body.userEmail;
    const password = req.body.password;
  
    User.findOne({ email: userEmail })
      .then(user => {
        if (user) {
            // using bcrypt to compare passwords and login a user
          bcrypt.compare(password, user.password, function(err, result) {
            if (result === true) {
              res.render("secrets");
            } else {
              res.send("Incorrect password");
            }
          });
        } else {
          res.send("Account does not exist. Create an account to login");
        }
      })
      .catch(err => {
        console.log(err);
        res.send("An error occurred");
      });
  });
  

















app.listen(3000, function(){
    console.log("Server is started at port 3000");
})