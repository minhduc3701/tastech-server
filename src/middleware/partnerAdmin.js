const Role = require('../models/role')
const User = require('../models/user')

const isPartnerBooking = async (req, res, next) => {
  try {
    let role = await Role.findById(req.user._role)
    if (role.type === 'partner-admin') {
      req.partnerAdmin = req.user

      if (req.body.onBehalf) {
        let user = await User.findById(req.body.onBehalf)
        req.user = user
      }
    }
  } catch (error) {}
  next()
}

module.exports = {
  isPartnerBooking
}
