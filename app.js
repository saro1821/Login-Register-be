const express=require('express')
const app=express()
const dotenv=require('dotenv')
const path =require('path')
const cookieParser=require('cookie-parser')
dotenv.config({path:path.join(__dirname,"config/config.env")});
const cors =require('cors')

app.use(express.json())
app.use(cookieParser())
app.use(cors())
app.get('/', (req,res) => {
    res.setHeader("Access-Control-Allow-Credentials","true")
    res.send("API is running..");
});

const auth= require('./routes/auth')

app.use('/api/v1/',auth)

module.exports=app