// 초기 관리자 계정 생성 스크립트
// 사용법: npm run create-admin

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/dbConnect');

async function createAdmin() {
  try {
    console.log('MongoDB 연결 중...');
    await connectDB();
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@inkconnect.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || '관리자';
    
    // 기존 관리자 확인
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️  관리자 계정이 이미 존재합니다.');
      console.log(`이메일: ${existingAdmin.email}`);
      console.log(`역할: ${existingAdmin.role}`);
      process.exit(0);
    }
    
    // 관리자 계정 생성
    console.log('관리자 계정 생성 중...');
    const admin = await User.create({
      email: adminEmail,
      password: adminPassword,
      artistName: adminName,
      role: 'admin',
      verified: true,
      bio: '시스템 관리자'
    });
    
    console.log('\n✅ 관리자 계정이 생성되었습니다!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`이메일: ${admin.email}`);
    console.log(`비밀번호: ${adminPassword}`);
    console.log(`이름: ${admin.artistName}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  보안을 위해 로그인 후 반드시 비밀번호를 변경하세요!');
    console.log('⚠️  프로덕션 환경에서는 .env 파일에 ADMIN_PASSWORD를 설정하세요!');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ 관리자 계정 생성 실패:', err.message);
    process.exit(1);
  }
}

createAdmin();

