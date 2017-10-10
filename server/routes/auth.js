const router = require('express').Router()

const User = require('./../models/user')
const CONFIG = require('./../config')
const my = require('./../helper')
const CustomError = my.CustomError

// ****************************************************************************************************
//                                          LOCAL LOGIN
// ****************************************************************************************************
const emailRegExp = /^(?!.*^(([^<>()\[\]\\.,:\s@"]+(\.[^<>()\[\]\\.,:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$)/
const usernameRegExp = /[^a-zA-Z0-9]/

router.post('/local/signup', LocalSignUp)

// TODO: Split into Validation and signup?
function LocalSignUp (req, res, next) {
  const username = req.body.username
  const email = req.body.email ? req.body.email.toLowerCase() : ''
  const password = req.body.password
  const firstname = req.body.firstname
  const lastname = req.body.lastname
  const province = req.body.province
  const city = req.body.city

  // TODO: make unique error messages for missing values
  if (!username || !email || !password || !firstname || !lastname || !province || !city) {
    return next(new CustomError('Missing User Information', 400))
  }
  if (emailRegExp.test(email)) {
    return next(new CustomError('Invalid Email', 400))
  }
  if (usernameRegExp.test(username)) {
    return next(new CustomError('Invalid Username', 400))
  }
  User.find({ $or: [{ 'username': username }, { 'local.email': email }] }).exec()
    .then(users => {
      if (users.length) {
        let message = makeDupeMessage(users, username, email) + ' already in use'
        throw new CustomError(message, 409)
      }
      const newUser = new User()
      newUser.username = username
      newUser.local = {
        email: email,
        password: newUser.generateHash(password)
      }
      newUser.profile = { firstname, lastname, province, city }
      newUser.role = CONFIG.admins.indexOf(email) > -1 ? 'admin' : 'member'
      req.user = newUser
      return newUser.save()
    })
    .then(user => {
      return my.sendToken(req, res)
    })
    .catch(err => {
      return next(err)
    })
}

router.post('/local/login', LocalLogin)

function LocalLogin (req, res, next) {
  const username = req.body.username
  const email = req.body.email ? req.body.email.toLowerCase() : ''
  const password = req.body.password

  // Check if login info is valid
  if (!(username || email) || !password) {
    return next(new CustomError('Missing User Information', 400))
  }
  if (emailRegExp.test(email)) {
    return next(new CustomError('Invalid Email', 400))
  }
  // if (usernameRegExp.test(username)) {
  //   return next(new CustomError('Invalid Username', 400))
  // }

  // Setup query
  const query = { 'local.email': email }
  // NOTE: Currently the client only accepts email so this is doesn't do anything
  // if (username.indexOf('@') < 0) {
  //   query = { username: username }
  // } else {
  //   query = { 'local.email': username }
  // }
  User.findOne(query).exec()
    .then(user => {
      if (!user) {
        throw new CustomError('No User Found', 404)
      }
      if (!user.verifyPassword(password)) {
        throw new CustomError('Wrong Password', 401)
      }
      req.user = user
      my.sendToken(req, res)
    })
    .catch(err => {
      return next(err)
    })
}

function makeDupeMessage (users, username, email) {
  const errors = []
  users.forEach(user => {
    if (user.username === username) {
      errors.push('Username')
    }
    if (user.local.email === email) {
      errors.push('Email')
    }
  })
  return errors.join(' and ')
}

// CHECK FOR SIGNUP ASYNC VALIDATION
router.post('/local/existingCheck', dupeCheck)

function dupeCheck (req, res, next) {
  const field = req.body.field
  const query = {}
  if (field.indexOf('@') > -1) {
    query['local.email'] = field
  } else {
    query.username = field
  }

  User.findOne(query).exec()
    .then(user => {
      if (user) {
        throw new CustomError('Existing Entry Found', 409)
      } else {
        res.json({ message: 'Valid' })
      }
    })
    .catch(err => {
      return next(err)
    })
}

router.get('/update-info', my.verifyToken, my.passwordCheck, (req, res, next) => {
  console.log(req.body)
  checkUpdateInfo(req.body, req, next)
    .then(updated => {
      res.send('testing')
      // return my.sendToken(req, res)
    })
    .catch(err => {
      return next(err)
    })
})

function checkUpdateInfo (updateInfo, req, next) {
  let update = {}
  if (req.body.email) {
    console.log('updating email to ' + req.body.email)
    update = { 'local.email': req.body.email }
  } else if (req.body.password) {
    console.log('updating password to ' + req.body.password)
    update = { 'local.password': User.generateHash(req.body.password) }
  } else if (req.body.firstname || req.body.lastname || req.body.province || req.body.city) {
    console.log('updating profile info')
    update = {
      'profile.firstname': req.body.firstname || req.user.profile.firstname,
      'profile.lastname': req.body.lastname || req.user.profile.lastname,
      'profile.province': req.body.province || req.user.profile.province,
      'profile.city': req.body.city || req.user.profile.city
    }
  } else {
    return next(new CustomError('No values given to update', 401))
  }
  console.log(update)
  return Promise.resolve('test') // User.findByIdAndUpdate(req.user._id, update).exec()
}

// ****************************************************************************************************
//                                                    JWT LOGIN
// ****************************************************************************************************

router.get('/jwt/login', my.verifyToken, my.UserGuard, my.sendToken)

// ****************************************************************************************************
//                                                ADMIN ONLY PATHS
// ****************************************************************************************************

// ADMIN ONLY PATH
router.get('/admin', my.verifyToken, my.AdminGuard, (req, res) => {
  res.json({ message: 'Welcome Admin' })
})

module.exports = router
