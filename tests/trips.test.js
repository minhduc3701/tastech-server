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

// @see https://github.com/visionmedia/supertest/issues/520#issuecomment-469044925
// @see https://github.com/facebook/jest/issues/7287
afterAll(async () => {
  await new Promise(resolve => setTimeout(() => resolve(), 500)) // avoid jest open handle error
  mongoose.disconnect()
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

// create trip
test('Should create trip with default status is waiting', async () => {
  let newTrip = await request(app)
    .post(`/trips`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      name: "test trip's status"
    })
    .expect(200)

  expect(newTrip.body.trip).toMatchObject({
    name: "test trip's status",
    status: 'waiting'
  })
})

test('Should create trip with default status is waiting even req.body.status is different', async () => {
  let newTrip = await request(app)
    .post(`/trips`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      name: "test trip's status 2",
      status: 'approved'
    })
    .expect(200)

  expect(newTrip.body.trip).toMatchObject({
    name: "test trip's status 2",
    status: 'waiting'
  })
})
