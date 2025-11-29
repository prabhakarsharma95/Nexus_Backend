import User from "../models/user.model.js"
import { createError } from "../utils/error.js"

// Register a new user
export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return next(createError(400, "User with this email already exists"))
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role: role || "job-seeker",
    })

    await user.save()

    // Generate token
    const token = user.generateAuthToken()

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })

    // Send response
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      token,
    })
  } catch (error) {
    next(error)
  }
}

// Login user
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Check if user exists
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return next(createError(401, "Invalid credentials"))
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return next(createError(401, "Invalid credentials"))
    }

    // Generate token
    const token = user.generateAuthToken()

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })

    // Send response
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      token,
    })
  } catch (error) {
    next(error)
  }
}

// Logout user
export const logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  })

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  })
}

// Get current user
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return next(createError(404, "User not found"))
    }

    res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    next(error)
  }
}
