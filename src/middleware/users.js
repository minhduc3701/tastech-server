const passport = require('passport')
const User = require('../models/user')
const async = require('async')
const { mail } = require('../config/mail')
const { register } = require('../mailTemplates/register')
const { debugMail } = require('../config/debug')
const crypto = require('crypto')

const createUser = function(req, res, next) {
  async.waterfall(
    [
      function(done) {
        User.register(
          new User({
            username: req.body.email,
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
        user.resetPasswordExpires = Date.now() + 3600000 // 1 hour
        user
          .save()
          .then(() => {
            done(null, user, token)
          })
          .catch(e => {
            done(e)
          })
      },
      function(user, token, done) {
        let mailOptions = register(user, token)
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

module.exports = {
  createUser
}
