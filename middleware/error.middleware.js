import { createError } from "../utils/error.js"

export const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error for dev
  console.error(err)

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found"
    error = createError(404, message)
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered"
    error = createError(400, message)
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message)
    error = createError(400, message)
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
  })
}
