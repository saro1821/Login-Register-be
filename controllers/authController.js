const catchAsyncError=require('../middlewares/catchAsyncError')
const User=require('../models/userModel')
const sendToken =require('../utils/jwt')
const sendEmail=require('../utils/email')
const ErrorHandler =require('../utils/errorHandler')
const crypto = require('crypto')
exports.registerUser = catchAsyncError(async (req, res, next) => {
    const {name, email, password } = req.body

    let avatar;
    
    let BASE_URL = process.env.BACKEND_URL;
    if(process.env.NODE_ENV === "production"){
        BASE_URL = `${req.protocol}://${req.get('host')}`
    }

    if(req.file){
        avatar = `${BASE_URL}/uploads/user/${req.file.originalname}`
    }

    const user = await User.create({
        name,
        email,
        password,
        avatar
    });

    sendToken(user, 201, res)

})

//Login User - /api/v1/login
exports.loginUser = catchAsyncError(async (req, res, next) => {
    const {email, password} =  req.body

    if(!email || !password) {
        return next(new ErrorHandler('Please enter email & password', 400))
    }

    //finding the user database
    const user = await User.findOne({email}).select('+password');

    if(!user) {
        return next(new ErrorHandler('Invalid email or password', 401))
    }
    
    if(!await user.isValidPassword(password)){
        return next(new ErrorHandler('Invalid email or password', 401))
    }
 sendToken(user, 201, res)
    })

exports.logoutUser = (req, res, next) => {
    res.cookie('token',null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })
    .status(200)
    .json({
        success: true,
        message: "Loggedout"
    })

}

//Forgot Password - /api/v1/password/forgot
exports.forgotPassword = catchAsyncError( async (req, res, next)=>{
const user =  await User.findOne({email: req.body.email});

if(!user) {
    return next(new ErrorHandler('User not found with this email', 404))
}

const resetToken = user.getResetToken();
await user.save({validateBeforeSave: false})

let BASE_URL = process.env.FRONTEND_URL;
if(process.env.NODE_ENV === "production"){
    BASE_URL = `${req.protocol}://${req.get('host')}`
}


//Create reset url
const resetUrl = `${BASE_URL}/password/reset/${resetToken}`;

const message = `Your password reset url is as follows \n\n 
${resetUrl} \n\n If you have not requested this email, then ignore it.`;

try{
    sendEmail({
        email: user.email,
        subject: "Login Register Password Recovery",
        message
    })

    res.status(200).json({
        success: true,
        message: `Email sent to ${user.email}`
    })

}catch(error){
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;
    await user.save({validateBeforeSave: false});
    return next(new ErrorHandler(error.message), 500)
}

})  

//Reset Password - /api/v1/password/reset/:token
exports.resetPassword = catchAsyncError( async (req, res, next) => {
const resetPasswordToken =  crypto.createHash('sha256').update(req.params.token).digest('hex'); 

const user = await User.findOne( {
    resetPasswordToken,
    resetPasswordTokenExpire: {
        $gt : Date.now()
    }
} )

if(!user) {
    return next(new ErrorHandler('Password reset token is invalid or expired'));
}

if( req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler('Password does not match'));
}

user.password = req.body.password;
user.resetPasswordToken = undefined;
user.resetPasswordTokenExpire = undefined;
await user.save({validateBeforeSave: false})
sendToken(user, 201, res)

})