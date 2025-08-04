const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const Bundle = require('../models/Bundle');
const router = express.Router();

// Admin CRUD
router.use(requireAuth, requireAdmin);

router.post('/', async (req, res) => {
  const slug = require('crypto').randomBytes(6).toString('hex');
  const bundle = await Bundle.create({
    ...req.body,
    shareLink: slug,
    createdBy: req.user.id
  });
  res.status(201).json(bundle);
});
router.get('/', async (req, res) => {
  res.json(
    await Bundle.find({ createdBy: req.user.id }).populate('forms', 'title')
  );
});
router.put('/:id', async (req, res) => {
  res.json(
    await Bundle.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true }
    )
  );
});
router.delete('/:id', async (req, res) => {
  await Bundle.deleteOne({ _id: req.params.id, createdBy: req.user.id });
  res.status(204).end();
});

// Public share
router.get('/share/:slug', requireAuth, async (req, res) => {
  const b = await Bundle.findOne({ shareLink: req.params.slug }).populate('forms');
  if (!b) return res.status(404).json({ error: 'Not found' });
  res.json(b);
});

module.exports = router;
