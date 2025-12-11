const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/itemController');
const upload = require('../config/multer');
const { requireAuth } = require('../middleware/auth');

router.get('/', ctrl.listItems);           // Feed 페이지
router.post('/', requireAuth, upload.single('image'), ctrl.createItem);  // 작품 업로드
router.get('/:id', ctrl.getItem);          // 작품 상세
router.put('/:id', requireAuth, upload.single('image'), ctrl.updateItem); // 작품 수정
router.delete('/:id', requireAuth, ctrl.deleteItem);    // 작품 삭제
router.post('/:id/like', requireAuth, ctrl.toggleLike); // 좋아요 토글

module.exports = router;


