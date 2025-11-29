import User from "../models/user.model.js"
import { createError } from "../utils/error.js"

// Get user profile
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("savedJobs").populate({
      path: "appliedJobs.job",
      select: "title company location type status",
    })

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

// Update user profile
export const updateUserProfile = async (req, res, next) => {
  try {
    // Fields that can be updated
    const allowedUpdates = ["firstName", "lastName", "company", "position", "location", "bio", "skills"]

    // Filter out fields that are not allowed to be updated
    const updates = Object.keys(req.body)
      .filter((key) => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key]
        return obj
      }, {})

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    })

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

// Change password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    // Get user with password
    const user = await User.findById(req.user.id).select("+password")

    if (!user) {
      return next(createError(404, "User not found"))
    }

    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return next(createError(401, "Current password is incorrect"))
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    })
  } catch (error) {
    next(error)
  }
}

// Save job
export const saveJob = async (req, res, next) => {
  try {
    const { jobId } = req.params
    const userId = req.user.id

    const user = await User.findById(userId)
    if (!user) {
      return next(createError(404, "User not found"))
    }

    // Check if job is already saved
    if (user.savedJobs.includes(jobId)) {
      return next(createError(400, "Job already saved"))
    }

    // Add job to saved jobs
    user.savedJobs.push(jobId)
    await user.save()

    res.status(200).json({
      success: true,
      message: "Job saved successfully",
    })
  } catch (error) {
    next(error)
  }
}

// Unsave job
export const unsaveJob = async (req, res, next) => {
  try {
    const { jobId } = req.params
    const userId = req.user.id

    const user = await User.findById(userId)
    if (!user) {
      return next(createError(404, "User not found"))
    }

    // Check if job is saved
    if (!user.savedJobs.includes(jobId)) {
      return next(createError(400, "Job not saved"))
    }

    // Remove job from saved jobs
    user.savedJobs = user.savedJobs.filter((id) => id.toString() !== jobId)
    await user.save()

    res.status(200).json({
      success: true,
      message: "Job removed from saved jobs",
    })
  } catch (error) {
    next(error)
  }
}

// Get saved jobs
export const getSavedJobs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("savedJobs")

    if (!user) {
      return next(createError(404, "User not found"))
    }

    res.status(200).json({
      success: true,
      count: user.savedJobs.length,
      savedJobs: user.savedJobs,
    })
  } catch (error) {
    next(error)
  }
}

// Get applied jobs
export const getAppliedJobs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "appliedJobs.job",
      select: "title company location type status createdAt",
    })

    if (!user) {
      return next(createError(404, "User not found"))
    }

    res.status(200).json({
      success: true,
      count: user.appliedJobs.length,
      appliedJobs: user.appliedJobs,
    })
  } catch (error) {
    next(error)
  }
}
