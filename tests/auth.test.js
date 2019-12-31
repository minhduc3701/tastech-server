const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { userId, userOne, setupDatabase } = require('./fixtures/db.js')
const mongoose = require('mongoose')

beforeEach(setupDatabase)

afterAll(done => {
  mongoose.disconnect()
  done()
})

test('Should login an user', async () => {
  const response = await request(app)
    .post('/auth/login')
    .send({
      email: userOne.email,
      password: userOne.password
    })
    .expect(200)

  // Assert that the database was changed correctly
  const user = await User.findById(response.body.user._id)
  expect(user).not.toBeNull()

  // Assertions about the response
  expect(response.body).toMatchObject({
    user: {
      email: userOne.email
    }
  })
  expect(response.body.user).not.toHaveProperty('halt')
  expect(response.body.user).not.toHaveProperty('salt')
  expect(response.body.user).not.toHaveProperty('resetPasswordToken')
  expect(response.body.user).not.toHaveProperty('resetPasswordExpires')
})

test('Should not login nonexistent user', async () => {
  await request(app)
    .post('/auth/login')
    .send({
      email: userOne.email,
      password: 'thisisnotmypass'
    })
    .expect(400)
})
