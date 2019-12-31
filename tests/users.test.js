const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { userToken, setupDatabase } = require('./fixtures/db.js')

beforeEach(setupDatabase)

afterAll(done => done())

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
