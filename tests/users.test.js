const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { userToken, setupDatabase } = require('./fixtures/db.js')
const mongoose = require('mongoose')

beforeEach(setupDatabase)

// @see https://github.com/visionmedia/supertest/issues/520#issuecomment-469044925
// @see https://github.com/facebook/jest/issues/7287
afterAll(async () => {
  await new Promise(resolve => setTimeout(() => resolve(), 500)) // avoid jest open handle error
  mongoose.disconnect()
})

test('Should get profile for user', async () => {
  await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userToken}`)
    .send()
    .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
  await request(app)
    .get('/users/me')
    .send()
    .expect(401)
})

test('Should get profile for user without resetPasswordToken & resetPasswordExpires', async () => {
  let res = await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userToken}`)
    .expect(200)
  expect(res.body.user).not.toHaveProperty('resetPasswordToken')
  expect(res.body.user).not.toHaveProperty('resetPasswordExpires')
})

test('Should get users from searching without resetPasswordToken & resetPasswordExpires', async () => {
  let res = await request(app)
    .post('/users/search')
    .set('Authorization', `Bearer ${userToken}`)
    .expect(200)
  res.body.users.map(user => {
    expect(user).not.toHaveProperty('resetPasswordToken')
    expect(user).not.toHaveProperty('resetPasswordExpires')
  })
})
