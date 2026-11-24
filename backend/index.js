
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import http from "http";

import userRoute from "./routes/userRoute.js";
import messageRoute from "./routes/messageRoute.js";

import { initializeSocket } from "./socket/socket.js";

dotenv.config();

const app = express();

// HTTP Server
const server = http.createServer(app);

// CORS
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/message", messageRoute);

// Test route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Backend server is running!"
    });
});

// Initialize Socket.IO on SAME HTTP server
initializeSocket(server);

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected Successfully");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);
        process.exit(1);
    }
};

// Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`http://localhost:${PORT}`);
    });
};

startServer();
