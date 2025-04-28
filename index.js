const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require('mongoose');
const path = require("path");

const authRouter = require('./routers/authRouter');
const postsRouter = require('./routers/postsRouter');


const app = express();
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(authRouter);
app.set("view engine", "ejs");
app.set("views", __dirname + "/view");
app.use(express.static("public"));


mongoose.connect(process.env.MONGO_URI).then(()=>{
    console.log("Database connected");
}).catch((err)=>{
    console.log(err);
})
app.use( '/api/auth',authRouter)
app.use('/api/posts',postsRouter)


app.get("/", (req, res) => {
    res.redirect("/landing");
});

app.get("/landing", (req, res) => {
    res.render("landing");
});

app.get("/admin", (req, res) => {
  res.render("admin/admin"); // Adjusted to reflect the subfolder structure
});

app.get("/janitordash", (req, res) => {
  res.render("janitors/janitordash"); // Adjusted to reflect the subfolder structure
});

app.get('/login', (req, res) => {
  res.render('login', { errorMessage: null });
});

app.get("/register", (req, res) => {
  res.render("register"); 
});

app.get("/forgot_password", (req, res) => {
  res.render("forgot_password"); 
});

app.get("/dashboard", (req, res) => {
  res.render("Staff/dashboard"); 
});

// app.get("/dashboard", (req, res) => {
//     const token = req.cookies.Authorization;
  
//     if (!token) {
//       return res.redirect("/login"); 
//     }
  
//     try {
//       const decoded = jwt.verify(token.split(" ")[1], process.env.TOKEN_SECRET);
//       res.render("staff/dash", { user: decoded });
//     } catch (error) {
//       return res.redirect("/login"); 
//     }
//   });
  



app.listen(process.env.PORT, ()=> {
    console.log('listening.....');
} );