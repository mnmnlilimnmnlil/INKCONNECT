// 사용자 라우트 - 작가 프로필, 팔로우 등

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const upload = require('../config/multer');
const { requireAuth } = require('../middleware/auth');

router.get('/artists', ctrl.getArtists);            // 작가 목록
router.get('/artist/:id', ctrl.getArtist);           // 작가 프로필
router.post('/artist/:id/follow', requireAuth, ctrl.toggleFollow); // 팔로우 토글
router.get('/myink', requireAuth, ctrl.getMyInk);                // 내 프로필
router.put('/myink', requireAuth, upload.single('profileImage'), ctrl.updateProfile); // 프로필 수정 (공개 정보)
router.put('/myink/account', requireAuth, ctrl.updateAccount);   // 개인정보 수정 (비공개 정보)
router.delete('/myink', requireAuth, ctrl.deleteAccount);        // 회원 탈퇴
router.get('/inspire', requireAuth, ctrl.getInspire);           // 좋아요한 작품
router.get('/dropink', requireAuth, ctrl.getDropInk);           // 작품 업로드 폼

module.exports = router;

