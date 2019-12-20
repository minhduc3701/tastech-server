const request = require('supertest')
const app = require('../../src/app')
const mongoose = require('mongoose')
const {
  adminToken,
  setupDatabase,
  adminRoleId,
  user2Id,
  userId,
  userCompany2Id
} = require('../fixtures/db.js')

beforeEach(setupDatabase)

// Update user list in Role
test('Should update role with valid users', async () => {
  await request(app)
    .patch(`/admin/roles/${adminRoleId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      users: [userId, user2Id]
    })
    .expect(200)
})

test('Should not update role with user of other company', async () => {
  await request(app)
    .patch(`/admin/roles/${adminRoleId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      users: [userCompany2Id]
    })
    .expect(400)
})

test('Should not update role with invalid users', async () => {
  await request(app)
    .patch(`/admin/roles/${adminRoleId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      users: [new mongoose.Types.ObjectId()]
    })
    .expect(400)
})
