import Job from "../models/job.model.js"
import User from "../models/user.model.js"
import { createError } from "../utils/error.js"
// Import email utility functions at the top of the file
import { sendApplicationConfirmation, sendApplicationNotification } from "../utils/email.js"

// Get all jobs with filtering, sorting, and pagination
export const getAllJobs = async (req, res, next) => {
  try {
    const { search, category, type, location, experience, salary, page = 1, limit = 10, sort = "newest" } = req.query

    // Build filter object
    const filter = { status: "active" }

    // Search functionality
    if (search) {
      filter.$text = { $search: search }
    }

    // Category filter
    if (category) {
      filter.category = category
    }

    // Job type filter
    if (type) {
      filter.type = type
    }

    // Location filter
    if (location) {
      filter.location = { $regex: location, $options: "i" }
    }

    // Experience filter
    if (experience) {
      filter.experience = experience
    }

    // Salary filter
    if (salary) {
      const [min, max] = salary.split("-").map(Number)
      if (min && max) {
        filter["salary.min"] = { $gte: min }
        filter["salary.max"] = { $lte: max }
      } else if (min) {
        filter["salary.min"] = { $gte: min }
      }
    }

    // Sorting
    let sortOptions = {}
    switch (sort) {
      case "newest":
        sortOptions = { createdAt: -1 }
        break
      case "oldest":
        sortOptions = { createdAt: 1 }
        break
      case "salary-high-to-low":
        sortOptions = { "salary.max": -1 }
        break
      case "salary-low-to-high":
        sortOptions = { "salary.min": 1 }
        break
      default:
        sortOptions = { createdAt: -1 }
    }

    // Pagination
    const pageNum = Number.parseInt(page, 10)
    const limitNum = Number.parseInt(limit, 10)
    const skip = (pageNum - 1) * limitNum

    // Execute query
    const jobs = await Job.find(filter)
      .populate("employer", "firstName lastName company")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)

    // Get total count
    const totalJobs = await Job.countDocuments(filter)

    res.status(200).json({
      success: true,
      count: jobs.length,
      totalJobs,
      totalPages: Math.ceil(totalJobs / limitNum),
      currentPage: pageNum,
      jobs,
    })
  } catch (error) {
    next(error)
  }
}

// Get job by ID
export const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate("employer", "firstName lastName company")

    if (!job) {
      return next(createError(404, "Job not found"))
    }

    res.status(200).json({
      success: true,
      job,
    })
  } catch (error) {
    next(error)
  }
}

// Create a new job
export const createJob = async (req, res, next) => {
  try {
    // Check if user is an employer
    if (req.user.role !== "employer" && req.user.role !== "admin") {
      return next(createError(403, "Only employers can create job listings"))
    }

    const jobData = {
      ...req.body,
      employer: req.user.id,
    }

    const job = await Job.create(jobData)

    res.status(201).json({
      success: true,
      job,
    })
  } catch (error) {
    next(error)
  }
}

// Update job
export const updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id)

    if (!job) {
      return next(createError(404, "Job not found"))
    }

    // Check if user is the employer or admin
    if (job.employer.toString() !== req.user.id && req.user.role !== "admin") {
      return next(createError(403, "You are not authorized to update this job"))
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      success: true,
      job,
    })
  } catch (error) {
    next(error)
  }
}

// Delete job
export const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)

    if (!job) {
      return next(createError(404, "Job not found"))
    }

    // Check if user is the employer or admin
    if (job.employer.toString() !== req.user.id && req.user.role !== "admin") {
      return next(createError(403, "You are not authorized to delete this job"))
    }

    await job.deleteOne()

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    })
  } catch (error) {
    next(error)
  }
}

