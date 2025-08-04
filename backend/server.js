const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const path = require('path');
//const BUILD_DIR = path.join(__dirname, 'public');
//app.use(express.static(BUILD_DIR));


const formRoutes = require('./routes/forms');
const responseRoutes = require('./routes/responses');
// const initDatabase = require('./initDatabase');
//const fallbackData = require('./fallbackData');

async function start() {
  // Use environment variable or default to local MongoDB
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/form_builder';

  let usingMongoDB = false;

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB at:', mongoUri);
    usingMongoDB = true;

    // Initialize database with sample data if empty
    // await initDatabase();
  } catch (error) {
    console.log('MongoDB connection failed, using in-memory fallback database');
    console.log('Fallback database includes sample forms and responses for testing');
    console.log('Note: Data will not persist between server restarts');
  }

  // // Store database mode for routes to use
  // global.usingMongoDB = usingMongoDB;
  // global.fallbackData = fallbackData;

  // Middleware
  app.use(express.json());
  app.use(cors());

  // Debug middleware to log all requests
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
      body: req.body,
      params: req.params
    });
    next();
  });

  // Mount routes
  app.use('/api/forms', formRoutes);
  app.use('/api/responses', responseRoutes);

  app.get('/', (req, res) => {
    res.sendFile(path.join(BUILD_DIR, 'index.html'));
  });


  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ error: 'Something went wrong!' });
  });

  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`Server listening on port ${port}`));
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
