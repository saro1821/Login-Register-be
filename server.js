const app=require('./app')
const path = require('path');
const connectDatabase= require('./config/database')

connectDatabase()

const server = app.listen(process.env.PORT,()=>{
    console.log(`My Server listening to the port: ${process.env.PORT} in  ${process.env.NODE_ENV} `)
})
