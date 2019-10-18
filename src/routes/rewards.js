var express = require('express')
var router = express.Router()
const _ = require('lodash')
const Voucher = require('../models/voucher')
const Reward = require('../models/reward')
const User = require('../models/user')
const { ObjectID } = require('mongodb')
const apiUrbox = require('../modules/apiUrbox')
const { makeUrboxGiftData } = require('../modules/utils')
const moment = require('moment')

let urboxKey = {
  app_id: process.env.URBOX_ID,
  app_secret: process.env.URBOX_SECRET
}

router.post('/', async (req, res) => {
  try {
    if (req.body.country === 'vietnam') {
      let reqBody = { ...urboxKey, ...req.body }
      let resData = await apiUrbox.getGifts(reqBody)

      let filterData = await apiUrbox.getGiftFilter(urboxKey)
      let filter = filterData.data.data.items

      if (resData.data.msg === 'success' && filterData.data.msg === 'success') {
        let gifts = resData.data.data.items.map(makeUrboxGiftData)

        Reward.aggregate([
          {
            $group: {
              _id: '$country'
            }
          }
        ])
          .then(countries => {
            countries = countries.map(country => {
              return {
                value: country._id,
                label: country._id
              }
            })
            countries.unshift({ value: 'vietnam', label: 'Vietnam' })

            let categories = filter['CATEGORIES'].value.map(cat => {
              return {
                value: cat.id,
                label: cat.title
              }
            })
            categories.unshift({ value: '', label: 'All' })

            let brands = filter['BRANDS'].value.map(brand => {
              return {
                value: brand.id,
                label: brand.title
              }
            })
            brands.unshift({ value: '', label: 'All' })

            res.status(200).send({
              countries,
              categories,
              brands,
              gifts: gifts,
              totalPage: resData.data.data.totalPage
            })
          })
          .catch(error => {
            res.status(400).send()
          })
      } else {
        res.status(200).send({
          gifts: [],
          totalPage: 0
        })
      }
    } else {
      let perPage = parseInt(req.body.per_page)
      let page = Math.max(0, parseInt(req.body.page_no))

      let options = {
        country: req.body.country
      }
      if (req.body.cat_id) {
        options['cat_id'] = req.body.cat_id
      }
      if (req.body.brand_id) {
        options['brand_id'] = req.body.brand_id
      }

      Promise.all([
        Reward.find(options)
          .limit(perPage)
          .skip(perPage * page)
          .sort({ updatedAt: -1 }),
        Reward.countDocuments(options),
        Reward.aggregate([
          {
            $match: {
              country: req.body.country
            }
          },
          {
            $group: {
              _id: '$categoryName'
            }
          }
        ]),
        Reward.aggregate([
          {
            $match: {
              country: req.body.country
            }
          },
          {
            $group: {
              _id: '$brand'
            }
          }
        ])
      ])
        .then(results => {
          let gifts = results[0]
          let totalPage = Math.ceil(results[1] / perPage)

          let categories = results[2].map(cat => {
            return {
              value: cat._id,
              label: cat._id
            }
          })
          categories.unshift({ value: '', label: 'All' })

          let brands = results[3].map(brand => {
            return {
              value: brand._id,
              label: brand._id
            }
          })
          brands.unshift({ value: '', label: 'All' })

          res.status(200).send({
            categories,
            brands,
            gifts,
            totalPage,
            total: results[1]
          })
        })
        .catch(error => {
          res.status(400).send()
        })
    }
  } catch (error) {
    res.status(400).send()
  }
})

router.get('/ub/:id', async (req, res) => {
  try {
    let reqBody = { ...urboxKey, id: req.params.id }
    let resData = await apiUrbox.getGiftDetail(reqBody)

    let gift = {
      ...resData.data.data,
      supplier: 'urbox',
      country: 'vietnam',
      pricePoint: parseInt(resData.data.data.price) / 1000
    }

    res.status(200).send({ gift })
  } catch (error) {
    res.status(400).send()
  }
})

router.get('/ezbiztrip/:id', async (req, res) => {
  try {
    Reward.findById(req.params.id)
      .then(gift => {
        if (!gift) {
          return res.status(404).send()
        }
        return res.status(200).send({
          gift
        })
      })
      .catch(e => {
        return res.status(400).send()
      })
  } catch (error) {
    res.status(400).send()
  }
})

router.post('/exchange', async (req, res) => {
  try {
    let newVoucherData = {}

    const giftPrice = parseInt(req.body.price)
    if (req.user.point < giftPrice / 1000) {
      return res.status(400).send({
        message: 'not enough points to redeem this voucher'
      })
    }
    const remainingPoints = req.user.point - giftPrice / 1000

    if (req.body.supplier === 'urbox') {
      const siteUserId = 'ezbiztrip-' + req.user.id
      const transaction = require('order-id')(process.env.URBOX_SECRET)
      const transactionId = 'ezbiztrip-' + transaction.generate()

      let ubReqBody = {
        ...urboxKey,
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

      let ubResData = await apiUrbox.requestVoucher(ubReqBody)
      if (ubResData.data.msg !== 'success') {
        return res.status(400).send({
          res: ubResData.data
        })
      }

      newVoucherData = {
        ...req.body,
        supplier: 'urbox',
        _buyer: req.user.id,
        siteUserId,
        transactionId,
        quantity: 1,
        pricePoint: giftPrice / 1000,
        currency: 'VND',
        content: req.body.content,
        note: req.body.note,
        office: req.body.office,
        cartId: ubResData.data.data.cart.id,
        cartNumber: ubResData.data.data.cart.cartNo,
        cartTotal: ubResData.data.data.cart.money_total,
        cartGiftLink: ubResData.data.data.cart.link_gift,
        cartGiftCode: ubResData.data.data.cart.code_link_gift[0].code,
        expiredDate: moment(
          ubResData.data.data.cart.code_link_gift[0].expired,
          'DD-MM-YYYY'
        ).format('YYYY-MM-DD')
      }
    } else {
      newVoucherData = {
        _buyer: req.user.id,
        ...req.body
      }
      newVoucherData = _.omit(newVoucherData, ['_id', '__v'])
    }

    let voucher = new Voucher(newVoucherData)
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
          // data: ubResData.data.data,
          voucherId: voucher.id,
          remainingPoints: user.point
        })
      })
      .catch(error => {
        return res.status(400).send()
      })
  } catch (error) {
    res.status(400).send()
  }
})

module.exports = router
