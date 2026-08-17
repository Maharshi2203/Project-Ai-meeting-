const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  processMeetingAI,
  debugPdfExtraction
} = require('../controllers/meetingController');

// Multer memory storage configuration with 5MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.use(authMiddleware);

router.get('/', getMeetings);
router.post('/', upload.single('file'), createMeeting);
router.post('/debug-pdf', upload.single('file'), debugPdfExtraction);
router.get('/:id', getMeetingById);
router.put('/:id', updateMeeting);
router.delete('/:id', deleteMeeting);
router.post('/:id/process', processMeetingAI);

module.exports = router;
