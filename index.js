import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser"
import authRoutes from "./routes/auth.routes.js"
import jobRoutes from "./routes/job.routes.js"
import userRoutes from "./routes/user.routes.js"
import { errorHandler } from "./middleware/error.middleware.js"

// Load environment variables
dotenv.config()

// Create Express app
const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(express.json())
app.use(cookieParser())
app.use(
  cors({
    origin: process.env.CLIENT_URL || "https://nexus-frontend-zb37.onrender.com",
    credentials: true,
  }),
)

// app.use(
//   cors({
//     origin:"",
//     methods: ["GET", "POST"],
//             allowedHeaders: ["*"],
//             credentials: true,
//   }),
// )

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/jobs", jobRoutes)
app.use("/api/users", userRoutes)

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" })
})

// Error handling middleware
app.use(errorHandler)

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB")
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error)
  })
