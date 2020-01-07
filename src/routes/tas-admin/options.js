var express = require('express')
var router = express.Router()
const _ = require('lodash')
const Option = require('../../models/option')

router.get('/', async (req, res) => {
  try {
    Option.find().then(options => {
      res.status(200).send({
        options
      })
    })
  } catch (error) {
    res.status(400).send()
  }
})

router.patch('/', async (req, res) => {
  try {
    let { options } = req.body

    let promises = []

    options.map(option => {
      promises.push(
        Option.findOneAndUpdate(
          {
            name: option.name
          },
          {
            $set: {
              value: option.value
            }
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
          }
        )
      )
    })

    promises = promises.map(p => p.catch(e => undefined))
    let updateResults = await Promise.all(promises)

    return res.status(200).send({ updateResults })
  } catch (error) {
    return res.status(400).send()
  }
})

module.exports = router
