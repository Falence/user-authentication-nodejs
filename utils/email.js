const nodemailer = require('nodemailer')

const sendEmail = async options => {
    // create a transporter
    const transporter = nodemailer.createTransport({
        port: process.env.EMAIL_PORT,
        host: process.env.EMAIL_HOST,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    })

    // define the email options
    const mailOptions = {
        from: process.env.EMAIL_SENDER,
        to: options.email,
        subject: options.subject,
        text: options.message
    }

    // send the email
    await transporter.sendMail(mailOptions)
}

module.exports = sendEmail
