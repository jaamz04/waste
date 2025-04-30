const { required, number } = require('joi');
const mongoose = require('mongoose');


const userInfoSchema = new mongoose.Schema({
    fullname: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    contact: { type: String, required: true },
    birthdate: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female'], required: true },
    assign_area: { type: String, required: true }
});



const userSchema = mongoose.Schema({
    info: { type: mongoose.Schema.Types.ObjectId,
         ref: 'UserInfo', 
         required: true 
        },

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

    u_role: { type: String, 
        enum: ['admin', 'janitor', 'other'],
         required: true 
        },

    status: { type: String, 
        enum: ['active', 'inactive'], 
        default: 'active' 
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

const sensoredDataSchema = new mongoose.Schema({
    data_id: { type: String, 
    required: true },
    timestamp: Date
});

const activityLogSchema = new mongoose.Schema({
    u_id: { type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true },
    bin_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Bin',
        required: true },
        date: Date,
        time: String,
        status: String
});

const alertSchema = new mongoose.Schema({
    sensored_id: { type: mongoose.Schema.Types.ObjectId, 
    ref: 'SensoredData' },
    bin_id: { type: mongoose.Schema.Types.ObjectId, 
    ref: 'Bin' },
    status: String
});

const binSchema = new mongoose.Schema({
    sensored_id: { type: mongoose.Schema.Types.ObjectId, 
    ref: 'SensoredData' },
    bin_code: { type: String,
    required: true },
    type: String,
    location: String,
    bin_level: Number,
    capacity: Number,
    last_collected: Date,
    status: String
});

const historyLogSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    time_in: Date,
    time_out: Date,
    date: Date
});

const notificationSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin' },
    message: String,
    notif_type: String,
    created_at: Date,
    send_time: Date,
    status: String
});



const UserInfo = mongoose.model("UserInfo", userInfoSchema);
const User = mongoose.model("User", userSchema);
const SensoredData = mongoose.model("SensoredData", sensoredDataSchema);
const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
const Alert = mongoose.model("Alert", alertSchema);
const Bin = mongoose.model("Bin", binSchema);
const HistoryLog = mongoose.model("HistoryLog", historyLogSchema);
const Notification = mongoose.model("Notification", notificationSchema);


module.exports = {
    User,
    UserInfo,
    SensoredData,
    ActivityLog,
    Alert,
    Bin,
    HistoryLog,
    Notification
};
