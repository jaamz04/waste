const jwt = require("jsonwebtoken");
const { signupSchema, signinSchema, acceptCodeSchema, changePasswordSchema,acceptFPCodeSchema } = require("../middlewares/validator");
const User = require('../models/userModel');
const { doHash, doHashValidation, hmacProcess } = require('../utils/hashing');
const transport = require("../middlewares/sendMail");
const bcrypt = require("bcryptjs");


exports.signup = async (req, res) => {
    const { name, email, password } = req.body; 

    try {
       
        const { error, value } = signupSchema.validate({ name, email, password });
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required!" });
        }

        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }

        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(401).json({ success: false, message: "User Already Exists!" });
        }

      
        const hashedPassword = await doHash(password, 12);
        
        
        const newUser = new User({
            name, 
            email,
            password: hashedPassword,
        });

        const result = await newUser.save();
        result.password = undefined; 
        
        return res.status(201).json({
            success: true,
            message: "Your Account has been Created Successfully!",
            user: result,
        });

    } catch (error) {
        console.error("Signup Error:", error);
        return res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};


exports.signin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email }).select("+password");
        if (!existingUser) {
            return res.status(401).json({ error: "User does not exist!" });
        }

        const isValidPassword = await bcrypt.compare(password, existingUser.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid Credentials!" });
        }

        const token = jwt.sign(
            { userId: existingUser._id, email: existingUser.email },
            process.env.TOKEN_SECRET,
            { expiresIn: "8h" }
        );

        res.cookie("Authorization", "Bearer " + token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        });

        return res.status(200).json({ message: "Login successful!", token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Something went wrong." });
    }
};


exports.signout = async (req, res)=>{
    res.clearCookie('Authirization').status(200).json({success:true, message: "Logged Out Successfully"})
}

exports.sendVerificationCode = async (req, res)=>{
    const {email}=req.body;

    try {
        const existingUser = await User.findOne({email})
        if(!existingUser){
            return res.status(404).json({success:false, message:"User does not Exist!"})
        }
        if(existingUser.verified){
            return res.status(400).json({success:false, message:"You already Verified!"})
        }
        // sendcode to that email using math function
        const codeValue = Math.floor(Math.random() * 10000000).toString();

        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject: "Verification Code",
            html: '<h1>'+ codeValue +'</h1>'
        })

        if(info.accepted[0]=== existingUser.email){
            const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET)
            existingUser.verificationCode = hashedCodeValue;
            existingUser.verificationCodeValidation = Date.now();
            await existingUser.save()
            return res.status(200).json({success:true, message: "Code sent"})
        }
        res.status(400).json({success:true, message: "Code sent Failed!"});


    } catch (error) {
        console.log(error);
    }
}

exports.verifyVerificationCode = async (req, res)=>{
    const {email, providedCode}= req.body;

    const {error, value}= acceptCodeSchema.validate({email,providedCode});

    if(error){
        return res.status(401).json({success:false, message: error.details[0].message})
    }
    const codeValue = providedCode.toString();
    const existingUser = await User.findOne({email}).select("+verificationCode verificationCodeValidation");

    if(!existingUser){
        return res.status(401).json({success:false, message:"User does not Exist!"})
    }
    if(existingUser.verified){
        return res.status(400).json({success:false, message:"You already Verified!"})
    }
    if(!existingUser.verificationCode || !existingUser.verificationCodeValidation){
        return res.status(400).json({success:false, message:"Something is wrong with the Code!"})
    }
    // send code 5 minutes if dili makavalidate will throw error
    if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
        return res.status(400).json({success:false, message:"Code has been expired!"})
    }
    const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET)
    if(hashedCodeValue === existingUser.verificationCode){
        existingUser.verified = true;
        existingUser.verificationCode = undefined;
        existingUser.verificationCodeValidation = undefined;
        await existingUser.save();
        return res.status(200).json({success:true, message:"Your Account has been verified!"})
    }
    return res.status(400).json({success:false, message:"Unexpected Occur!"})

}

exports.changePassword = async (req, res)=>{
    const {userId, verified} = req.user;
    const {oldPassword, newPassword} = req.body;

    try {
        const {error, value}= changePasswordSchema.validate({oldPassword, newPassword});
        if(error){
            return res.status(401).json({success:false, message: error.details[0].message})
        }

        const existingUser = await User.findOne({_id:userId}).select('+password');
        if(!existingUser){
            return res.status(401).json({success:false, message:"User does not Exist!"})
        }

        const result = await doHashValidation(oldPassword, existingUser.password);
        if(!result){
            return res.status(401).json({success:false, message:"Invalid Credentials!"})
        }

        const hashedPassword = await doHash(newPassword,12);
        existingUser.password = hashedPassword;
        await existingUser.save();
        return res.status(200).json({success:true, message:"Password Updated!"});
    } catch (error) {
        console.log(error);
    }
}



exports.sendForgotPasswordCode = async (req, res)=>{
    const {email}=req.body;

    try {
        const existingUser = await User.findOne({email})
        if(!existingUser){
            return res.status(404).json({success:false, message:"User does not Exist!"})
        }
       
        // sendcode to that email using math function
        const codeValue = Math.floor(Math.random() * 10000000).toString();

        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject: "Forgot Password Code",
            html: '<h1>'+ codeValue +'</h1>'
        })

        if(info.accepted[0]=== existingUser.email){
            const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
            existingUser.forgotPasswordCode = hashedCodeValue;
            existingUser.forgotPasswordCodeValidation = Date.now();
            await existingUser.save()
            return res.status(200).json({success:true, message: "Code sent"})
        }
        res.status(400).json({success:true, message: "Code sent Failed!"});


    } catch (error) {
        console.log(error);
    }
}

exports.verifyForgotPasswordCode = async (req, res)=>{
    const {email, providedCode, newPassword}= req.body;

    const {error, value}= acceptFPCodeSchema.validate({email,providedCode,newPassword});

    if(error){
        return res.status(401).json({success:false, message: error.details[0].message})
    }
    const codeValue = providedCode.toString();
    const existingUser = await User.findOne({email}).select("+forgotPasswordCode +forgotPasswordCodeValidation");

    if(!existingUser){
        return res.status(401).json({success:false, message:"User does not Exist!"})
    }
    
    if(!existingUser.forgotPasswordCode || !existingUser.forgotPasswordCodeValidation){
        return res.status(400).json({success:false, message:"Something is wrong with the Code!"})
    }
    // send code 5 minutes if dili makavalidate will throw error
    if (Date.now() - existingUser.forgotPasswordCodeValidation > 5 * 60 * 1000) {
        return res.status(400).json({success:false, message:"Code has been expired!"})
    }
    const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);

    if(hashedCodeValue === existingUser.forgotPasswordCode){
        const hashedPassword = await doHash(newPassword,12);
        existingUser.password = hashedPassword;
        existingUser.forgotPasswordCode = undefined;
        existingUser.forgotPasswordCodeValidation = undefined;
        await existingUser.save();
        return res.status(200).json({success:true, message:"Password Updated!"})
    }
    return res.status(400).json({success:false, message:"Unexpexted Occur!"})

}

