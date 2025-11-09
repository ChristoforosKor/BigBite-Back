const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); 

router.post('/logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
   const path = req.file.path .replace(/^.*\/public/, ''); 
   const fullUrl = `https://recyclebin.mnss.eu${path}`;
    res.json({ logoPath: fullUrl });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});
module.exports = router;
