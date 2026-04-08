const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const checkRole = require('../middleware/roleCheck');

// Все маршруты с проверкой роли (Практики 7 и 8)
router.post('/', 
  checkRole(['admin', 'user']), 
  boardController.create.bind(boardController)
);

router.get('/', 
  checkRole(['admin', 'user']), 
  boardController.getAll.bind(boardController)
);

router.get('/:id', 
  checkRole(['admin', 'user']), 
  boardController.getById.bind(boardController)
);

router.put('/:id', 
  checkRole(['admin', 'user']), 
  boardController.update.bind(boardController)
);

router.delete('/:id', 
  checkRole(['admin', 'user']), 
  boardController.delete.bind(boardController)
);

module.exports = router;