var express = require('express')
var router = express.Router()
const User = require('../models/user')
const Company = require('../models/company')
const Policy = require('../models/policy')
const Role = require('../models/role')
const { fileUpload } = require('../config/aws')
const upload = fileUpload('avatar')
const singleUpload = upload.single('image')
const _ = require('lodash')
const { currentCompany } = require('../middleware/company')
const { getUserProfileStrength } = require('../modules/utils')

router.get('/me', currentCompany, function(req, res, next) {
  User.findById(req.user.id)
    .populate('_role')
    .populate('_company')
    .populate('_department')
    .populate('_policy')
    .then(user => {
      return Promise.all([
        user,
        User.findById(user._department._approver).then(doc => {
          return doc
        })
      ])
    })
    .then(result => {
      let userNew = result[0]
      userNew._department._approver = result[1]
      return res.send({
        user: userNew,
        profileStrength: getUserProfileStrength(req.user),
        currency: req.company.currency,
        baseCurrency: process.env.BASE_CURRENCY,
        exchangedRate: req.company.exchangedRate
      })
    })
})

router.get('/me/company', function(req, res, next) {
  Company.findById({
    _id: req.user._company
  })
    .then(company =>
      res.status(200).send({
        company: _.pick(company, ['payment', 'exchangedRate', 'tourCodes'])
      })
    )
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
    'allowNotification',
    'notExceedBudget',
    'preferenceFlight',
    'preferenceHotel',
    'favoriteHotels'
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
        user,
        profileStrength: getUserProfileStrength(user)
      })
    })
    .catch(e => res.status(400).send())
})

router.post('/me/avatar', function(req, res) {
  singleUpload(req, res, function(err, some) {
    if (err) {
      return res.status(422).send({
        code: err.code
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
          avatar: req.file.location,
          profileStrength: getUserProfileStrength(user)
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

  if (oldPassword === password) {
    return res.status(400).send({
      message:
        'Your new password is similar to current password. Please try another password.'
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

router.post('/search', async (req, res) => {
  let email = _.toLower(_.trim(req.body.email))

  let filterType = {}
  let { type } = req.body

  if (Array.isArray(type)) {
    let roles = await Role.find({
      _company: req.user._company,
      type: { $in: type }
    })

    roles = roles.map(({ _id }) => _id)
    filterType = {
      _role: { $in: roles }
    }
  }

  // @see https://stackoverflow.com/questions/3305561/how-to-query-mongodb-with-like
  // @see https://stackoverflow.com/questions/26699885/how-can-i-use-a-regex-variable-in-a-query-for-mongodb
  User.find({
    _company: req.user._company,
    $or: [
      {
        email: {
          $regex: new RegExp(email),
          $options: 'i'
        }
      },
      {
        firstName: {
          $regex: new RegExp(email),
          $options: 'i'
        }
      },
      {
        lastName: {
          $regex: new RegExp(email),
          $options: 'i'
        }
      }
    ],
    ...filterType
  })
    .limit(100)
    .then(users => {
      users = users.map(user =>
        _.omit(user.toJSON(), [
          'preferenceFlight',
          'preferenceHotel',
          'favoriteHotels',
          'passports'
        ])
      )
      res.status(200).send({ users })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
