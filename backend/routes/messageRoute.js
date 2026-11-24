import express from "express";
import { getMessage, sendMessage } from "../controllers/messageController.js";
import isAuthenticated from "../middleware/isAuthenticated.js";
import { uploadSingleAttachment } from "../middleware/uploadAttachment.js";

const router = express.Router();

router.route("/send/:id").post(isAuthenticated, uploadSingleAttachment, sendMessage);
router.route("/:id").get(isAuthenticated, getMessage);

export default router;