const User = require('../models/user')
const _ = require('lodash')
const { ObjectID } = require('mongodb')

const validateRolesProps = async (req, res, next) => {
  let users = _.get(req, 'body.users', [])

  try {
    if (!_.isEmpty(users)) {
      // check each element in attendees is valid ObjectID
      if (
        users.filter(user => ObjectID.isValid(user)).length === users.length
      ) {
        let usersDb = await User.find({
          _id: { $in: users },
          _company: req.user._company
        })
        if (usersDb.length !== users.length) {
          return res.status(400).send()
        }
        // ok at all, return next()
      } else {
        return res.status(400).send()
      }
    }
  } catch (error) {
    return res.status(400).send()
  }
  next()
}

module.exports = {
  validateRolesProps
}
