import nodemailer from "nodemailer"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import Handlebars from "handlebars"

// Get the directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create a transporter
const createTransporter = () => {
  // For production
  if (process.env.NODE_ENV === "production") {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
  }

  // For development (using Ethereal Email for testing)
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: process.env.DEV_EMAIL_USER || "ethereal.user@ethereal.email",
      pass: process.env.DEV_EMAIL_PASS || "ethereal_password",
    },
  })
}

// Load email template and compile with Handlebars
const loadTemplate = (templateName) => {
  const templatePath = path.join(__dirname, "../templates/emails", `${templateName}.html`)
  const templateSource = fs.readFileSync(templatePath, "utf-8")
  return Handlebars.compile(templateSource)
}

// Send email
export const sendEmail = async (options) => {
  try {
    const transporter = createTransporter()

    // Compile template if provided
    let html = options.html
    if (options.template) {
      const template = loadTemplate(options.template)
      html = template(options.templateData)
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "PlacementIndia"}" <${process.env.EMAIL_FROM || "noreply@placementindia.com"}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: html,
    }

    const info = await transporter.sendMail(mailOptions)

    // Log email URL for development (Ethereal)
    if (process.env.NODE_ENV !== "production") {
      console.log(`Email preview URL: ${nodemailer.getTestMessageUrl(info)}`)
    }

    return info
  } catch (error) {
    console.error("Email sending error:", error)
    throw error
  }
}

// Email notification types
export const sendApplicationConfirmation = async (user, job) => {
  await sendEmail({
    to: user.email,
    subject: `Application Submitted: ${job.title} at ${job.company}`,
    template: "application-confirmation",
    templateData: {
      userName: user.firstName,
      jobTitle: job.title,
      companyName: job.company,
      applicationDate: new Date().toLocaleDateString(),
      jobLink: `${process.env.CLIENT_URL}/jobs/${job._id}`,
      dashboardLink: `${process.env.CLIENT_URL}/applied-jobs`,
    },
  })
}

export const sendApplicationNotification = async (employer, job, applicant) => {
  await sendEmail({
    to: employer.email,
    subject: `New Application: ${job.title}`,
    template: "application-notification",
    templateData: {
      employerName: employer.firstName,
      jobTitle: job.title,
      applicantName: `${applicant.firstName} ${applicant.lastName}`,
      applicantEmail: applicant.email,
      applicationDate: new Date().toLocaleDateString(),
      applicantsLink: `${process.env.CLIENT_URL}/job/${job._id}/applicants`,
    },
  })
}

export const sendStatusUpdateNotification = async (user, job, status) => {
  const statusMessages = {
    pending: "is being reviewed",
    reviewed: "has been reviewed",
    interviewed: "has moved to the interview stage",
    rejected: "was not selected",
    offered: "has resulted in a job offer",
    hired: "has been accepted and you have been hired",
  }

  await sendEmail({
    to: user.email,
    subject: `Application Status Update: ${job.title} at ${job.company}`,
    template: "status-update",
    templateData: {
      userName: user.firstName,
      jobTitle: job.title,
      companyName: job.company,
      statusMessage: statusMessages[status] || "has been updated",
      status: status.charAt(0).toUpperCase() + status.slice(1),
      jobLink: `${process.env.CLIENT_URL}/jobs/${job._id}`,
      dashboardLink: `${process.env.CLIENT_URL}/applied-jobs`,
    },
  })
}
