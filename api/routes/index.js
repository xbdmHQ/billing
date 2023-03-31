const express = require('express');
const router = express.Router();

/**
 * @route /api
 * @method GET
 * @description Get all API routes
 */
router.get('/', (req, res) => {
  try {
    res.json({
      message: 'Welcome to MrDemonWOlf, Inc. Billing API',
      routes: []
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      code: 'SERVER_ERROR',
      error: 'Internal Server Error.'
    });
  }
});

module.exports = router;
