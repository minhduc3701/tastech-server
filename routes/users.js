var express = require('express')
var router = express.Router()
var passport = require('passport')
var User = require('../models/user')
var jwt = require('jsonwebtoken')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource')
})

router.post('/', function(req, res) {
  var user = new User({
    email: req.body.email,
    passwd: req.body.passwd
  })

  user
    .save()
    .then(() => {
      res.status(200).send(user)
    })
    .catch(() => {
      res.status(400).send()
    })
})

router.post('/login', function(req, res, next) {
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
      const token = jwt.sign(user.toJSON(), 'your_jwt_secret').toString()
      return res.json({ user, token })
    })
  })(req, res)
})

module.exports = router
