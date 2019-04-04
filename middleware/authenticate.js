const authenticateTasAdmin = (req, res, next) => {
  if (req.user.type === 'tas-admin') {
    return next()
  }

  res.status(401).send('Unauthorized')
}

const authenticateAdmin = (req, res, next) => {
  if (req.user.type === 'admin') {
    req.admin = req.user
    return next()
  }

  res.status(401).send('Unauthorized')
}

module.exports = {
  authenticateTasAdmin,
  authenticateAdmin
}
