require('./config/config')
require('./config/newrelic')
require('./config/mongoose')
require('./config/mail')
require('./config/aws')
require('./config/schedule')

const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const cors = require('cors')
const passport = require('passport')
const requestsRouter = require('./routes/requests')
const authRouter = require('./routes/auth')
const usersRouter = require('./routes/users')
const tripsRouter = require('./routes/trips')
const expensesRouter = require('./routes/expenses')
const tasAdminUsersRouter = require('./routes/tas-admin/users')
const tasAdminCompaniesRouter = require('./routes/tas-admin/companies')
const tasAdminRequestsRouter = require('./routes/tas-admin/requests')
const tasAdminOrdersRouter = require('./routes/tas-admin/orders')
const tasAdminRewardsRouter = require('./routes/tas-admin/rewards')
const tasAdminPartnerRouter = require('./routes/tas-admin/partners')
const partnerAdminOrdersRouter = require('./routes/partner-admin/orders')
const tasAdminOptionsRouter = require('./routes/tas-admin/options')
const adminCompanyRouter = require('./routes/admin/company')
const adminUsersRouter = require('./routes/admin/users')
const adminRolesRouter = require('./routes/admin/roles')
const adminPolicyRouter = require('./routes/admin/policies')
const adminDepartmentRouter = require('./routes/admin/departments')
const adminTripsRouter = require('./routes/admin/trips')
const adminExpensesRouter = require('./routes/admin/expenses')
const adminReportsRouter = require('./routes/admin/reports')
const partnerAdminCompaniesRouter = require('./routes/partner-admin/companies')
const partnerAdminUsersRouter = require('./routes/partner-admin/users')
const partnerAdminUsersRequest = require('./routes/partner-admin/requests')
const flightsPkfareRouter = require('./routes/flights/pkfare')
const flightsSabreRouter = require('./routes/flights/sabre')
const hotelsPkfareRouter = require('./routes/hotels/pkfare')
const hotelbedsRouter = require('./routes/hotels/hotelbeds')
const ticketsPkfareRouter = require('./routes/tickets/pkfare')
const settingsRouter = require('./routes/settings')
const airportsRouter = require('./routes/airports')
const airlinesRouter = require('./routes/airlines')
const citiesRouter = require('./routes/cities')
const regionsRouter = require('./routes/regions')
const cardsRouter = require('./routes/cards')
const checkoutRouter = require('./routes/checkout')
const ordersRouter = require('./routes/orders')
const reportsRouter = require('./routes/reports')
const rewardRouter = require('./routes/rewards')
const voucherRouter = require('./routes/vouchers')
const xenditPaymentRouter = require('./routes/payment/xendit')
const adminExpenseCategoryRouter = require('./routes/admin/expenseCategory')
const expenseCategoryRouter = require('./routes/expenseCategory')
const {
  authenticateRole,
  authenticatePermission
} = require('./middleware/authenticate')
const {
  CAN_ACCESS_BUDGET,
  CAN_ACCESS_EXPENSE,
  CAN_ACCESS_ANALYTICS,
  CAN_ACCESS_COMPANY
} = require('./config/roles')

const jwtAuthenticate = passport.authenticate('jwt', { session: false })

const app = express()
app.use(cors())
// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

// limit cors for 1 origin (client app uri)
const origins = process.env.ALLOW_ORIGIN
  ? process.env.ALLOW_ORIGIN.split(',')
  : ''
app.use(
  cors({
    // @see https://expressjs.com/en/resources/middleware/cors.html
    origin: Array.isArray(origins)
      ? function(origin, callback) {
          if (origins.indexOf(origin) !== -1) {
            callback(null, true)
          } else {
            callback(new Error('Not allowed by CORS'))
          }
        }
      : '' // empty allow all origin
  })
)

app.use(passport.initialize())
require('./config/passport')

app.use('/auth', authRouter)
app.use('/requests', requestsRouter)
app.use('/users', jwtAuthenticate, usersRouter)
app.use('/trips', jwtAuthenticate, tripsRouter)
app.use('/expenses', jwtAuthenticate, expensesRouter)
app.use('/orders', jwtAuthenticate, ordersRouter)
app.use('/reports', jwtAuthenticate, reportsRouter)
app.use('/expenseCategory', jwtAuthenticate, expenseCategoryRouter)