// Apply for a job
export const applyForJob = async (req, res, next) => {
  try {
    // Check if user is a job seeker
    if (req.user.role !== "job-seeker") {
      return next(createError(403, "Only job seekers can apply for jobs"))
    }

    const { coverLetter, resume } = req.body
    const jobId = req.params.id
    const userId = req.user.id

    // Find the job
    const job = await Job.findById(jobId)
    if (!job) {
      return next(createError(404, "Job not found"))
    }

    // Check if job is active
    if (job.status !== "active") {
      return next(createError(400, "This job is no longer accepting applications"))
    }

    // Check if application deadline has passed
    if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
      return next(createError(400, "Application deadline has passed"))
    }

    // Check if user has already applied
    const alreadyApplied = job.applicants.some((applicant) => applicant.user.toString() === userId)

    if (alreadyApplied) {
      return next(createError(400, "You have already applied for this job"))
    }

    // Add applicant to job
    job.applicants.push({
      user: userId,
      coverLetter,
      resume,
    })

    await job.save()

    // Add job to user's applied jobs
    const user = await User.findById(userId)
    user.appliedJobs.push({
      job: jobId,
    })

    await user.save()

    // Send email confirmation to the applicant
    try {
      await sendApplicationConfirmation(user, job)
    } catch (emailError) {
      console.error("Error sending application confirmation email:", emailError)
      // Don't fail the request if email sending fails
    }

    // Send notification to the employer
    try {
      const employer = await User.findById(job.employer)
      if (employer) {
        await sendApplicationNotification(employer, job, user)
      }
    } catch (emailError) {
      console.error("Error sending employer notification email:", emailError)
      // Don't fail the request if email sending fails
    }

    res.status(200).json({
      success: true,
      message: "Job application submitted successfully",
    })
  } catch (error) {
    next(error)
  }
}

// Get employer's posted jobs
export const getEmployerJobs = async (req, res, next) => {
  try {
    // Check if user is an employer
    if (req.user.role !== "employer" && req.user.role !== "admin") {
      return next(createError(403, "Only employers can access their posted jobs"))
    }

    const jobs = await Job.find({ employer: req.user.id }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    })
  } catch (error) {
    next(error)
  }
}

// Get job applicants
export const getJobApplicants = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate({
      path: "applicants.user",
      select: "firstName lastName email location skills",
    })

    if (!job) {
      return next(createError(404, "Job not found"))
    }

    // Check if user is the employer or admin
    if (job.employer.toString() !== req.user.id && req.user.role !== "admin") {
      return next(createError(403, "You are not authorized to view applicants for this job"))
    }

    res.status(200).json({
      success: true,
      count: job.applicants.length,
      applicants: job.applicants,
    })
  } catch (error) {
    next(error)
  }
}

// Update applicant status
export const updateApplicantStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    const { id: jobId, applicantId } = req.params

    const job = await Job.findById(jobId)

    if (!job) {
      return next(createError(404, "Job not found"))
    }

    // Check if user is the employer or admin
    if (job.employer.toString() !== req.user.id && req.user.role !== "admin") {
      return next(createError(403, "You are not authorized to update applicant status"))
    }

    // Find applicant
    const applicant = job.applicants.id(applicantId)
    if (!applicant) {
      return next(createError(404, "Applicant not found"))
    }

    // Update status
    applicant.status = status
    await job.save()

    // Update status in user's applied jobs
    await User.updateOne(
      {
        _id: applicant.user,
        "appliedJobs.job": jobId,
      },
      {
        $set: { "appliedJobs.$.status": status },
      },
    )

    // Send status update email to the applicant
    try {
      const applicantUser = await User.findById(applicant.user)
      if (applicantUser) {
        const { sendStatusUpdateNotification } = await import("../utils/email.js")
        await sendStatusUpdateNotification(applicantUser, job, status)
      }
    } catch (emailError) {
      console.error("Error sending status update email:", emailError)
      // Don't fail the request if email sending fails
    }

    res.status(200).json({
      success: true,
      message: "Applicant status updated successfully",
    })
  } catch (error) {
    next(error)
  }
}
