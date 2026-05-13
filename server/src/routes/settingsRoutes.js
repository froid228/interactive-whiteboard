const express = require('express');
const settingsController = require('../controllers/settingsController');
const { authRequired } = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

const router = express.Router();

router.use(authRequired);

router.get('/', async (req, res, next) => {
  try {
    await settingsController.getSettings(req, res);
  } catch (error) {
    next(error);
  }
});

router.put('/', checkRole(['admin']), async (req, res, next) => {
  try {
    await settingsController.updateSettings(req, res);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
