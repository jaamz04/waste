const { required, number } = require('joi');
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required!"], 
        trim: true,
        minLength: [2, "Name must have at least 2 characters!"],
        maxLength: [50, "Name cannot exceed 50 characters!"],
        match: [/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces!"], 
    },

    email:{
        type:String,
        required:[true, 'Email is required!'],
        trim: true,
        unique: [true, "Email must be Unique!"],
        minLenght: [5, "Email must have 5 Characters!"],
        lowercase: true,
    },
    password:{
        type:String,
        required:[true, 'Password is required!'],
        trim: true,
        select:false,
    },
    verified:{
        type:Boolean,
        default:false,

    },
    verificationCode:{
        type: String,
        select:false,
    },
    verificationCodeValidation:{
        type: Number,
        select:false,
    },
    forgotPasswordCode:{
        type: String,
        select:false,
    },
    forgotPasswordCodeValidation:{
        type: Number,
        select:false,
    }
},{
    timestamps:true
});

module.exports = mongoose.model("User", userSchema);