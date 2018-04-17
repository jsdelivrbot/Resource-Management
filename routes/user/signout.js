const express = require('express');
const router = express.Router();

router.delete('/', (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.status(200).json();
  }, () => {
    res.status(400).json();
  });
});

module.exports = router;