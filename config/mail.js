const nodemailer = require('nodemailer')
const nodemailerSendgrid = require('nodemailer-sendgrid')

let mail

if (process.env.NODE_ENV === 'production') {
  mail = nodemailer.createTransport(
    nodemailerSendgrid({
      apiKey: process.env.SENDGRID_API_KEY
    })
  )
} else {
  mail = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  })
}

module.exports = {
  mail
}
