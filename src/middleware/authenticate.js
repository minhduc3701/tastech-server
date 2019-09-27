const Role = require('../models/role')
const { CAN_ACCESS_COMPANY } = require('../config/roles')

const authenticateRole = requireRole => {
  return (req, res, next) => {
    Role.findById(req.user._role)
      .then(role => {
        let currentRole = role.type

        if (currentRole === requireRole) {
          req.admin = req.user
          return next()
        }

        res.status(401).send('Unauthorized')
      })
      .catch(e => {
        res.status(401).send('Unauthorized')
      })
  }
}

const authenticatePermission = permission => {
  return (req, res, next) => {
    Role.findById(req.user._role)
      .then(role => {
        if (!role) {
          return res.status(401).send('Unauthorized')
        }

        if (!role.permissions.includes(permission)) {
          return res.status(401).send('Unauthorized')
        }

        if (role.permissions.includes(CAN_ACCESS_COMPANY)) {
          req.admin = req.user
        }

        return next()

        res.status(401).send('Unauthorized')
      })
      .catch(e => {
        res.status(401).send('Unauthorized')
      })
  }
}

module.exports = {
  authenticateRole,
  authenticatePermission
}
