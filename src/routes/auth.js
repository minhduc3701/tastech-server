var express = require('express')
var router = express.Router()
var passport = require('passport')
var User = require('../models/user')
var Company = require('../models/company')
var jwt = require('jsonwebtoken')
const crypto = require('crypto')
const async = require('async')
const { mail } = require('../config/mail')
const { debugMail } = require('../config/debug')
const { forgotPassword } = require('../mailTemplates/forgotPassword')
const { verifyRecaptcha } = require('../middleware/recaptcha')
const _ = require('lodash')

router.post('/login', verifyRecaptcha, function(req, res, next) {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({
      message: 'Something is not right with your input'
    })
  }
  passport.authenticate(
    'local',
    { session: false },
    async (err, user, info) => {
      if (err || !user) {
        return res.status(400).json({
          message: 'Something is not right',
          user: user
        })
      }

      // disabled user
      if (user.disabled) {
        return res.status(400).send()
      }

      // disabled company
      let company = await Company.findById(user._company)
      if (company.disabled) {
        return res.status(400).send()
      }

      req.login(user, { session: false }, err => {
        if (err) {
          return res.send(err)
        }

        // store last login date
        user.lastLoginDate = Date.now()
        user.save()

        // generate a signed son web token with the contents of user object and return it in the response
        const token = jwt.sign(
          {
            id: user.id,
            email: user.username,
            // @see https://www.npmjs.com/package/jsonwebtoken
            // @see https://stackoverflow.com/a/45207528
            // Expires in 3 days
            expiresIn: process.env.JWT_EXPIRES_IN
          },
          process.env.JWT_SECRET
        )

        User.findById(user.id)
          .populate('_role')
          .then(user => {
            return res.json({
              user,
              token
            })
          })
      })
    }
  )(req, res)
})

router.post('/forgot-password', verifyRecaptcha, (req, res) => {
  async.waterfall(
    [
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex')
          done(err, token)
        })
      },
      function(token, done) {
        User.findOneAndUpdate(
          {
            email: req.body.email
          },
          {
            $set: {
              resetPasswordToken: token,
              resetPasswordExpires: Date.now() + 3600000 // 1 hour
            }
          },
          {
            new: true
          }
        )
          .then(user => {
            if (!user) {
              return res.status(404).send({
                message: 'User not found.'
              })
            }

            res.status(200).send({
              email: user.email
            })
            done(null, token, user)
          })
          .catch(e => {
            done(e)
          })
      },
      async function(token, user, done) {
        let mailOptions = await forgotPassword(req.headers.origin, user, token)
        mail.sendMail(mailOptions, function(err, info) {
          done(err, user)
        })
      }
    ],
    function(err, user) {
      if (err) {
        debugMail(err)
      }
    }
  )
})

router.get('/reset-password/:token', function(req, res) {
  User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  })
    .then(user => {
      if (!user) {
        return res.status(400).send({
          message: 'Password reset token is invalid or has expired.'
        })
      }

      res.status(200).send({
        message: 'Password reset token is valid.',
        user: {
          email: user.email
        }
      })
    })
    .catch(e => {
      res.status(400).send({
        message: 'Password reset token is invalid or has expired.'
      })
    })
})

router.post('/reset-password/:token', verifyRecaptcha, function(req, res) {
  User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  })
    .then(user => {
      user.setPassword(req.body.newPassword).then(() => {
        user.resetPasswordToken = undefined
        user.resetPasswordExpires = undefined
        user.save().then(() => {
          res.status(200).send({
            message: 'Reset password successfully.'
          })
        })
      })
    })
    .catch(e => {
      res.status(400).send({
        message: 'Password reset token is invalid or has expired.'
      })
    })
})

module.exports = router
