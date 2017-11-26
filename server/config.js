if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config()
}

module.exports = {
  IP: process.env.IP || 'localhost',
  PORT: process.env.PORT || '8080',
  mongodbUrl: process.env.MONGODB_URL || 'mongodb://localhost:27017',
  jwtSecret: process.env.JWT_SECRET || 'notreallysecret',
  SESSION_SECRET: 'dontellanyone',
  TWITTER_CONSUMER_SECRET: process.env.TWITTER_CONSUMER_SECRET || 'MrI8Y0bGjZ2vyRXO1t4zRh6I1uwiBoRw68QFAntww3dRgr0kVN',
  TWITTER_CONSUMER_KEY: process.env.TWITTER_CONSUMER_KEY || 'O9IASyODbSYYcQ6oOIkWh0XIG',
  CALLBACK_URL: process.env.CALLBACK_URL || 'http://localhost:8080/auth/callback',
  successRedirectUrl: process.env.successRedirectUrl || 'http://localhost:4200',
  failureRedirectUrl: process.env.failureRedirectUrl || 'http://localhost:4200/error',
  twitter: process.env.TWITTER_ENABLED || false,
  admins: process.env.ADMINS || ['admin@test.com']
}
