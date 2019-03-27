const express = require('express')
const router = express.Router()
const User = require('../models/user')

router.get('/', function(req, res) {
  User.find({})
    .then(users => res.status(200).send({ users }))
    .catch(e => res.status(400).send())
})

module.exports = router
