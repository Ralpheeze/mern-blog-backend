const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');

// ----Start of RegisterPage Connection---
const salt = bcrypt.genSaltSync(10);

app.use(express.json());

const secret = 'weefwecewcace';
app.use(cors({credentials:true, origin: 'http://localhost:3000'}));

app.use('/uploads', express.static(__dirname + '/uploads'));

mongoose.connect('mongodb+srv://admin:Nwachukwu12@mern-blog.pt8cymf.mongodb.net/?retryWrites=true&w=majority');

app.post('/register', async (req, res) => {
    const {username, password} = req.body;
    try {
        const userDoc = await User.create({
            username, 
            password:bcrypt.hashSync(password, salt),
        });
        res.json(userDoc); 
    }
    catch(e) {
        res.status(400).json(e);
        // res.status(400).send({error: 'Username already exists'});
    }
       
});
// MongoServerError: E11000 duplicate key error collection: 
//test.users index: username_1 dup key: { username: "book" }
//This means that the usernames inputted everytime must be unique.
//OR
//DeprecationWarning: Unhandled promise rejections are 
//deprecated. In the futture, promise rejections that are not
// handled will terminate the Node.js process with a non-zero
// exit code.

//Error: Invalid salt version: kn .... at _hash 
//This means the salt generatotr must be used.

// ----End of RegisterPage Connection---


// ----Start of LoginPage Connection---

app.post('/login', async (req, res) => {
    const {username, password} = req.body;
    const userDoc = await User.findOne({username});
    const passOk = bcrypt.compareSync(password, userDoc.password);
    // res.json(passOk); and res.json(userDoc); are used to 
    //check the if the error status is clean
    if(passOk) {
        //logged in
        jwt.sign({username, id:userDoc._id}, secret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token).json({
                id:userDoc._id,
                username,
            });
            //These cookies are used to collect information (non-personal information) about how visitors use the React website.
        });

        //The payload will contain data pertaining to the 
        //request and the user making it.  It's basically a 
        //key in your action which stores the data you want 
        //to pass around.The optional payload property MAY be
        // any type of value. It represents the payload of 
        //the action. Any information about the action that 
        //is not the type or status of the action should be 
        //part of the payload field. By convention, if error 
        //is true, the payload SHOULD be an error object.
    }
    else {
        res.status(400).json('wrong credentials');
    }
});
// ----End of LoginPage Connection---


// ---- Start of Code to check if we are logged in and to check if our token is valid ---
app.use(cookieParser()); //a middle ware with a cookie parser
app.get('/profile', (req, res) => {
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, (err, info) => {
        if(err) throw err;
        res.json(info);
    })
    // res.json(req.cookies);
});

app.post('/logout', (req, res) => {
    res.cookie('token', '').json('ok');
})

// ---- End of Code to check if we are logged in and to check if our token is valid ---


//---- Start of endpoint for CreatePost Connection----
app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
    // res.json({files:req.file}); This tests if the file 
    //has propeties in the preview

    const {originalname, path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path + '.' + ext;
    fs.renameSync(path, newPath);

    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if(err) throw err;
        const {title, summary, content} = req.body
        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover: newPath,
            author:info.id,
        });
        res.json(postDoc);
    });

});

//---- End of endpoint for CreatePost Connection----


//---- Start of endpoint for get request for post Connection----
app.get('/post', async (req, res) => {
    res.json(
        await Post.find()
        .populate('author', ['username'])  //We dont need to show the password in the response.
        .sort({createdAt: -1})  //Makes sure the current post appears first on the page.
        .limit(20)  // limit this data up to 20 per page only.   
    );  
});
//---- End of endpoint for get request for post Connection----



// ---Start of endpoint for get request for /post/:id connection ----


// ---Start of endpoint for get request for /post/:id connection ----
app.get('/post/:id', async (req, res) => {
    // res.json(req.params); To test if the connection is good to work on
    const {id} = req.params;
    const postDoc = await Post.findById(id).populate('author', ['username']);
    res.json(postDoc);
});

// ---End of endpoint for get request for /post/:id connection ----

app.listen(4000); 
// or app.listen(3001, '0.0.0.0'); for all interfaces
// app.on('listening', function() {
//     console.log('Express app started on port %s at %s', app.address().port, app.address().address);
// });

//nodemon restarts the app automatically



