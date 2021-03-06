const passport = require('passport')
const User = require('../models/user')

const passportJWT = require('passport-jwt')
const JWTStrategy = passportJWT.Strategy
const ExtractJWT = passportJWT.ExtractJwt

const LocalStrategy = require('passport-local').Strategy

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    User.authenticate()
  )
)
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      // @see https://github.com/mikenicholson/passport-jwt/issues/177#issuecomment-494190324
      // @see https://github.com/mikenicholson/passport-jwt/issues/177#issuecomment-494340933
      // @see src/routes/auth.js (POST /auth/login)
      jsonWebTokenOptions: {
        maxAge: process.env.JWT_EXPIRES_IN
      }
    },
    function(jwtPayload, cb) {
      //find the user in db if needed. This functionality may be omitted if you store everything you'll need in JWT payload.
      return User.findById(jwtPayload.id)
        .then(user => {
          // disabled user
          if (user.disabled) {
            throw new Error('Disabled user')
          }
          return cb(null, user)
        })
        .catch(err => {
          return cb(err)
        })
    }
  )
)
