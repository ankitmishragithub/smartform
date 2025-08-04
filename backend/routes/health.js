// 1. Health check: routes/health.js
const express = require('express')
const router = express.Router()
router.get('/', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }))
module.exports = router

// 2. Joi validation example in routes/forms.js (update POST):


// 3. In server.js: mount all routes and start

const express = require('express')
const mongoose = require('mongoose')
require('dotenv').config()

const authRoutes      = require('./routes/auth')
const formRoutes      = require('./routes/forms')
const bundleRoutes    = require('./routes/bundles')
const responseRoutes  = require('./routes/responses')
const healthRoutes    = require('./routes/health')

async function start() {
  await mongoose.connect(process.env.MONGO_URI)
  const app = express()
  app.use(express.json())

  app.use('/api/auth', authRoutes)
  app.use('/api/forms', formRoutes)
  app.use('/api/bundles', bundleRoutes)
  app.use('/api/responses', responseRoutes)
  app.use('/api/health', healthRoutes)

  const port = process.env.PORT || 4000
  app.listen(port, () => console.log(`Listening on ${port}`))
}

start().catch(err => console.error(err))