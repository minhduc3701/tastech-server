const express = require('express')
const router = express.Router()
const Department = require('../../models/department')
const { ObjectID } = require('mongodb')

router.get('/', (req, res) => {
  Department.find({ _company: req.user._company })
    .then(departments => res.status(200).send({ departments }))
    .catch(e => res.status(400).send())
})

module.exports = router
