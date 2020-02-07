const Policy = require('../models/policy')

const findUserPolicy = async (req, res, next) => {
  // refactor later
  let companyPolicies = await Policy.find({
    _company: req.user._company
  })

  let policy = await Policy.findById(req.user._policy)

  if (!policy || policy.status === 'disabled') {
    for (let index = 0; index < companyPolicies.length; index++) {
      if (companyPolicies[index]._doc.status === 'default') {
        policy = companyPolicies[index]
      }
    }
  }

  req.policy = policy

  next()
}

module.exports = {
  findUserPolicy
}
