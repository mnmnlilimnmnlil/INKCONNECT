// 파일 업로드 설정 - multer로 프로필 이미지 업로드 처리

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// uploads 폴더가 없으면 생성
const uploadsDir = 'public/uploads/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 파일 저장 설정
const storage = multer.diskStorage({
  // 저장 위치: public/uploads/
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  
  // 파일명: 고유한 이름으로 저장 (덮어쓰기 방지)
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'profileImage' ? 'profile-' : 'artwork-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

// multer 설정
const upload = multer({
  storage: storage,
  
  // 최대 5MB까지 허용
  limits: { 
    fileSize: 5 * 1024 * 1024
  },
  
  // 이미지 파일만 허용
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    
    cb(new Error('이미지 파일만 업로드 가능합니다.'));
  }
});

module.exports = upload;

