var express = require('express')
var router = express.Router()
var passport = require('passport')
var User = require('../models/user')
var jwt = require('jsonwebtoken')
const { ObjectID } = require('mongodb')
const crypto = require('crypto')
const async = require('async')
const { mail } = require('../config/mail')
const mailTemplates = require('../config/mailTemplates.js')
const { debugMail } = require('../config/debug')
const debug = require('debug')(debugMail)

router.post('/login', function(req, res, next) {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({
      message: 'Something is not right with your input'
    })
  }
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        message: 'Something is not right',
        user: user
      })
    }
    req.login(user, { session: false }, err => {
      if (err) {
        res.send(err)
      }
      // generate a signed son web token with the contents of user object and return it in the response
      const token = jwt.sign(
        { id: user.id, email: user.username },
        process.env.JWT_SECRET
      )
      return res.json({
        user,
        token
      })
    })
  })(req, res)
})

router.post('/forgot-password', function(req, res) {
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
              email: user.email,
              resetPasswordToken: user.resetPasswordToken
            })
            done(null, token, user)
          })
          .catch(e => {
            done(e)
          })
      },
      function(token, user, done) {
        let mailOptions = {
          to: user.email,
          from: 'no-reply@eztrip.com',
          subject: `Password Reset for ${user.email}`,
          text: mailTemplates.forgotPassword(token)
        }

        mail.sendMail(mailOptions, function(err, info) {
          done(err, user)
        })
      }
    ],
    function(err, user) {
      if (err) {
        debug(err)
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
        user
      })
    })
    .catch(e => {
      res.status(400).send({
        message: 'Password reset token is invalid or has expired.'
      })
    })
})

router.post('/reset-password/:token', function(req, res) {
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
