const request = require('supertest')
const app = require('../../src/app')
const mongoose = require('mongoose')
const Company = require('../../src/models/company')
const Role = require('../../src/models/role')
const Policy = require('../../src/models/policy')
const _ = require('lodash')
const {
  setupDatabase,
  partnerAdminRoleId,
  partnerAdminOne,
  partnerAdminToken,
  partnerCompanyId,
  partnerSampleCompanyOne
} = require('../fixtures/db.js')

const newObjectId = new mongoose.Types.ObjectId()

let partnerSampleCompanyTwo = {
  ...partnerSampleCompanyOne,
  name: 'Company 11'
}
let companyDataWithoutName = _.omit(partnerSampleCompanyOne, ['name'])

beforeEach(setupDatabase)

test('Should create new company with valid data', async () => {
  const response = await request(app)
    .post('/partner-admin/companies')
    .set('Authorization', `Bearer ${partnerAdminToken}`)
    .send(partnerSampleCompanyOne)
    .expect(200)

  expect(response.body.company.name).toMatch(partnerSampleCompanyOne.name)
  expect(response.body.company.contactEmail).toMatch(
    partnerSampleCompanyOne.contactEmail
  )

  let roles = await Role.find({ _company: response.body.company._id })
  expect(roles.length).toEqual(4)

  let policy = await Policy.find({ _company: response.body.company._id })
  expect(policy.length).toEqual(1)
})

test('Should not create new company, return 400 because of lacking required data', async () => {
  await request(app)
    .post('/partner-admin/companies')
    .set('Authorization', `Bearer ${partnerAdminToken}`)
    .send(companyDataWithoutName)
    .expect(400)
})

test('Should get companies', async () => {
  await request(app)
    .get('/partner-admin/companies')
    .set('Authorization', `Bearer ${partnerAdminToken}`)
    .expect(200)
})

test('Should get company by Id', async () => {
  await request(app)
    .get(`/partner-admin/companies/${partnerCompanyId}`)
    .set('Authorization', `Bearer ${partnerAdminToken}`)
    .expect(200)
})

test('Should not get company, return 404 because of non existing company', async () => {
  await request(app)
    .get(`/partner-admin/companies/${newObjectId}`)
    .set('Authorization', `Bearer ${partnerAdminToken}`)
    .expect(404)
})

test('Should update company by Id', async () => {
  const response = await request(app)
    .patch(`/partner-admin/companies/${partnerCompanyId}`)
    .set('Authorization', `Bearer ${partnerAdminToken}`)
    .send({
      name: 'New Company'
    })
    .expect(200)

  expect(response.body.company.name).toMatch('New Company')
})

test('Should not update company, return 404 because of non existing company', async () => {
  await request(app)
    .patch(`/partner-admin/companies/${newObjectId}`)
    .set('Authorization', `Bearer ${partnerAdminToken}`)
    .send({
      name: 'TAS HOLDING'
    })
    .expect(404)
})

test('Should not update company, return 400 because of lacking required data', async () => {
  await request(app)
    .patch(`/partner-admin/companies/${partnerCompanyId}`)
    .set('Authorization', `Bearer ${partnerAdminToken}`)
    .send({
      name: ''
    })
    .expect(400)
})

test('Should delete company by Id', async () => {
  const response = await request(app)
    .delete(`/partner-admin/companies/${partnerCompanyId}`)
    .set('Authorization', `Bearer ${partnerAdminToken}`)
    .expect(200)

  expect(response.body.company._id).toMatch(partnerCompanyId.toHexString())
})

test('Should not delete company, return 404 because of non existing company', async () => {
  await request(app)
    .delete(`/partner-admin/companies/${newObjectId}`)
    .set('Authorization', `Bearer ${partnerAdminToken}`)
    .expect(404)
})

test('Should create two new companies', async () => {
  const response = await request(app)
    .post('/partner-admin/companies/bulk')
    .set('Authorization', `Bearer ${partnerAdminToken}`)
    .send([partnerSampleCompanyOne, partnerSampleCompanyTwo])
    .expect(200)

  expect(response.body.companies.length).toEqual(2)

  expect(response.body.companies[0].name).toMatch(partnerSampleCompanyOne.name)
  expect(response.body.companies[1].name).toMatch(partnerSampleCompanyTwo.name)
  expect(response.body.companies[0].contactEmail).toMatch(
    partnerSampleCompanyOne.contactEmail
  )
  expect(response.body.companies[1].contactEmail).toMatch(
    partnerSampleCompanyTwo.contactEmail
  )

  let roles1 = await Role.find({ _company: response.body.companies[0]._id })
  let roles2 = await Role.find({ _company: response.body.companies[1]._id })
  expect(roles1.length).toEqual(4)
  expect(roles2.length).toEqual(4)

  let policy1 = await Policy.find({ _company: response.body.companies[0]._id })
  let policy2 = await Policy.find({ _company: response.body.companies[1]._id })
  expect(policy1.length).toEqual(1)
  expect(policy2.length).toEqual(1)
}, 20000)

test('Should create one new companies', async () => {
  const response = await request(app)
    .post('/partner-admin/companies/bulk')
    .set('Authorization', `Bearer ${partnerAdminToken}`)
    .send([partnerSampleCompanyOne, companyDataWithoutName])
    .expect(200)

  expect(response.body.companies.length).toEqual(1)

  expect(response.body.companies[0].name).toMatch(partnerSampleCompanyOne.name)
  expect(response.body.companies[0].contactEmail).toMatch(
    partnerSampleCompanyOne.contactEmail
  )

  let roles1 = await Role.find({ _company: response.body.companies[0]._id })
  expect(roles1.length).toEqual(4)

  let policy1 = await Policy.find({ _company: response.body.companies[0]._id })
  expect(policy1.length).toEqual(1)
}, 20000)

test('Should not create new company, return 404 because of invalid data', async () => {
  const response = await request(app)
    .post('/partner-admin/companies/bulk')
    .set('Authorization', `Bearer ${partnerAdminToken}`)
    .send([companyDataWithoutName, companyDataWithoutName])
    .expect(400)
}, 20000)
