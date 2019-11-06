const nodemailer = require('nodemailer')
const nodemailerSendgrid = require('nodemailer-sendgrid')
const inLineCss = require('nodemailer-juice')
const path = require('path')
const pug = require('pug')

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

// https://github.com/niftylettuce/email-templates/issues/303#issuecomment-393605176
// https://www.npmjs.com/package/juice#options
// https://www.npmjs.com/package/web-resource-inliner#options
mail.use(
  'compile',
  inLineCss({
    webResources: {
      images: false
    }
  })
)

// render mail template util function
const MAIL_TEMPLATES_DIRECTORY = path.join(
  __dirname,
  '..',
  '/views/mails/contents'
)

const renderMail = (file, data) => {
  return new Promise((resolve, reject) => {
    pug.renderFile(
      `${MAIL_TEMPLATES_DIRECTORY}/${file}.pug`,
      data,
      (err, html) => {
        if (err) {
          reject(err)
        }
        resolve(html)
      }
    )
  })
}

module.exports = {
  mail,
  renderMail
}
