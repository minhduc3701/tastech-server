const request = require('supertest')
const app = require('../../src/app')
const mongoose = require('mongoose')
const Role = require('../../src/models/role')
const _ = require('lodash')
const {
  adminToken,
  setupDatabase,
  adminRoleId,
  user2Id,
  userId,
  userCompany2Id,
  adminCompany2RoleId
} = require('../fixtures/db.js')

beforeEach(setupDatabase)

// @see https://github.com/visionmedia/supertest/issues/520#issuecomment-469044925
// @see https://github.com/facebook/jest/issues/7287
afterAll(async () => {
  await new Promise(resolve => setTimeout(() => resolve(), 500)) // avoid jest open handle error
  mongoose.disconnect()
})

// Update user list in Role
test('Should update role with valid users', async () => {
  let role = await Role.findById(adminRoleId)
  let numberUsers = _.get(role, 'users', []).length
  await request(app)
    .patch(`/admin/roles/${adminRoleId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      users: [userId, user2Id]
    })
    .expect(200)

  let newRole = await Role.findById(adminRoleId)
  let newNumberUsers = _.get(newRole, 'users', []).length

  // number user of role increases 2
  expect(newNumberUsers === numberUsers + 2)
})

test('Should not update role with user of other company', async () => {
  let role = await Role.findById(adminRoleId)
  let numberUsers = _.get(role, 'users', []).length

  await request(app)
    .patch(`/admin/roles/${adminRoleId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      users: [userId, userCompany2Id]
    })
    .expect(200)

  let newRole = await Role.findById(adminRoleId)
  let newNumberUsers = _.get(newRole, 'users', []).length

  //number user of role does not increase
  expect(newNumberUsers === numberUsers + 1)
})

test('Should not update role with user of other company', async () => {
  let role = await Role.findById(adminRoleId)
  let numberUsers = _.get(role, 'users', []).length

  await request(app)
    .patch(`/admin/roles/${adminRoleId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      users: [userCompany2Id]
    })
    .expect(200)

  let newRole = await Role.findById(adminRoleId)
  let newNumberUsers = _.get(newRole, 'users', []).length

  //number user of role does not increase
  expect(newNumberUsers === numberUsers)
})

test('Should not update role with invalid users', async () => {
  let role = await Role.findById(adminRoleId)
  let numberUsers = _.get(role, 'users', []).length

  await request(app)
    .patch(`/admin/roles/${adminRoleId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      users: [new mongoose.Types.ObjectId()]
    })
    .expect(200)

  //number user of role does not increase
  let newRole = await Role.findById(adminRoleId)
  let newNumberUsers = _.get(newRole, 'users', []).length

  expect(newNumberUsers === numberUsers)
})

test('Should not update role with other company role', async () => {
  await request(app)
    .patch(`/admin/roles/${adminCompany2RoleId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      users: [userId, user2Id]
    })
    .expect(404)
})

test('Should not update role with invalid role objectID', async () => {
  await request(app)
    .patch(`/admin/roles/12345678`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      users: [userId, user2Id]
    })
    .expect(404)
})

test('Should get users of all roles without resetPasswordToken and resetPasswordExpires', async () => {
  let res = await request(app)
    .get(`/admin/roles`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)
  res.body.roles.map(role => {
    role.users.map(user => {
      expect(user).not.toHaveProperty('resetPasswordToken')
      expect(user).not.toHaveProperty('resetPasswordExpires')
    })
  })
})

test('Should get users of role without resetPasswordToken and resetPasswordExpires', async () => {
  let res = await request(app)
    .get(`/admin/roles/${adminRoleId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200)
  res.body.role.users.map(user => {
    expect(user).not.toHaveProperty('resetPasswordToken')
    expect(user).not.toHaveProperty('resetPasswordExpires')
  })
})
