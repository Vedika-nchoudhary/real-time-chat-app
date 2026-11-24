import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

const configureCloudinary = () => {
    const requiredVariables = [
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET"
    ];
    const missingVariables = requiredVariables.filter((name) => !process.env[name]);

    if (missingVariables.length) {
        throw new Error(`Missing Cloudinary configuration: ${missingVariables.join(", ")}`);
    }

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
};

export const uploadAttachment = (file) => {
    configureCloudinary();

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "chat-app/attachments",
                public_id: randomUUID(),
                resource_type: "image",
                overwrite: false
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else if (!result?.secure_url || !result?.public_id) {
                    reject(new Error("Cloudinary did not return an attachment URL."));
                } else {
                    resolve(result);
                }
            }
        );

        uploadStream.end(file.buffer);
    });
};

export const deleteAttachment = (publicId) => {
    configureCloudinary();
    return cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true
    });
};
