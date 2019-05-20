const passport = require('passport')
const User = require('../models/user')
const async = require('async')
const { mail } = require('../config/mail')
const mailTemplates = require('../config/mailTemplates.js')
const { debugMail } = require('../config/debug')
const debug = require('debug')(debugMail)

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
        let mailOptions = mailTemplates.register(user)
        mail.sendMail(mailOptions, function(err, info) {
          return done(err, user)
        })
      }
    ],
    function(err, user) {
      if (err) {
        debug(err)
      }
    }
  )
}

module.exports = {
  createUser
}