// tas-admin routes
app.use(
  '/tas-admin/requests',
  jwtAuthenticate,
  authenticateRole('tas-admin'),
  tasAdminRequestsRouter
)
app.use(
  '/tas-admin/users',
  jwtAuthenticate,
  authenticateRole('tas-admin'),
  tasAdminUsersRouter
)
app.use(
  '/tas-admin/companies',
  jwtAuthenticate,
  authenticateRole('tas-admin'),
  tasAdminCompaniesRouter
)

app.use(
  '/tas-admin/orders',
  jwtAuthenticate,
  authenticateRole('tas-admin'),
  tasAdminOrdersRouter
)
app.use(
  '/tas-admin/rewards',
  jwtAuthenticate,
  authenticateRole('tas-admin'),
  tasAdminRewardsRouter
)
app.use(
  '/tas-admin/options',
  jwtAuthenticate,
  authenticateRole('tas-admin'),
  tasAdminOptionsRouter
)

app.use(
  '/tas-admin/partners',
  jwtAuthenticate,
  authenticateRole('tas-admin'),
  tasAdminPartnerRouter
)

// partner-admin routes
app.use(
  '/partner-admin/orders',
  jwtAuthenticate,
  authenticateRole('partner-admin'),
  partnerAdminOrdersRouter
)
app.use(
  '/partner-admin/companies',
  jwtAuthenticate,
  authenticateRole('partner-admin'),
  partnerAdminCompaniesRouter
)
app.use(
  '/partner-admin/users',
  jwtAuthenticate,
  authenticateRole('partner-admin'),
  partnerAdminUsersRouter
)
app.use(
  '/partner-admin/requests',
  jwtAuthenticate,
  authenticateRole('partner-admin'),
  partnerAdminUsersRequest
)

// admin routes
app.use(
  '/admin/company',
  jwtAuthenticate,
  authenticatePermission(CAN_ACCESS_COMPANY),
  adminCompanyRouter
)
app.use(
  '/admin/users',
  jwtAuthenticate,
  authenticatePermission(CAN_ACCESS_COMPANY),
  adminUsersRouter
)
app.use(
  '/admin/roles',
  jwtAuthenticate,
  authenticatePermission(CAN_ACCESS_COMPANY),
  adminRolesRouter
)
app.use(
  '/admin/trips',
  jwtAuthenticate,
  authenticatePermission(CAN_ACCESS_EXPENSE),
  adminTripsRouter
)
app.use(
  '/admin/expenses',
  jwtAuthenticate,
  authenticatePermission(CAN_ACCESS_EXPENSE),
  adminExpensesRouter
)
app.use(
  '/admin/policies',
  jwtAuthenticate,
  authenticatePermission(CAN_ACCESS_COMPANY),
  adminPolicyRouter
)
app.use(
  '/admin/departments',
  jwtAuthenticate,
  authenticatePermission(CAN_ACCESS_COMPANY),
  adminDepartmentRouter
)
app.use(
  '/admin/expenseCategory',
  jwtAuthenticate,
  authenticatePermission(CAN_ACCESS_COMPANY),
  adminExpenseCategoryRouter
)

app.use(
  '/admin/reports',
  jwtAuthenticate,
  authenticatePermission(CAN_ACCESS_ANALYTICS),
  adminReportsRouter
)

// flights
app.use('/flights/pkfare', jwtAuthenticate, flightsPkfareRouter)
app.use('/flights/sabre', jwtAuthenticate, flightsSabreRouter)

// hotels
app.use('/hotels/pkfare', jwtAuthenticate, hotelsPkfareRouter)
app.use('/hotels/hotelbeds', jwtAuthenticate, hotelbedsRouter)

// tickets
app.use('/tickets/pkfare', ticketsPkfareRouter)

// content api
app.use('/settings', jwtAuthenticate, settingsRouter)
app.use('/airports', jwtAuthenticate, airportsRouter)
app.use('/airlines', jwtAuthenticate, airlinesRouter)
app.use('/cities', jwtAuthenticate, citiesRouter)
app.use('/regions', jwtAuthenticate, regionsRouter)

// rewards
app.use('/rewards', jwtAuthenticate, rewardRouter)

// voucher
app.use('/vouchers', jwtAuthenticate, voucherRouter)

// checkout
app.use('/cards', jwtAuthenticate, cardsRouter)

app.use('/checkout', jwtAuthenticate, checkoutRouter)
// Xendit payment
app.use('/payment/xendit', xenditPaymentRouter)
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404))
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500).send()
})

module.exports = app
