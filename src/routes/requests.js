var express = require('express')
var router = express.Router()
var Request = require('../models/request')
const _ = require('lodash')
const { mail } = require('../config/mail')
const { debugMail } = require('../config/debug')
const { requestDemo } = require('../mailTemplates/requestDemo')
const { contact } = require('../mailTemplates/contact')

router.post('/', function(req, res, next) {
  const request = new Request(req.body)
  request
    .save()
    .then(() => {
      res.status(200).json({ request })
      let mailOptions = requestDemo(request)
      mail.sendMail(mailOptions, function(err, info) {
        if (err) {
          debugMail(error)
          res.status(400).send()
        }
      })
    })
    .catch(e => {
      console.log(e)
      res.status(400).send()
    })
})
router.post('/contact', function(req, res) {
  try {
    let { data } = req.body
    data = _.pick(data, ['firstName', 'lastName', 'email', 'phone', 'message'])
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
