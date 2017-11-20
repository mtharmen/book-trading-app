const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const path = require('path')

const CONFIG = require('./server/config')

// ************************************************************************************ MONGOOSE SETUP
const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const dbName = 'mtharmen-book-trading'
mongoose.connect(CONFIG.mongodbUrl + `/${dbName}`, { useMongoClient: true })
const db = mongoose.connection
db.on('error', err => { console.error(err) })
db.once('open', () => {
  console.log('Connected to ' + dbName)
})

// Close MongoDB connection
process.on('SIGINT', () => {
  db.close(() => {
    console.log(`Closing connection to ${dbName}`)
    process.exit(0)
  })
})

// ************************************************************************************ MIDDLEWARE
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(methodOverride('X-HTTP-Method-Override'))

if (process.env.NODE_ENV === 'dev') {
  const morgan = require('morgan')
  app.use(morgan('dev'))

  // CORS Support
  const cors = require('cors')
  const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:8080'
  ]
  const corsOptions = {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.indexOf(origin) > -1) {
        cb(null, true)
      } else {
        cb(new Error('Invalid Origin'))
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
  app.use(cors(corsOptions))
  app.options('*', cors(corsOptions))
}

// ************************************************************************************ ROUTES
if (process.env.NODE_ENV !== 'dev') {
  app.use('/', express.static(path.join(__dirname, './dist')))
} else {
  app.get('/', (req, res) => {
    res.send('Hello World')
  })
}

app.use('/auth', require('./server/routes/auth'))
app.use('/api', require('./server/routes/api'))

if (process.env.NODE_ENV !== 'dev') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/dist/index.html'))
  })
}

// ************* Error Handler
app.use((err, req, res, next) => {
  console.error(err.message)
  res.status(err.status || 500).json(err)
})

app.get('/error', (req, res) => {
  const status = req.query.code || 500
  const message = status !== 500 ? 'Error' : 'Server Error'
  const error = { message, status }
  res.send(`
    <p style="font-size: 50px">
      ${error.status}: <small>${error.message}</small>
    </p>
  `)
})

app.listen(CONFIG.PORT, () => { console.log(`Server listening on ${CONFIG.IP}:${CONFIG.PORT}`) })
