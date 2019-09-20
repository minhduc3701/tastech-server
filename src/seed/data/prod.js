const { ObjectID } = require('mongodb')
const User = require('../../models/user')
const Role = require('../../models/role')

const populateUsers = users => {
  return User.deleteMany({
    email: {
      $in: users.map(user => user.email)
    }
  })
    .then(() => {
      let allUsers = users.map(user => new User(user))
      return Promise.all(
        allUsers.map((user, index) => user.setPassword(users[index].password))
      )
    })
    .then(res => {
      return Promise.all(res.map(user => user.save()))
    })
}

const populateRoles = roles => {
  return Role.deleteMany({
    type: {
      $in: roles.map(role => role.type)
    }
  }).then(() => {
    let allRoles = roles.map(role => new Role(role))
    return Promise.all(allRoles.map(role => role.save()))
  })
}

const populateTasAdmin = (email, password) => {
  const tasAdminRoleId = new ObjectID()

  const users = [
    {
      username: email,
      email,
      _role: tasAdminRoleId,
      password: String(password)
    }
  ]

  const roles = [
    {
      _id: tasAdminRoleId,
      name: 'Tas Admin',
      type: 'tas-admin',
      permissions: []
    }
  ]

  return Promise.all([populateUsers(users), populateRoles(roles)])
}

const populateAgent = (email, password) => {
  const AgentRoleId = new ObjectID()

  const users = [
    {
      username: email,
      email,
      _role: AgentRoleId,
      password: String(password)
    }
  ]

  const roles = [
    {
      _id: AgentRoleId,
      name: 'Agent',
      type: 'agent',
      permissions: []
    }
  ]

  return Promise.all([populateUsers(users), populateRoles(roles)])
}

module.exports = {
  populateTasAdmin,
  populateAgent
}
