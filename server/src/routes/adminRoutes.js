const express = require('express');
const adminController = require('../controllers/adminController');
const { authRequired } = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

const router = express.Router();

router.use(authRequired);
router.use(checkRole(['admin']));

router.get('/users', async (req, res, next) => {
  try {
    await adminController.getUsers(req, res);
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    await adminController.updateUser(req, res);
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    await adminController.deleteUser(req, res);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
