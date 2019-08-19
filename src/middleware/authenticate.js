const Role = require('../models/role')

const authenticateRole = requireRole => {
  return (req, res, next) => {
    Role.findById(req.user._role)
      .then(role => {
        let currentRole = role.type

        // force push accountant and manager to admin but less permissions
        if (['accountant', 'manager'].includes(role.type)) {
          currentRole = 'admin'
        }

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

module.exports = {
  authenticateRole
}
