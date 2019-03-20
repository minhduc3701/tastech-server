var express = require('express')
var router = express.Router()
var passport = require('passport')
var User = require('../models/user')
var jwt = require('jsonwebtoken')

router.post('/register', function(req, res) {
  User.register(
    new User({
      username: req.body.email,
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
      console.log('1')
      return res.status(400).json({
        message: 'Something is not right',
        user: user
      })
    }
    req.login(user, { session: false }, err => {
      if (err) {
        console.log(err)
        res.send(err)
      }
      // generate a signed son web token with the contents of user object and return it in the response
      const token = jwt.sign(
        { id: user.id, email: user.username },
        'ILovePokemon'
      )
      return res.json({ user: user.username, token })
    })
  })(req, res)
})

module.exports = router
