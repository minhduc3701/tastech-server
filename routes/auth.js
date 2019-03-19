var express = require('express')
var router = express.Router()
var passport = require('passport')
var User = require('../models/user')
var jwt = require('jsonwebtoken')
const { ObjectID } = require('mongodb')
const crypto = require('crypto')
const async = require('async')
const nodemailer = require('nodemailer')
const sgTransport = require('nodemailer-sendgrid-transport')

router.post('/register', function(req, res) {
  User.register(
    new User({
      username: req.body.email,
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName
    }),
    req.body.password,
    function(err, account) {
      if (err) {
        return res.status(500).send('An error occurred: ' + err)
      }

      passport.authenticate('local', {
        session: false
      })(req, res, () => {
        res.status(200).send('Successfully created new account')
      })
    }
  )
})

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
      return res.json({ email: user.username, token })
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
              return res.status(404).send()
            }

            done(null, token, user)
          })
          .catch(e => {
            done(e)
          })
      },
      function(token, user, done) {
        var options = {
          auth: {
            api_user: process.env.SENDGRID_USERNAME,
            api_key: process.env.SENDGRID_PASSWORD
          }
        }

        var client = nodemailer.createTransport(sgTransport(options))
        var mailOptions = {
          to: user.email,
          from: 'no-reply@eztrip.com',
          subject: `Password Reset for ${user.email}`,
          text:
            'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' +
            req.headers.host +
            '/reset-password/' +
            token +
            '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        }

        client.sendMail(mailOptions, function(err, info) {
          done(err, user)
        })
      }
    ],
    function(err, user) {
      if (err) {
        return res.status(400).send(err)
      }

      res.status(200).send({ user })
    }
  )
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
          res.status(200).send('Reset password successfully')
        })
      })
    })
    .catch(e => {
      res.status(400).send('Password reset token is invalid or has expired.')
    })
})

module.exports = router
