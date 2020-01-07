const request = require('supertest')
const app = require('../../src/app')
const { tasAdminToken, setupDatabase } = require('../fixtures/db.js')

beforeEach(setupDatabase)

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
