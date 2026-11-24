import { Conversation } from "../models/conversationModel.js";
import { Message } from "../models/messageModel.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { deleteAttachment, uploadAttachment } from "../config/cloudinary.js";

const hasValidFileSignature = (file) => {
    const { buffer, mimetype } = file;

    if (mimetype === "application/pdf") {
        return buffer.subarray(0, 5).toString() === "%PDF-";
    }
    if (mimetype === "image/png") {
        return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    }
    if (mimetype === "image/jpeg") {
        return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (mimetype === "image/gif") {
        const signature = buffer.subarray(0, 6).toString();
        return signature === "GIF87a" || signature === "GIF89a";
    }
    if (mimetype === "image/webp") {
        return buffer.subarray(0, 4).toString() === "RIFF" &&
            buffer.subarray(8, 12).toString() === "WEBP";
    }

    return false;
};

export const sendMessage = async (req,res) => {
    let uploadedAsset;
    try {
        const senderId = req.id;
        const receiverId = req.params.id;
        const message = typeof req.body.message === "string" ? req.body.message.trim() : "";

        if (!message && !req.file) {
            return res.status(400).json({
                success: false,
                message: "Write a message or attach a file."
            });
        }
        if (req.body.message != null && typeof req.body.message !== "string") {
            return res.status(400).json({
                success: false,
                message: "Message text must be a string."
            });
        }

        let attachment;
        if (req.file) {
            if (!hasValidFileSignature(req.file)) {
                return res.status(400).json({
                    success: false,
                    message: "The attachment contents do not match its file type."
                });
            }

            uploadedAsset = await uploadAttachment(req.file);
            const fileName = req.file.originalname
                .replace(/[\\/]/g, "/")
                .split("/")
                .pop()
                .replace(/[\u0000-\u001f\u007f]/g, "")
                .slice(0, 255);

            attachment = {
                url: uploadedAsset.secure_url,
                publicId: uploadedAsset.public_id,
                fileName: fileName || "attachment",
                mimeType: req.file.mimetype,
                size: req.file.size
            };
        }

        let gotConversation = await Conversation.findOne({
            participants:{$all : [senderId, receiverId]},
        });

        if(!gotConversation){
            gotConversation = await Conversation.create({
                participants:[senderId, receiverId]
            })
        };
        const newMessage = new Message({
            senderId,
            receiverId,
            message,
            attachment
        });
        gotConversation.messages.push(newMessage._id);

        await Promise.all([gotConversation.save(), newMessage.save()]);
         
        // SOCKET IO
        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        return res.status(201).json({
            success: true,
            newMessage
        })
    } catch (error) {
        if (uploadedAsset?.public_id) {
            try {
                await deleteAttachment(uploadedAsset.public_id);
            } catch (cleanupError) {
                console.error("Failed to remove an unlinked Cloudinary attachment:", cleanupError);
            }
        }
        console.error("Failed to send message:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to send the message. Please try again."
        });
    }
}
export const getMessage = async (req,res) => {
    try {
        const receiverId = req.params.id;
        const senderId = req.id;
        const conversation = await Conversation.findOne({
            participants:{$all : [senderId, receiverId]}
        }).populate("messages"); 
        return res.status(200).json(conversation?.messages);
    } catch (error) {
        console.log(error);
    }
}