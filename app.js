const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');

//Schema imported
const User = require('./models/User');

//connection to the db
mongoose.connect("mongodb://localhost:27017/test",{ useNewUrlParser : true },()=>{
    console.log('MongoDB connnected!');
},{ useUnifiedTopology: true });

const app = express();

//Passport config
require('./config/passport');

//Body parser - This is inorder to fetch the data from the forms!
app.use(express.urlencoded({ extended: false }));

//Express session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  }));

//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//connect flash
app.use(flash());

//Global Vars
app.use((req,res,next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

//EJS
app.use(expressLayouts);
app.set('view engine','ejs');

//Port number
const PORT = 5000;

//GET method to get the main pages
app.get('/',(req,res)=>{
    res.render('welcome');
});

app.get('/login',(req,res)=>{
    res.render('login');
});

app.get('/register',(req,res)=>{
    res.render('register');
});

app.get('/dashboard',(req,res) => {
    res.render('dashboard',{
        name: req.user.name
    });
});

//POST method for login and register
app.post('/register',(req,res)=>{
    const { name,email,password,password2 } = req.body;
    let errors = [];

    //Checking required fields
    if( !name || !email || !password || !password2){
        errors.push({ msg : 'Please fill all the fields!' });
    }

    //Checking if password fields match
    if( password !== password2 ){
        errors.push({ msg : 'Password fields dont match! ' });
    }

    //checking password length
    if( password.length < 6 ){
        errors.push({ msg : 'Password should be atleast 6 characters long!' });
    }

    if(errors.length > 0){
        res.render('register',{
            errors,
            name,
            email,
            password,
            password2
        });
    } else{
        User.findOne({ email : email })
        .then(user => {
            if(user){
                //user exists!
                errors.push({ msg : 'Email already exists!' });
                res.render('register',{
                    errors,
                    name,
                    email,
                    password,
                    password2
                });
            } else{
                const newUser = new User({
                    name,
                    email,
                    password 
                });

                //Hash password
                bcrypt.genSalt(10, (err,salt) => 
                    bcrypt.hash(newUser.password,salt,(err,hash)=>{
                        if(err) throw err;
                        // set password to hashed
                        newUser.password = hash;
                        //save user
                        newUser.save()
                        .then(user => {
                            req.flash('success_msg','You are now registered and can login!');
                            res.redirect('/login');
                        })
                        .catch(err => console.log(err));
                }));
            }
        });
    }
});

//Login handle
// app.post('/login',(req,res,next) => {
//     passport.authenticate('local',{
//         successRedirect: '/dashboard',
//         failureRedirect: '/login',
//         failureFlash: true
//     })(req,res,next);
// });

//Login alternate solution
app.post('/login',(req,res,next) => {
    const { email, password } = req.body;
    let errors = [];
    //Match user
    User.findOne({ email: email })
    .then(user => {
        if(!user){
            errors.push({ msg : 'Email not registered!' });
            res.render('login');
        }

        //Match password
        if( password !== user.password ){
            errors.push({ msg : 'Password is incorrect!' });
            res.render('login');
        } else {
            res.redirect('dashboard');
        }
    })
    .catch(err => console.log(err));
});

//Logout handle
app.get('/logout',(req,res) => {
    req.logout();
    req.flash('success_msg','You have successfully logged out!');
    res.redirect('login');
});

//Listening at port 5000
app.listen(PORT,console.log(`Server started on port ${PORT}`));