// 댓글 라우트 - 댓글 CRUD 경로 연결

const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { requireAuth } = require('../middleware/auth');

// 작품별 댓글 목록 조회
router.get('/items/:itemId/comments', commentController.getComments);

// 댓글 작성
router.post('/items/:itemId/comments', requireAuth, commentController.createComment);

// 댓글 수정
router.put('/comments/:commentId', requireAuth, commentController.updateComment);

// 댓글 삭제
router.delete('/comments/:commentId', requireAuth, commentController.deleteComment);

module.exports = router;

