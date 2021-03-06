const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { userId, userOne, setupDatabase } = require('./fixtures/db.js')
const mongoose = require('mongoose')

beforeEach(setupDatabase)

// @see https://github.com/visionmedia/supertest/issues/520#issuecomment-469044925
// @see https://github.com/facebook/jest/issues/7287
afterAll(async () => {
  await new Promise(resolve => setTimeout(() => resolve(), 500)) // avoid jest open handle error
  mongoose.disconnect()
})

test('Should login an user', async () => {
  const response = await request(app)
    .post('/auth/login')
    .send({
      email: userOne.email,
      password: userOne.password,
      captchaResponse: 'fake-captcha-response'
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
      password: 'thisisnotmypass',
      captchaResponse: 'fake-captcha-response'
    })
    .expect(400)
})

test('Should not return resetPasswordToken & resetPasswordExpires after submiting forgot-password', async () => {
  const response = await request(app)
    .post('/auth/forgot-password')
    .send({
      email: userOne.email,
      captchaResponse: 'fake-captcha-response'
    })
    .expect(200)
  expect(response.body).toMatchObject({
    email: userOne.email
  })
  expect(response.body).not.toHaveProperty('resetPasswordToken')
  expect(response.body).not.toHaveProperty('resetPasswordExpires')
})
