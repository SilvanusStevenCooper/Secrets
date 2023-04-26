
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// require sessino
const session = require('express-session');
// require passport
const passport = require("passport");
// requiring passport-local-mongoose
const passportLocalMongoose = require("passport-local-mongoose");
// google strategy
const GoogleStrategy = require("passport-google-oauth20").Strategy;
// facebook strategy
const FacebookStrategy = require("passport-facebook");
// findOrCreate functionality
const findOrCreate = require("mongoose-findorcreate");





const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended: true}));

// setting up app to use section
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
  }));
// initializing passport to be use with app
  app.use(passport.initialize());
// setting passport to use session to be used by app
  app.use(passport.session());

  

mongoose.connect("mongodb://127.0.0.1:27017/userDB")

// defining a schema
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
});

// plugging passport-local strategy for mpongoose into the schema
userSchema.plugin(passportLocalMongoose);
// findOrCreate plugin
userSchema.plugin(findOrCreate);
// creating a model (more like a table in sql)
const User = mongoose.model("User", userSchema);

// setting passport to use passport-local strategy(configuring passport-local-mongoose)
passport.use(User.createStrategy());

// creating a session that stores user's activities across the app
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  // identifies a user and retrives user data from previous session 
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

// does the same as the above two blocks of code
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// google strategy configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// facebook strategy configuration
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
  


app.get("/", function(req, res){
    res.render("home")
});

// google authentication route
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

// call back route when a user is authenticated using google. performs local authentication and create session
app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

  // facebook authentication route
  app.get("/auth/facebook",
  passport.authenticate("facebook"));

app.get("/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/login", function(req, res){
    res.render("login")
});

app.get("/register", function(req, res){
    res.render("register")
});

// content page
app.get("/secrets", function(req, res){
   User.find({})
   .then(foundUser => {
    if(foundUser){
        res.render("secrets", {usersWithSecret: foundUser});
    }
})
.catch(err => {
    console.log(err);
});
});

// submit route for inputing secrets
app.get("/submit", function(req, res){
    // checks to see if user is authenticated then renders the "SUBMIT" input form to collect data from user
    // if the user is not authenticated they are refer to the login/register page
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});

// submit route for collecting secret inputted by user and saving to database
app.post("/submit", function(req, res){

    // collects the data inputted by user and finds the user who inputted the data and save the data in their path
    // within the db and redirects them to the "SECRETS" page where it is display
    const submittedSecret = req.body.secret;
    User.findById(req.user.id)
    .then(foundUser => {
        if(foundUser){
            foundUser.secret = submittedSecret;
            foundUser.save();
            res.redirect("/secrets")
        }
    })
    .catch(err => {
        console.log(err);
    });
});


// logging out users
app.get("/logout", function(req, res) {
    req.logout(function(err){
        if(err){
            console.log(err);
        }
    });
    res.redirect("/");
  });
  
// register route for registuring users. local strategy
app.post("/register", function(req, res){
    // collects user's info and save in the database redirects them to "SECRETS" page
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
            
        
    })
    
});

// logging in users -- local strategy
app.post("/login", function(req, res) {
    const user = new User({
      username: req.body.username,
      password: req.body.password
    });
    req.login(user, function(err) {
      if (err) {
        console.log(err);
        res.redirect("/login");
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/secrets");
        });
      }
    });
  });
  



app.listen(3000, function(){
    console.log("Server is started at port 3000");
})