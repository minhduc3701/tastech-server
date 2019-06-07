const nodemailer = require('nodemailer')
const sgTransport = require('nodemailer-sendgrid-transport')

const options = {
  auth: {
    api_user: process.env.SENDGRID_USERNAME,
    api_key: process.env.SENDGRID_PASSWORD
  }
}

const sendgrid = nodemailer.createTransport(sgTransport(options))

let mail = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
})

if (process.env.NODE_ENV === 'production') {
  mail = sendgrid
}

module.exports = {
  mail
}
