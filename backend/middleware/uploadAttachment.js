import multer from "multer";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedMimeTypes = new Set([
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1
    },
    fileFilter: (req, file, callback) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            return callback(new Error("Choose a PNG, JPG, GIF, WEBP image or a PDF."));
        }
        callback(null, true);
    }
});

export const uploadSingleAttachment = (req, res, next) => {
    upload.single("file")(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                success: false,
                message: "Attachments must be 10 MB or smaller."
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to process the attachment."
        });
    });
};
