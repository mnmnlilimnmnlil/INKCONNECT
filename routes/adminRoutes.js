// 관리자 라우트 - 관리자 기능 경로 연결

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

// 모든 관리자 라우트에 권한 체크 적용
router.use(requireAdmin);

// 관리자 대시보드
router.get('/dashboard', adminController.getDashboard);

// 작가 관리
router.get('/artists', adminController.getArtists);
router.post('/artists/:id/verify', adminController.toggleArtistVerification);
router.delete('/artists/:id', adminController.deleteArtist);

// 작품 관리
router.get('/items', adminController.getItems);
router.delete('/items/:id', adminController.deleteItem);

// 댓글 관리
router.get('/comments', adminController.getComments);
router.delete('/comments/:id', adminController.deleteComment);

module.exports = router;

