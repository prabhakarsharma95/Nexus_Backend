import jwt from "jsonwebtoken"
import { createError } from "../utils/error.js"
import User from "../models/user.model.js"

// Protect routes
export const protect = async (req, res, next) => {
  try {
    let token

    // Get token from cookie or authorization header
    if (req.cookies.token) {
      token = req.cookies.token
    } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }

    // Check if token exists
    if (!token) {
      return next(createError(401, "Not authorized to access this route"))
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Set user in request
      req.user = await User.findById(decoded.id)
      next()
    } catch (error) {
      return next(createError(401, "Not authorized to access this route"))
    }
  } catch (error) {
    next(error)
  }
}

// Authorize roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(createError(403, `User role ${req.user.role} is not authorized to access this route`))
    }
    next()
  }
}
