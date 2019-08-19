const Role = require('../models/role')

const authenticateRole = requireRole => {
  return (req, res, next) => {
    Role.findById(req.user._role)
      .then(role => {
        if (['accountant', 'manager'].includes(role.type)) {
          role.type = 'admin'
        }
        if (role.type === requireRole) {
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
