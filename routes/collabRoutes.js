const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/collabController');
const { requireAuth } = require('../middleware/auth');

// 목록
router.get('/', ctrl.listCollabs);

// 작성
router.get('/new', requireAuth, ctrl.getNewCollab);
router.post('/', requireAuth, ctrl.createCollab);

// 상세
router.get('/:id', ctrl.getCollab);

// 토글 액션
router.post('/:id/participate', requireAuth, ctrl.toggleParticipate);
router.post('/:id/like', requireAuth, ctrl.toggleLike);

// 삭제
router.delete('/:id', requireAuth, ctrl.deleteCollab);

module.exports = router;

