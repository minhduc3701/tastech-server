var express = require('express')
var router = express.Router()
var Request = require('../models/request')

router.post('/', function(req, res, next) {
  const request = new Request(req.body)
  request
    .save()
    .then(() => {
      res.status(200).json(request)
    })
    .catch(e => {
      res.status(400).send(e)
    })
})

module.exports = router
