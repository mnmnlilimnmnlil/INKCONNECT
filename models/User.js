// User 모델 - 사용자(타퉅) 타투작가 스키마

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * 아티스트 계정 정보, 프로필, 팔로우 관계 저장 정도 사실상 현재 가장 메인이되는 스키마
 */
const userSchema = new mongoose.Schema(
  {
    // 이메일 주소 (로그인 ID임)
    email: { 
      type: String,
      required: true,   //필수입력
      unique: true,
      trim: true, 
      lowercase: true
    },
    
    // 비밀번호 
    password: { 
      type: String, 
      required: true       // 필수 입력
    },
    
    // 프로필 이미지 파일 경로
    profileImage: { 
      type: String,        
      default: ''         // 기본값: 빈 문자열 (선택사항)
    },
    
    // 사용자 역할 (artist: 일반 작가, admin: 관리자)
    role: { 
      type: String, 
      default: 'artist',   // 회원가입 시 자동으로 'artist'로 설정
      enum: ['artist', 'admin']     // 'artist' 또는 'admin' 허용
    },
    
    // 작가 이름
    artistName: {
      type: String,
      required: true,      // 필수 입력
      trim: true          // 앞뒤 공백 제거하기?
    },
    
    // 작가 소개 (바이오)
    bio: {                 
      type: String,
      default: '',        // 기본값: 빈 문자열
      maxlength: 500      // 최대 500자 제한
    },
    
    //장르 설정 
    specialties: {         
      type: [String],      
      default: []         // 기본값: 빈 배열
    },
    
    // 인증 작가 여부 (관리자가 인증한 작가인지 표시)
    verified: {            
      type: Boolean,
      default: false      // 기본값: false (일반 작가)
    },
    
    // 팔로우 기능 - SNS 기능을 위한 관계 설정
    
    // 나를 팔로우하는 사용자들의 ID 배열
    // 다른 사용자가 나를 팔로우하면 이 배열에 추가됨
    followers: [{          
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'         // User 모델 참조 (자기 참조)
    }],
    
    // 내가 팔로우하는 사용자들의 ID 배열 이것도 저장 배열로 필수
    // 내가 다른 작가를 팔로우하면 이 배열에 추가됨
    following: [{          
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'         // User 모델 참조 (자기 참조)
    }]
  },
  { 
    timestamps: true       // createdAt, updatedAt 자동 추가
  }
);

/**
 * 비밀번호 확인 메서드
 * 로그인 시 입력한 비밀번호와 저장된 비밀번호를 비교합니다.
 * 
 * @param {String} candidatePassword - 확인할 비밀번호
 * @returns {Boolean} - 비밀번호가 일치하면 true, 아니면 false
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;

  // 기존 평문 비밀번호가 남아있는 경우를 대비한 하위 호환 처리
  const isHashed = this.password.startsWith('$2');
  if (!isHashed) {
    return candidatePassword === this.password;
  }

  return bcrypt.compare(candidatePassword, this.password);
};

// 신규/변경 시 비밀번호 해시
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

// findOneAndUpdate 경로에서도 비밀번호 해시 적용
userSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() || {};
  const password =
    update.password ||
    (update.$set && update.$set.password);

  if (!password) return next();

  try {
    const hashed = await bcrypt.hash(password, 10);
    if (update.$set && update.$set.password) {
      update.$set.password = hashed;
    } else {
      update.password = hashed;
    }
    this.setUpdate(update);
    next();
  } catch (err) {
    next(err);
  }
});

// User 모델 내보내기
module.exports = mongoose.model('User', userSchema);

