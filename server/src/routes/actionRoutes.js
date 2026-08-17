const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createActionItem,
  getActionItems,
  getActionItemById,
  updateActionItem,
  deleteActionItem
} = require('../controllers/actionController');

router.use(authMiddleware);

router.get('/', getActionItems);
router.post('/', createActionItem);
router.get('/:id', getActionItemById);
router.put('/:id', updateActionItem);
router.delete('/:id', deleteActionItem);

module.exports = router;
