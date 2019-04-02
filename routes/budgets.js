var express = require('express')
var router = express.Router()
var Budget = require('../models/budget')
router.get('/', function(req, res, next) {
  Budget.find({
    _creator: req.user._id
  })
    .then(budget => {
      res.send({ Budget })
    })
    .catch(e => {
      res.send()
    })
})
router.post('/', function(req, res, next) {
  const budget = new Budget(req.body)
  budget._creator = req.user._id,
  budget
    .save()
    .then(() => {
      res.status(200).json({budget})
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
