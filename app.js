//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// md5 encryption
const md5 = require("md5");

// mongoose encryption
// const encrypt = require("mongoose-encryption");

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://127.0.0.1:27017/userDB")

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


// using mongoose encryption on  schema type and setting it to a specific field
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

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
    const user = new User({
        email: req.body.userEmail,
        //md5 encrypted
        password: md5(req.body.password)
    });
    user.save()
    .then(user => {
        res.render("secrets");
    })
    .catch(err => {
        console.log(err)
    })
});

app.post("/login", function(req, res){
    const userEmail = req.body.userEmail;
    // md5 encrypted
    const password = md5(req.body.password);

    User.findOne({email: userEmail})
    .then(user => {
        if (user.password === password){
            res.render("secrets");
        }else{
            res.send("Account does not exist. Create an account to login")
        }
    })
    .catch(err => {
        console.log(err);
    })
})

















app.listen(3000, function(){
    console.log("Server is started at port 3000");
})