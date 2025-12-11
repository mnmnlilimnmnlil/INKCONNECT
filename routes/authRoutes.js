// 인증 라우트 - 로그인/회원가입 경로 연결

const express = require('express');
const router = express.Router();

const upload = require('../config/multer');
const authController = require('../controllers/authController');

// 회원가입 페이지
router.get('/signup', authController.getSignup);

// 회원가입 처리 (프로필 이미지 업로드 포함)
router.post('/signup', upload.single('profileImage'), authController.postSignup);

// 로그인 페이지
router.get('/signin', authController.getSignin);

// 로그인 처리
router.post('/signin', authController.postSignin);

// 로그아웃
router.get('/signout', authController.getSignout);

module.exports = router;

