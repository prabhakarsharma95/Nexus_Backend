import mongoose from "mongoose"

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [100, "Job title cannot exceed 100 characters"],
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Job location is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Job type is required"],
      enum: ["Full-time", "Part-time", "Contract", "Remote", "Internship"],
    },
    category: {
      type: String,
      required: [true, "Job category is required"],
      enum: [
        "IT & Software",
        "Finance & Accounting",
        "Marketing & Sales",
        "Healthcare & Medical",
        "Engineering & Construction",
        "Administrative & Clerical",
        "Human Resources",
        "Education & Training",
        "Legal",
        "Other",
      ],
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
    },
    requirements: {
      type: String,
      required: [true, "Job requirements are required"],
    },
    responsibilities: {
      type: String,
      required: [true, "Job responsibilities are required"],
    },
    salary: {
      min: {
        type: Number,
        required: [true, "Minimum salary is required"],
      },
      max: {
        type: Number,
        required: [true, "Maximum salary is required"],
      },
      currency: {
        type: String,
        default: "USD",
      },
    },
    experience: {
      type: String,
      required: [true, "Experience level is required"],
      enum: ["0-1 years", "1-2 years", "2-4 years", "3-5 years", "5+ years", "7+ years", "10+ years"],
    },
    education: {
      type: String,
      required: [true, "Education level is required"],
      enum: ["High School", "Associate Degree", "Bachelor's Degree", "Master's Degree", "PhD", "Other"],
    },
    skills: {
      type: [String],
      required: [true, "Skills are required"],
    },
    benefits: {
      type: [String],
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employer is required"],
    },
    logo: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "closed", "draft"],
      default: "active",
    },
    applicationDeadline: {
      type: Date,
    },
    applicants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["pending", "reviewed", "interviewed", "rejected", "offered", "hired"],
          default: "pending",
        },
        coverLetter: {
          type: String,
        },
        resume: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Format salary as string
jobSchema.virtual("salaryRange").get(function () {
  return `${this.salary.currency}${this.salary.min.toLocaleString()} - ${this.salary.currency}${this.salary.max.toLocaleString()}`
})

// Add applicant count virtual
jobSchema.virtual("applicantCount").get(function () {
  return this.applicants.length
})

// Add index for search
jobSchema.index({ title: "text", company: "text", description: "text", skills: "text" })

const Job = mongoose.model("Job", jobSchema)

export default Job
