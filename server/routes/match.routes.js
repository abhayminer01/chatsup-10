const router = require('express').Router();

router.post('/join', (req, res) => {
  const { id, gender, tags } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: 'User ID required' });
  }

  // We’ll emit joinPool from frontend using Socket.io
  res.status(200).json({ success: true, message: 'Joining pool...' });
});

module.exports = router;
