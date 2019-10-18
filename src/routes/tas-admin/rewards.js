var express = require('express')
var router = express.Router()
const _ = require('lodash')
const Voucher = require('../../models/voucher')
const Reward = require('../../models/reward')
const User = require('../../models/user')
const { ObjectID } = require('mongodb')
const moment = require('moment')

router.post('/', async (req, res) => {
  try {
    let rewardData = {
      ...req.body,
      expiredDate: moment(req.body.expiredDate, 'DD-MM-YYYY').format(
        'YYYY-MM-DD'
      )
    }

    let reward = new Reward(rewardData)
    await reward.save()

    res.status(200).send({ reward })
  } catch (error) {
    res.status(400).send()
  }
})

router.get('/', async (req, res) => {
  try {
    Reward.find()
      .sort({ updatedAt: -1 })
      .then(rewards => res.status(200).send({ rewards }))
      .catch(error => {
        console.log(error)
        res.status(400).send()
      })
  } catch (error) {
    res.status(400).send()
  }
})

router.get('/:id', (req, res) => {
  Reward.findOne({
    _id: req.params.id
  })
    .then(reward => res.status(200).send({ reward }))
    .catch(error => res.status(400).send())
})

router.patch('/:id', (req, res) => {
  if (!ObjectID.isValid(req.params.id)) {
    return res.status(404).send()
  }

  let rewardData = _.pick(req.body, [
    'title',
    'image',
    'description',
    'brand',
    'brandImage',
    'categoryName',
    'price',
    'pricePoint',
    'currency',
    'content',
    'note',
    'office',
    'supplier',
    'country',
    'expiredDate'
  ])

  rewardData = {
    ...rewardData,
    expiredDate: moment(rewardData.expiredDate, 'DD-MM-YYYY').format(
      'YYYY-MM-DD'
    )
  }

  Reward.findOneAndUpdate(
    { _id: req.params.id },
    { $set: rewardData },
    { new: true }
  )
    .then(reward => {
      if (!reward) {
        return res.status(404).send()
      }

      res.status(200).send({ reward })
    })
    .catch(error => {
      res.status(400).send()
    })
})

module.exports = router
