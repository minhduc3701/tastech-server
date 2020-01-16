const Role = require('../models/role')
const User = require('../models/user')

const isPartnerBooking = async (req, res, next) => {
  if (!req.body.onBehalf) {
    return next()
  }

  try {
    let role = await Role.findById(req.user._role)
    if (role.type === 'partner-admin') {
      let user = await User.findOne({
        _id: req.body.onBehalf,
        _partner: req.user._partner
      })

      // not found user
      if (!user) {
        return res.status(400).send({
          message: 'Cannot book on behalf'
        })
      }

      // swap onbehalf employee to req.user
      // and partner admin to req.partnerAdmin
      req.partnerAdmin = req.user
      req.user = user
    }
  } catch (error) {}

  next()
}

module.exports = {
  isPartnerBooking
}
