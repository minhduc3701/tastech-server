const express = require('express')
const router = express.Router()
const { ObjectID } = require('mongodb')
const ExpenseCategory = require('../../models/expenseCategory')
const { DATA_CATEGORY_DEFAULT } = require('../../modules/utils')

router.get('/', (req, res) => {
  ExpenseCategory.find({})
    .then(data => {
      res
        .status(200)
        .send({ expenseCategories: [...DATA_CATEGORY_DEFAULT, ...data] })
    })
    .catch(err => {
      console.log('err', err)
      res.status(400).send()
    })
})

router.post('/', (req, res) => {
  let { name } = req.body
  ExpenseCategory.create({
    name,
    _company: req.user._company,
    _creator: req.user._id
  })
    .then(data => {
      res.status(200).send({ expenseCategory: data })
    })
    .catch(err => {
      console.log('err', err)
      res.status(400).send()
    })
})

router.delete('/:id', (req, res, next) => {
  let id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  ExpenseCategory.findOneAndDelete({
    _id: req.params.id,
    _company: req.user._company
  })
    .then(expenseCategory => {
      if (!expenseCategory) return res.status(404).send()
      res.status(200).send({ expenseCategory })
    })
    .catch(e => {
      res.status(400).send()
    })
})

module.exports = router
