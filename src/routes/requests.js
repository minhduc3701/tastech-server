var express = require('express')
var router = express.Router()
var Request = require('../models/request')
const _ = require('lodash')
const { mail } = require('../config/mail')
const { debugMail } = require('../config/debug')
const { requestDemo } = require('../mailTemplates/requestDemo')
const { requestDemoFeedback } = require('../mailTemplates/requestDemoFeedback')
const { contact } = require('../mailTemplates/contact')
const { verifyRecaptcha } = require('../middleware/recaptcha')

router.post('/', verifyRecaptcha, function(req, res, next) {
  const request = new Request(req.body)
  request
    .save()
    .then(async () => {
      res.status(200).json({ request })

      let mailOptions = requestDemo(request)
      mail.sendMail(mailOptions, function(err, info) {
        if (err) {
          debugMail(err)
          res.status(400).send()
        }
      })

      let mailFeedbackOptions = await requestDemoFeedback(
        req.headers.origin,
        request
      )
      mail.sendMail(mailFeedbackOptions, function(err, info) {
        if (err) {
          debugMail(err)
          res.status(400).send()
        }
      })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.post('/contact', verifyRecaptcha, function(req, res) {
  try {
    let data = _.pick(req.body, [
      'firstName',
      'lastName',
      'email',
      'phone',
      'message'
    ])
    let mailOptions = contact(data)
    mail.sendMail(mailOptions, function(err, info) {
      if (err) {
        debugMail(error)
        res.status(400).send()
      }
      res.status(200).send()
    })
  } catch (error) {
    res.status(400).send()
  }
})

module.exports = router
