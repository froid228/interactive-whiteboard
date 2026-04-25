const express = require('express');
const boardController = require('../controllers/boardController');
const { authRequired } = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

const router = express.Router();

router.use(authRequired);
router.use(checkRole(['admin', 'user']));

router.post('/', async (req, res, next) => {
  try {
    await boardController.create(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    await boardController.getAll(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/activity', async (req, res, next) => {
  try {
    await boardController.getActivity(req, res);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    await boardController.getById(req, res);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    await boardController.update(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/share', async (req, res, next) => {
  try {
    await boardController.share(req, res);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/share/:userId', async (req, res, next) => {
  try {
    await boardController.removeCollaborator(req, res);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await boardController.delete(req, res);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
