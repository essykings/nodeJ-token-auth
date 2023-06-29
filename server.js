// Required Modules
const express    = require("express");
const morgan     = require("morgan");
const bodyParser = require("body-parser");
const jwt        = require("jsonwebtoken");
const mongoose   = require("mongoose");
const app        = express();

const port = process.env.PORT || 3001;
const User     = require('./models/User');

// Connect to DB  


mongoose.connect(process.env.MONGO_URL);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});






app.post('/authenticate', async function(req, res) {
    try {
      const user = await User.findOne({ email: req.body.email, password: req.body.password }).exec();
      if (user) {
        res.json({
          type: true,
          data: user,
          token: user.token
        });
      } else {
        res.json({
          type: false,
          data: "Incorrect email/password"
        });
      }
    } catch (err) {
      res.json({
        type: false,
        data: "Error occurred: " + err
      });
    }
  });


app.post('/signin', async function(req, res) {
    try {
      const existingUser = await User.findOne({ email: req.body.email }).exec();
      if (existingUser) {
        res.json({
          type: false,
          data: "User already exists!"
        });
      } else {
        const userModel = new User();
        userModel.email = req.body.email;
        userModel.password = req.body.password;
        const savedUser = await userModel.save();
        savedUser.token = jwt.sign(savedUser.toObject(), JWT_SECRET);
        const updatedUser = await savedUser.save();
        res.json({
          type: true,
          data: updatedUser,
          token: updatedUser.token
        });
      }
    } catch (err) {
      res.json({
        type: false,
        data: "Error occurred: " + err
      });
    }
  });
  
app.get('/me', ensureAuthorized, async function(req, res) {
    try {
      const user = await User.findOne({ token: req.token }).exec();
      res.json({
        type: true,
        data: user
      });
    } catch (err) {
      res.json({
        type: false,
        data: "Error occurred: " + err
      });
    }
  });
  
  
  
  
function ensureAuthorized(req, res, next) {
    var bearerToken;
    var bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
        var bearer = bearerHeader.split(" ");
        bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.send(403);
    }
}

process.on('uncaughtException', function(err) {
    console.log(err);
});

// Start Server
app.listen(port, function () {
    console.log( "Express server listening on port " + port);
});