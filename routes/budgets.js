var express = require('express')
var router = express.Router()
var Budget = require('../models/budget')

router.post('/', function(req, res, next) {
  const budget = new Budget(req.body)
  budget._creator = req.user._id
  budget._company = req.user._company
  budget
    .save()
    .then(() => {
      res.status(200).json({ budget })
    })
    .catch(e => {
      res.status(400).send()
    })
})

router.get('/', function(req, res, next) {
  Budget.find({
    _creator: req.user._id
  })
    .then(budgets => {
      res.status(200).json({ budgets })
    })
    .catch(e => {
      res.status(400).send()
    })
})
router.get('/:id', function(req, res, next) {
  Budget.find({
    _creator: req.user._id,
    _id: req.params.id
  })
    .then(budget => {
      res.status(200).json({ budget })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
