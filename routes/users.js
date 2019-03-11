var express = require('express')
var router = express.Router()
var passport = require('passport')
var User = require('../models/user')

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource')
})

router.post('/', function(req, res) {
  User.register(
    new User({
      username: req.body.email
    }),
    req.body.passwd,
    function(err, user) {
      if (err) {
        res.status(400).send(err)
      }

      res.status(200).send(user)
    }
  )
})

router.post(
  '/login',
  passport.authenticate('local', { session: false }),
  function(req, res) {
    res.status(200).send(req.user)
  }
)

module.exports = router
