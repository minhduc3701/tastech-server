var express = require('express')
var router = express.Router()
const _ = require('lodash')
const Gift = require('../models/gift')
const User = require('../models/user')
const apiUrbox = require('../modules/apiUrbox')
const { makeGiftData } = require('../modules/utils')

let urboxKey = {
  app_id: process.env.URBOX_ID,
  app_secret: process.env.URBOX_SECRET
}

router.post('/gifts', async (req, res) => {
  try {
    let reqBody = { ...urboxKey, ...req.body }
    let resData = await apiUrbox.getGifts(reqBody)

    if (resData.data.msg === 'success') {
      let gifts = resData.data.data.items.map(makeGiftData)
      res.status(200).send({
        gifts: gifts,
        totalPage: resData.data.data.totalPage
      })
    }
  } catch (error) {
    res.status(400).send()
  }
})

router.post('/voucher', async (req, res) => {
  try {
    const giftPrice = parseInt(req.body.price)
    const siteUserId = 'ezbiztrip-' + req.user.id
    const transaction = require('order-id')(process.env.URBOX_SECRET)
    const transactionId = transaction.generate()

    let reqBody = {
      ...urboxKey,
      ttphone: req.body.customerInfo.phone,
      ttemail: req.body.customerInfo.email,
      fullname: req.body.customerInfo.fullname,
      site_user_id: siteUserId,
      transaction_id: transactionId,
      dataBuy: [
        {
          priceId: req.body.giftId,
          quantity: '1'
        }
      ]
    }

    if (req.user.point >= giftPrice) {
      let resData = await apiUrbox.requestVoucher(reqBody)

      if (resData.data.msg === 'success') {
        let remainingPoints = req.user.point - giftPrice / 1000
        let giftData = {
          ...req.body,
          buyer: req.user.id,
          site_user_id: siteUserId,
          transaction_id: transactionId,
          quantity: 1,
          pricePoint: giftPrice / 1000,
          currency: 'VND',
          cartId: resData.data.data.cart.id,
          cartNumber: resData.data.data.cart.cartNo,
          cartTotal: resData.data.data.cart.money_total,
          cartGiftLink: resData.data.data.cart.link_gift,
          cartGiftLinkCode: resData.data.data.cart.code_link_gift
        }

        let gift = new Gift(giftData)
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
