const request = require('supertest')
const app = require('../../src/app')
const { tasAdminToken, setupDatabase } = require('../fixtures/db.js')
const mongoose = require('mongoose')

beforeEach(setupDatabase)

afterAll(async () => {
  await new Promise(resolve => setTimeout(() => resolve(), 500)) // avoid jest open handle error
  mongoose.disconnect()
})

test('Should get requests without resetPasswordToken & resetPasswordExpires', async () => {
  let res = await request(app)
    .get('/tas-admin/requests')
    .set('Authorization', `Bearer ${tasAdminToken}`)
    .expect(200)
  res.body.requests.map(requests => {
    requests.users.map(user => {
      expect(user).not.toHaveProperty('resetPasswordToken')
      expect(user).not.toHaveProperty('resetPasswordExpires')
    })
  })
})
