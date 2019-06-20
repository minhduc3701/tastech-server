var express = require('express')
var router = express.Router()
var Request = require('../models/request')
const _ = require('lodash')
const mailTemplates = require('../config/mailTemplates')
const { mail } = require('../config/mail')

router.post('/', function(req, res, next) {
  const request = new Request(req.body)
  request
    .save()
    .then(() => {
      res.status(200).json({ request })
    })
    .catch(e => {
      res.status(400).send()
    })
})
router.post('/contact', function(req, res) {
  try {
    let { data } = req.body
    data = _.pick(data, ['firstName', 'lastName', 'email', 'phone', 'message'])
    let mailOptions = mailTemplates.contact(data)
    mail.sendMail(mailOptions, function(err, info) {
      if (err) {
        res.status(400).send()
      }
      res.status(200).send()
    })
  } catch (error) {
    res.status(400).send()
  }
})

module.exports = router
