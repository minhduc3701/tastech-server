const express = require('express')
const router = express.Router()
const ExpenseCategory = require('../models/expenseCategory')
const { DATA_CATEGORY_DEFAULT } = require('../modules/utils')

router.get('/', (req, res) => {
  ExpenseCategory.find({})
    .then(data => {
      res
        .status(200)
        .send({ expenseCategories: [...DATA_CATEGORY_DEFAULT, ...data] })
    })
    .catch(err => {
      res.status(400).send()
    })
})

module.exports = router
