var express = require('express')
var router = express.Router()
const _ = require('lodash')
const Voucher = require('../../models/voucher')
const Reward = require('../../models/reward')
const User = require('../../models/user')
const { ObjectID } = require('mongodb')
const moment = require('moment')

let urboxKey = {
  app_id: process.env.URBOX_ID,
  app_secret: process.env.URBOX_SECRET
}

router.post('/ezbt', async (req, res) => {
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

router.get('/ezbt', async (req, res) => {
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

router.get('/ezbt/:id', (req, res) => {
  Reward.findOne({
    _id: req.params.id
  })
    .then(reward => res.status(200).send({ reward }))
    .catch(error => res.status(400).send())
})

router.patch('/ezbt/:id', (req, res) => {
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

router.post('/ezbt/exchange', async (req, res) => {
  try {
    const giftPrice = parseInt(req.body.price)
    const siteUserId = 'ezbiztrip-' + req.user.id
    const transaction = require('order-id')(process.env.URBOX_SECRET)
    const transactionId = 'ezbiztrip-' + transaction.generate()

    let reqBody = {
      ttphone: process.env.URBOX_EZBIZTRIP_PHONE,
      ttemail: process.env.URBOX_EZBIZTRIP_EMAIL,
      fullname: process.env.URBOX_EZBIZTRIP_NAME,
      site_user_id: siteUserId,
      transaction_id: transactionId,
      dataBuy: [
        {
          priceId: req.body.id,
          quantity: '1'
        }
      ]
    }

    if (req.user.point < giftPrice / 1000) {
      return res.status(400).send({
        message: 'not enough points to redeem this voucher'
      })
    }

    let resData = await apiUrbox.requestVoucher(reqBody)

    if (resData.data.msg === 'success') {
      let remainingPoints = req.user.point - giftPrice / 1000
      let voucherData = {
        ...req.body,
        _buyer: req.user.id,
        siteUserId,
        transactionId,
        quantity: 1,
        pricePoint: giftPrice / 1000,
        currency: 'VND',
        content: req.body.content,
        note: req.body.note,
        office: req.body.office,
        cartId: resData.data.data.cart.id,
        cartNumber: resData.data.data.cart.cartNo,
        cartTotal: resData.data.data.cart.money_total,
        cartGiftLink: resData.data.data.cart.link_gift,
        cartGiftCode: resData.data.data.cart.code_link_gift[0].code,
        expiredDate: moment(
          resData.data.data.cart.code_link_gift[0].expired,
          'DD-MM-YYYY'
        ).format('YYYY-MM-DD')
      }

      let voucher = new Voucher(voucherData)
      await voucher.save()

      User.findByIdAndUpdate(
        req.user._id,
        { $set: { point: remainingPoints } },
        { new: true }
      )
        .then(user => {
          if (!user) {
            return res.status(404).send()
          }
          return res.status(200).send({
            data: resData.data.data,
            voucherId: voucher.id,
            remainingPoints: user.point
          })
        })
        .catch(e => {
          return res.status(400).send()
        })
    } else {
      res.status(400).send({
        res: resData.data
      })
    }
  } catch (error) {
    res.status(400).send()
  }
})

module.exports = router
