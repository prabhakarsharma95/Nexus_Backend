import express from "express"
import {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  getEmployerJobs,
  getJobApplicants,
  updateApplicantStatus,
} from "../controllers/job.controller.js"
import { protect, authorize } from "../middleware/auth.middleware.js"

const router = express.Router()

// Public routes
router.get("/", getAllJobs)
router.get("/:id", getJobById)

// Protected routes
router.post("/", protect, authorize("employer", "admin"), createJob)
router.put("/:id", protect, authorize("employer", "admin"), updateJob)
router.delete("/:id", protect, authorize("employer", "admin"), deleteJob)
router.post("/:id/apply", protect, authorize("job-seeker"), applyForJob)
router.get("/employer/jobs", protect, authorize("employer", "admin"), getEmployerJobs)
router.get("/:id/applicants", protect, authorize("employer", "admin"), getJobApplicants)
router.put("/:id/applicants/:applicantId", protect, authorize("employer", "admin"), updateApplicantStatus)

export default router
