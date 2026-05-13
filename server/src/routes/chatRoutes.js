const express = require('express');
const chatController = require('../controllers/chatController');
const { authRequired } = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

const router = express.Router();

router.use(authRequired);
router.use(checkRole(['admin', 'user']));

router.get('/:boardId/messages', async (req, res, next) => {
  try {
    await chatController.getMessages(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/:boardId/messages', async (req, res, next) => {
  try {
    await chatController.createMessage(req, res);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
