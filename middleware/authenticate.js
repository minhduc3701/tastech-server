const Role = require('../models/role')

const authenticateTasAdmin = (req, res, next) => {
  Role.findById(req.user._role)
    .then(role => {
      if (role.type === 'tas-admin') {
        return next()
      }
      res.status(401).send('Unauthorized')
    })
    .catch(e => {
      res.status(401).send('Unauthorized')
    })
}

const authenticateAdmin = (req, res, next) => {
  Role.findById(req.user._role)
    .then(role => {
      if (role.type === 'admin') {
        return next()
      }
      res.status(401).send('Unauthorized')
    })
    .catch(e => {
      res.status(401).send('Unauthorized')
    })
}

module.exports = {
  authenticateTasAdmin,
  authenticateAdmin
}
