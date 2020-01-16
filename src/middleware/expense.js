const User = require('../models/user')
const Trip = require('../models/trip')
const { fileUpload } = require('../config/aws')
const upload = fileUpload('receipts')
const multiUpload = upload.array('receipts')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

const validateExpenseProps = async (req, res, next) => {
  try {
    // validate trip, trip belongs to user and has valid status
    let trip = await Trip.findOne({
      _id: req.body._trip,
      _company: req.user._company,
      _creator: req.user._id
    })
    if (!trip || !['approved', 'ongoing', 'finished'].includes(trip.status)) {
      return res.status(400).send()
    }

    // validate attendees
    let attendees = req.body._attendees
    if (!_.isEmpty(attendees)) {
      attendees = req.body._attendees.split(',')
      // check each element in attendees is valid ObjectID
      if (
        attendees.filter(attendee => ObjectID.isValid(attendee)).length ===
        attendees.length
      ) {
        let users = await User.find({
          _id: { $in: attendees },
          _company: req.user._company
        })
        if (users.length !== attendees.length) {
          return res.status(400).send()
        }
        // ok at aall, return next()
      } else {
        return res.status(400).send()
      }
    }
    return next()
  } catch (error) {
    return res.status(400).send()
  }
}

const uploadReceipts = function(req, res, next) {
  multiUpload(req, res, function(err, some) {
    if (err) {
      return res.status(422).send({
        code: err.code
      })
    }
    next()
  })
}
module.exports = {
  validateExpenseProps,
  uploadReceipts
}
