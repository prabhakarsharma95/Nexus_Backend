import express from "express"
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  saveJob,
  unsaveJob,
  getSavedJobs,
  getAppliedJobs,
} from "../controllers/user.controller.js"
import { protect } from "../middleware/auth.middleware.js"

const router = express.Router()

// All routes are protected
router.get("/profile", protect, getUserProfile)
router.put("/profile", protect, updateUserProfile)
router.put("/change-password", protect, changePassword)
router.post("/jobs/:jobId/save", protect, saveJob)
router.delete("/jobs/:jobId/save", protect, unsaveJob)
router.get("/saved-jobs", protect, getSavedJobs)
router.get("/applied-jobs", protect, getAppliedJobs)

export default router
