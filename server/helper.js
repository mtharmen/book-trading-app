const jwt = require('jsonwebtoken')
const CONFIG = require('./config')
const User = require('./models/user')

// ********************************************* AUTH MIDDLEWARE
function UserGuard (req, res, next) {
  const user = req.payload
  User.findById(user._id, (err, user) => {
    if (err) { return next(err) }
    if (!user) {
      return next(new CustomError('No User Found', 404))
    }
    req.user = user
    return next()
  })
}

function AdminGuard (req, res, next) {
  const user = req.payload
  User.findById(user._id, (err, user) => {
    if (err) { return next(err) }
    if (!user) {
      return next(new CustomError('No User Found', 404))
    }
    if (user.role !== 'admin') {
      return next(new CustomError('Admins Only', 401))
    }
    req.user = user
    return next()
  })
}

function passwordCheck (req, res, next) {
  const user = req.payload
  User.findById({ _id: user._id }, (err, user) => {
    if (err) { return next(err) }
    if (!user) {
      return next(new CustomError('No User Found', 404))
    } else if (!user.verifyPassword(req.body.currentPassword)) {
      return next(new CustomError('Wrong Password', 401))
    }
    req.user = user
    return next()
  })
}

function sendToken (req, res) {
  // TODO: maybe simplify and just send user ID?
  let fullUser = req.user
  let user = pruneDetails(fullUser)
  user.token = generateToken(user)
  res.json(user)
}

// ********************************************* AUTH FUNCTIONS
const expiration = CONFIG.expiration || 60 * 120

function generateToken (user) {
  user.exp = Math.floor(Date.now() / 1000) + expiration
  const token = jwt.sign(user, CONFIG.jwtSecret)
  return token
}

function pruneDetails (user) {
  return {
    _id: user._id,
    username: user.username,
    profile: JSON.stringify(user.profile || {}),
    email: user.local ? user.local.email : '',
    address: JSON.stringify(user.address || {}),
    role: user.role
  }
}

function tokenCheck (token) {
  try {
    return jwt.verify(token, CONFIG.jwtSecret)
  } catch (err) {
    return err
  }
}

function verifyToken (req, res, next) {
  let token = ''
  if (req.hasOwnProperty('headers') && req.headers.hasOwnProperty('authorization')) {
    token = req.headers['authorization'].split(' ')[1]
  }
  if (!token) {
    req.payload = ''
    return next()
    // return next(new CustomError('Json Web Token Required', 401))
  }
  const payload = tokenCheck(token)

  if (isError(payload)) {
    return next(payload)
  }
  req.payload = payload
  return next()
}

function isError (e) {
  return e && e.stack && e.message
}

// TODO: Better name for error
function CustomError (message, status, name) {
  Error.captureStackTrace(this, name || this.constructor)

  this.name = this.constructor.name
  this.message = message || 'Something went wrong.'
  this.status = status || 500
}

module.exports = {
  verifyToken,
  generateToken,
  tokenCheck,
  sendToken,
  passwordCheck,
  AdminGuard,
  UserGuard,
  isError,
  CustomError
}
