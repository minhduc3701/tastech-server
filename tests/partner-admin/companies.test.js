const request = require('supertest')
const app = require('../../src/app')
const mongoose = require('mongoose')
const Company = require('../../src/models/company')
const Role = require('../../src/models/role')
const _ = require('lodash')
const {
  setupDatabase,
  partnerAdminRoleId,
  partnerAdminOne,
  partnerAdminToken,
  company3Id
} = require('../fixtures/db.js')

const newObjectId = new mongoose.Types.ObjectId()

let newCompanyData = {
  name: 'Company 9',
  address: 'Tokyo',
  country: 'Japan',
  industry: 'Travel',
  website: 'www.tas-holding.jp',
  timezone: '+9',
  companySize: '50-100',
  language: 'en',
  currency: 'USD',
  lengthUnit: '',
  weightUnit: '',
  payment: 'deposit',
  creditLimitationAmount: 10000,
  warningAmount: '5000',
  sendMailToCompanyAdmin: true,
  sendMailToPartnerAdmin: true,
  contactName: 'Takaya Tomose',
  contactEmail: 'takaya@tas-holding.jp',
  contactCallingCode: '+65',
  contactPhone: '912333444',
  markupFlight: 'net',
  markupFlightAmount: 1000,
  markupHotel: 'net',
  markupHotelAmount: 300,
  deposit: 1000,
  note: 'this is a sample note',
  onBehalf: false
}

let companyDataWithoutName = _.omit(newCompanyData, ['name'])

beforeEach(setupDatabase)

test('Should create new company with valid data', async () => {
  await request(app)
    .post('/partner-admin/companies')
    .set('Authorization', `Bearer ${partnerAdminToken}`)
    .send(newCompanyData)
    .expect(200)
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
    .get(`/partner-admin/companies/${company3Id}`)
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
  await request(app)
    .patch(`/partner-admin/companies/${company3Id}`)
    .set('Authorization', `Bearer ${partnerAdminToken}`)
    .send(newCompanyData)
    .expect(200)
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
    .patch(`/partner-admin/companies/${company3Id}`)
    .set('Authorization', `Bearer ${partnerAdminToken}`)
    .send({
      name: ''
    })
    .expect(400)
})

test('Should delete company by Id', async () => {
  await request(app)
    .delete(`/partner-admin/companies/${company3Id}`)
    .set('Authorization', `Bearer ${partnerAdminToken}`)
    .expect(200)
})

test('Should not delete company, return 404 because of non existing company', async () => {
  await request(app)
    .delete(`/partner-admin/companies/${newObjectId}`)
    .set('Authorization', `Bearer ${partnerAdminToken}`)
    .expect(404)
})

test('Should create new companies', async () => {
  await request(app)
    .post('/partner-admin/companies/bulk')
    .set('Authorization', `Bearer ${partnerAdminToken}`)
    .send([newCompanyData])
    .expect(200)
})
