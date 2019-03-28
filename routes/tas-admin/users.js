const express = require('express')
const router = express.Router()
const User = require('../../models/user')
const { createUser } = require('../../middleware/users')

router.get('/', function(req, res) {
  User.find({})
    .then(users => res.status(200).send({ users }))
    .catch(e => res.status(400).send())
})

router.post('/', createUser)

module.exports = router
