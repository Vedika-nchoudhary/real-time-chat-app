import mongoose from "mongoose";

const messageModel = new mongoose.Schema({
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    receiverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    message:{
        type:String,
        default:""
    },
    attachment:{
        url:{type:String},
        publicId:{type:String},
        fileName:{type:String},
        mimeType:{type:String},
        size:{type:Number}
    }
},{timestamps:true});
export const Message = mongoose.model("Message", messageModel);