var express = require('express')
var router = express.Router()
const User = require('../models/user')
const _ = require('lodash')

router.post('/coworker', (req, res) => {
  User.find({
    email: new RegExp(req.body.s, 'i'),
    _company: req.user._company,
    _role: req.user._role
  })
    .limit(10)
    .then(users => {
      res.status(200).send({ users })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
