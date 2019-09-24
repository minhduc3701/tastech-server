var express = require('express')
var router = express.Router()
const _ = require('lodash')
const Gift = require('../models/gift')
const User = require('../models/user')
const apiUrbox = require('../modules/apiUrbox')

let data = {
  app_id: process.env.URBOX_ID,
  app_secret: process.env.URBOX_SECRET
}

router.get('/gifts', async (req, res) => {
  try {
    let resData = await apiUrbox.getGifts(data)

    if (resData.data.msg === 'success') {
      res.status(200).send({
        gifts: resData.data.data.items
      })
    }
  } catch (error) {
    res.status(400).send()
  }
})

router.post('/voucher', async (req, res) => {
  try {
    const giftPrice = parseInt(req.body.price)
    const transaction = require('order-id')(process.env.URBOX_SECRET)
    const transactionId = transaction.generate()

    data = {
      ...data,
      ttphone: req.user.phone,
      ttemail: req.user.email,
      fullname: req.user.firstName + ' ' + req.user.lastName,
      site_user_id: 'ezbiztrip-' + req.user.id,
      transaction_id: transactionId,
      dataBuy: [
        {
          priceId: req.body.id,
          quantity: '1'
        }
      ]
    }

    if (req.user.point >= giftPrice) {
      let resData = await apiUrbox.requestVoucher(data)
      let remainingPoints = req.user.point - giftPrice

      if (resData.data.msg === 'success') {
        let gift = new Gift({
          owner: req.user._id,
          pay: resData.data.data.pay,
          transactionId: resData.data.data.transaction_id,
          cart: resData.data.data.cart
        })
        await gift.save()

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
              remainingPoints: user.point
            })
          })
          .catch(e => {
            return res.status(400).send()
          })
      }
    } else {
      res.status(200).send({
        message: 'not enough points to redeem this voucher'
      })
    }
  } catch (error) {
    res.status(400).send()
  }
})

module.exports = router
