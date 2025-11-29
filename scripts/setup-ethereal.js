import nodemailer from "nodemailer"

async function setupEtherealAccount() {
  try {
    // Create a test account on Ethereal
    const testAccount = await nodemailer.createTestAccount()

    console.log("Ethereal Email account created successfully:")
    console.log("Email:", testAccount.user)
    console.log("Password:", testAccount.pass)
    console.log("\nAdd these to your .env file as:")
    console.log(`DEV_EMAIL_USER=${testAccount.user}`)
    console.log(`DEV_EMAIL_PASS=${testAccount.pass}`)

    // Create a transporter to test the connection
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })

    // Send a test email
    const info = await transporter.sendMail({
      from: '"Test Sender" <test@example.com>',
      to: testAccount.user,
      subject: "Test Email",
      text: "This is a test email to verify Ethereal account setup.",
      html: "<b>This is a test email to verify Ethereal account setup.</b>",
    })

    console.log("\nTest email sent successfully!")
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info))
  } catch (error) {
    console.error("Error setting up Ethereal account:", error)
  }
}

setupEtherealAccount()
