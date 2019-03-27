require('./config/config')
require('./config/mongoose')
require('./config/mail')
require('./config/aws')

var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
var cors = require('cors')
var passport = require('passport')
var cors = require('cors')
const requestsRouter = require('./routes/requests')
var authRouter = require('./routes/auth')
var usersRouter = require('./routes/users')
const tasAdminUsersRouter = require('./routes/tasAdminUsers')
const { authenticateTasAdmin } = require('./middleware/authenticate')

var app = express()
app.use(cors())
// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use(cors())

app.use(passport.initialize())
require('./config/passport')

app.use('/auth', authRouter)
app.use('/users', passport.authenticate('jwt', { session: false }), usersRouter)
app.use('/requests', requestsRouter)
app.use(
  '/tas-admin/users',
  passport.authenticate('jwt', { session: false }),
  authenticateTasAdmin,
  tasAdminUsersRouter
)

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
  res.status(err.status || 500).send({ error: 'Not Found' })
})

module.exports = app
