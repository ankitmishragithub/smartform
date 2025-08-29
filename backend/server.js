// server.js
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const formRoutes     = require('./routes/forms');
const responseRoutes = require('./routes/responses');
const authRoutes     = require('./routes/auth');
const healthRoutes   = require('./routes/health');

const app = express();

// allow JSON bodies up to 5 MB
app.use(express.json({ limit: '500mb' }));

// if you also accept URL‑encoded payloads (forms, etc.), increase that too:
app.use(express.urlencoded({
  limit: '500mb',
  extended: true,
}));

app.use(cors());

// 2) MongoDB (optional fallback)
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI
      || 'mongodb://localhost:27017/form_builder');
    console.log('✅ MongoDB connected');
    global.usingMongoDB = true;
  } catch {
    console.warn('⚠️  MongoDB failed, using in‑memory fallback');
    global.usingMongoDB = false;
  }
})();

// 3) Serve your built React files
//const PUBLIC_DIR = path.join(__dirname, 'public');
//app.use(express.static(PUBLIC_DIR));



// 4) Mount your API routes
console.log('Mounting health routes...');
app.use('/api/health',   healthRoutes);
console.log('Mounting auth routes...');
app.use('/api/auth',     authRoutes);
console.log('Mounting form routes...');
app.use('/api/forms',    formRoutes);
console.log('Mounting response routes...');
app.use('/api/responses', responseRoutes);


// --- SPA fallback (Express 5-safe) ---
// 5) **True** catch‑all for client‑side routes
//    This will match ANY path under “/” (except the ones above),
//    and serve index.html so React Router can render the correct page.
// Serve index.html for all non-API, non-file requests so React Router can handle them.
// app.get(/^\/(?!api)(?!.*\.\w+$).*/, (req, res) => {
//   res.sendFile(path.join(PUBLIC_DIR, "index.html"));
// });

// 6) Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Uncaught error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 7) Start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
