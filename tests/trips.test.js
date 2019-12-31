const request = require('supertest')
const app = require('../src/app')
const mongoose = require('mongoose')

const {
  userToken,
  tripApprovedId,
  setupDatabase,
  user2Token
} = require('./fixtures/db.js')

beforeEach(setupDatabase)

afterAll(async () => {
  await new Promise(resolve => setTimeout(() => resolve(), 500)) // avoid jest open handle error
})

// get expenses by trip id
test('Should get expense with valid tripId', async () => {
  await request(app)
    .get(`/trips/${tripApprovedId}/expenses`)
    .set('Authorization', `Bearer ${userToken}`)
    .expect(200)
})

test('Should not get expense with invalid tripId', async () => {
  await request(app)
    .get(`/trips/123123123/expenses`)
    .set('Authorization', `Bearer ${userToken}`)
    .expect(404)
})

test('Should not get expense of trip of other users', async () => {
  await request(app)
    .get(`/trips/${tripApprovedId}/expenses`)
    .set('Authorization', `Bearer ${user2Token}`)
    .expect(404)
})
