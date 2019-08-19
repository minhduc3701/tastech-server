var express = require('express')
var router = express.Router()
const User = require('../models/user')
const Company = require('../models/company')
const Policy = require('../models/policy')
const { upload } = require('../config/aws')
const singleUpload = upload.single('image')
const _ = require('lodash')
const { currentCompany } = require('../middleware/company')

// get list user coworker
router.get('/', function(req, res) {
  User.find({
    _company: req.user._company,
    _id: { $ne: req.user._id },
    _role: req.user._role
  })
    .then(users => res.status(200).send({ users }))
    .catch(e => res.status(400).send())
})

router.get('/me', currentCompany, function(req, res, next) {
  res.send({
    user: req.user,
    currency: req.company.currency
  })
})

router.get('/me/company', function(req, res, next) {
  Company.findById({
    _id: req.user._company
  })
    .then(company => res.status(200).send({ company }))
    .catch(e => res.status(400).send())
})

router.get('/me/point', function(req, res, next) {
  User.findById({
    _id: req.user._id
  })
    .then(users => res.status(200).send({ point: users.point }))
    .catch(e => res.status(400).send())
})

router.get('/me/policy', function(req, res, next) {
  Promise.all([
    Policy.find({
      _company: req.user._company
    }),
    Policy.findById(req.user._policy)
  ])
    .then(result => {
      let companyPolicies = result[0]
      let policy = result[1]
      if (policy && policy.status !== 'disabled') {
        res.status(200).send({ policy })
      } else {
        for (let index = 0; index < companyPolicies.length; index++) {
          if (companyPolicies[index]._doc.status === 'default') {
            policy = companyPolicies[index]
            break
          }
        }
        res.status(200).send({ policy })
      }
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.patch('/me', async (req, res) => {
  const body = _.pick(req.body, [
    'country',
    'displayName',
    'title',
    'firstName',
    'lastName',
    'phone',
    'dateOfBirth',
    'callingCode',
    'passports',
    'allowSearch',
    'allowNotification'
  ])

  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: body
    },
    {
      new: true
    }
  )
    .then(user => {
      if (!user) {
        return res.status(404).send()
      }

      res.status(200).send({
        user
      })
    })
    .catch(e => res.status(400).send())
})

router.post('/me/avatar', function(req, res) {
  singleUpload(req, res, function(err, some) {
    if (err) {
      return res.status(422).send({
        errors: [{ title: 'Image Upload Error', detail: err.message }]
      })
    }

    if (_.isEmpty(req.file)) {
      return res.status(400).send()
    }

    User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          avatar: req.file.key
        }
      },
      {
        new: true
      }
    )
      .then(user => {
        if (!user) {
          return res.status(404).send()
        }

        return res.status(200).send({
          email: user.email,
          avatar: req.file.location
        })
      })
      .catch(e => {
        return res.status(400).send()
      })
  })
})

router.patch('/me/password', (req, res) => {
  let oldPassword = req.body.oldPassword
  let password = req.body.password
  let confirmationPassword = req.body.confirmationPassword

  if (password !== confirmationPassword) {
    return res.status(400).send({
      message: 'Password mismatch.'
    })
  }

  req.user.authenticate(oldPassword, (err, user, passwordErr) => {
    if (passwordErr) {
      return res.status(400).send()
    }

    user
      .setPassword(password)
      .then(() => user.save())
      .then(() =>
        res.status(200).send({
          message: 'Changed password successfully.'
        })
      )
      .catch(e => {
        res.status(400).send()
      })
  })
})

router.post('/search', (req, res) => {
  let email = _.trim(req.body.email)

  // @see https://stackoverflow.com/questions/3305561/how-to-query-mongodb-with-like
  // @see https://stackoverflow.com/questions/26699885/how-can-i-use-a-regex-variable-in-a-query-for-mongodb
  let searchCondition = { _company: req.user._company }
  if (!_.isEmpty(email)) {
    searchCondition.email = new RegExp(email)
  }

  User.find(searchCondition)
    .limit(50)
    .then(users => {
      res.status(200).send({ users })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
