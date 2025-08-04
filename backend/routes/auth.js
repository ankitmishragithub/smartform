const express = require('express');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcrypt');
const User    = require('../models/user');
const router  = express.Router();

// Register (admin only via DB seed or protect later)
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;
  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash: hash, role });
  res.status(201).json({ id: user._id, email: user.email });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { sub: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  res.json({ token });
});

module.exports = router;
