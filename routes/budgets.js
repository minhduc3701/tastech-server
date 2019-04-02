var express = require('express')
var router = express.Router()
var Budget = require('../models/budget')

router.post('/', function(req, res, next) {
  const request = new Budget(req.body)
  ;(request._creator = req.user._id),
    request
      .save()
      .then(() => {
        res.status(200).json(Budget)
      })
      .catch(e => {
        res.status(400).send()
      })
})

module.exports = router
