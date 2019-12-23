const passport = require('passport')
const User = require('../models/user')
const Role = require('../models/role')
const Department = require('../models/department')
const Policy = require('../models/policy')
const { ObjectID } = require('mongodb')
const async = require('async')
const { mail } = require('../config/mail')
const { register } = require('../mailTemplates/register')
const { debugMail } = require('../config/debug')
const crypto = require('crypto')
const _ = require('lodash')

const createUser = function(req, res, next) {
  async.waterfall(
    [
      function(done) {
        User.register(
          new User({
            username: req.body.email,
            _partner: req.user._partner, // partnerId or null for tas flow
            ...req.body
          }),
          req.body.password,
          function(err, account) {
            if (err) {
              return res.status(500).send(err)
            }

            passport.authenticate('local', {
              session: false
            })(req, res, () => {
              res.status(200).send({
                message: 'Successfully created new account',
                user: req.user
              })
              next()
              return done(null, req.user)
            })
          }
        )
      },
      function(user, done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex')
          done(err, user, token)
        })
      },
      function(user, token, done) {
        user.resetPasswordToken = token
        user.resetPasswordExpires = Date.now() + 24 * 7 * 60 * 60 * 1000 // 1 week
        user
          .save()
          .then(() => {
            done(null, user, token)
          })
          .catch(e => {
            done(e)
          })
      },
      async function(user, token, done) {
        await User.populate(user, { path: '_role' })
        await User.populate(req.admin, { path: '_role' })
        let mailOptions = await register(user, token, req.admin)
        mail.sendMail(mailOptions, function(err, info) {
          return done(err, user)
        })
      }
    ],
    function(err, user) {
      if (err) {
        debugMail(err)
      }
    }
  )
}

const validateUserProps = async (req, res, next) => {
  let checkParams = []
  try {
    let body = _.pick(req.body, ['_department', '_role', '_policy'])
    if (ObjectID.isValid(body._role)) {
      checkParams.push(
        Role.findOne({
          _id: body._role,
          _company: req.user._company
        })
      )
    }
    if (ObjectID.isValid(body._department)) {
      checkParams.push(
        Department.findOne({
          _id: body._department,
          _company: req.user._company
        })
      )
    }
    if (ObjectID.isValid(body._policy)) {
      checkParams.push(
        Policy.findOne({
          _id: body._policy,
          _company: req.user._company
        })
      )
    }
    let results = await Promise.all(checkParams)

    if (results.filter(result => !result).length > 0) {
      // if any result equal to null, return 404
      return res.status(400).send()
    }
  } catch (error) {
    return res.status(400).send()
  }
  next()
}

module.exports = {
  createUser,
  validateUserProps
}
