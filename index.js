const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require('mongoose');
const path = require("path");
const http = require('http');
const socketIo = require('socket.io');
const app = express();


const { identifier } = require("./middlewares/identification");
const authRouter = require('./routers/authRouter');
const postsRouter = require('./routers/postsRouter');
const {SensoredData} = require('./models/userModel'); 
const server = http.createServer(app);
const io = socketIo(server);


app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.urlencoded({extended:true}));
app.use(express.json());

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


app.get('/login', (req, res) => {
  res.render('login', { errorMessage: null });
});

app.get("/register", (req, res) => {
  res.render("register"); 
});

app.get("/forgot_password", (req, res) => {
  res.render("forgot_password"); 
});

app.get("/staff/dashboard", identifier, (req, res) => {
  res.render("staff/dashboard");
});
app.get("/janitors/janitordash", (req, res) => {
  res.render("janitors/janitordash"); 
});
app.get("/admin/admin", (req, res) => {
  res.render("admin/admin"); 
});

//socketni

io.on('connection', (socket) => {
  console.log('New client connected');
  
  
  SensoredData.find({})
    .then((data) => {
      socket.emit('initialData', data);  
    })
    .catch((err) => console.error(err));

  
  setInterval(() => {
    SensoredData.find({})
      .then((data) => {
        socket.emit('sensorUpdate', data);  
      })
      .catch((err) => console.error(err));
  }, 5000); 

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});




app.listen(process.env.PORT, ()=> {
    console.log('listening.....');
} );


