var express = require('express')
var router = express.Router()
var Request = require('../models/request')
const Company = require('../models/company')
const User = require('../models/user')
const _ = require('lodash')
const { mail } = require('../config/mail')
const { debugMail } = require('../config/debug')
const { requestDemo } = require('../mailTemplates/requestDemo')
const { requestDemoFeedback } = require('../mailTemplates/requestDemoFeedback')
const { contact } = require('../mailTemplates/contact')
const { verifyRecaptcha } = require('../middleware/recaptcha')
const Role = require('../models/role')
const Policy = require('../models/policy')
const Department = require('../models/department')
const { roles } = require('../config/roles')
const api = require('../modules/api')
const { createUser } = require('../middleware/users')
const { makeDefaultPolicy } = require('../modules/utils')

router.post(
  '/',
  verifyRecaptcha,
  function(req, res, next) {
    const request = new Request(req.body)
    request
      .save()
      .then(async () => {
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
        const user = await User.findOne({ email: req.body.email })
        if (user) return res.status(200).json({ request })
        let company = new Company({
          // _creator: req.user._id,
          name: req.body.company,
          currency: process.env.BASE_CURRENCY
        })

        company
          .save()
          .then(company => {
            req.body._company = company._id
            return Role.insertMany(
              roles.map(role => ({
                ...role,
                _company: company._id
              }))
            )
          })
          .then(roles => {
            req.body._role = (
              roles.find(v => v.type === 'admin') || roles[0]
            )._id
            return api.currency(company.currency)
          })
          .then(currency => {
            let rate = currency.data[0].rate
            let policy = new Policy(makeDefaultPolicy(company._id, rate))
            return policy.save()
          })
          .then(policy => {
            company._policy = policy._id
            req.body._policy = policy._id
            return company.save()
          })
          .then(async company => {
            req.body = _.pick(req.body, [
              'age',
              'firstName',
              'lastName',
              'phone',
              '_company',
              '_role',
              'email',
              '_policy'
            ])
            const adminUser = await User.findOne({
              email: 'tas-admin@tastech.asia'
            })
            req.user = adminUser
            req.admin = adminUser
            next()
          })
          .catch(e => {
            res.status(400).send()
          })
      })
      .catch(e => {
        res.status(400).send()
      })
  },
  createUser,
  async (req, res) => {
    // create Default Department
    try {
      Department.create({
        name: 'Default Department',
        _company: req.body._company,
        status: 'default',
        _approver: req.user._id
      })
    } catch (error) {}
  }
)

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
