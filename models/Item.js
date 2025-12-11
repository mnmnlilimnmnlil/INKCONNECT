// Item ㅅㅋ 마

const mongoose = require('mongoose');

/**
 * 작품관련 스키마 정의 중ㅇ요함
 * 타투 작가가 업로드한 작품의 정보를 저장하기
 */
const itemSchema = new mongoose.Schema(
  {
    // 작품 제목 (필수)
    title: { 
      type: String, 
      required: true,      // 필수 입력
      trim: true          // 앞뒤 공백 제거
    },
    
    // 작품 설명 (선택사항)
    description: { 
      type: String, 
      default: '',        // 기본값: 빈 문자열
      trim: true          // 앞뒤 공백 제거
    },
    
    // 작품 이미지 파일 경로
    image: { 
      type: String, 
      default: ''         // 기본값: 빈 문자열
    },
    
    // 작품을 업로드한 작가 (User 모델 꼭 참조해야하는것
    // 필수 필드이며, 작품은 반드시 작가와 연결되도록끔
    author: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',        // User 모델 참조
      required: true      // 필수 입력
    },
    
    // 좋아요를 누른 사용자들의 ID 배열
    // 여러 사용자가 좋아요를 누를 수 있으므로 배열로 저장해버리기 중요하다
    likes: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User'         // User 모델 참조
    }],
    
    // 작품 카테고리 (배열 - 여러 카테고리 선택 가능)
    category: {
      type: [String],
      default: []         // 기본값: 빈 배열
    }
  },
  { 
    timestamps: true      // createdAt, updatedAt 자동 추가
  }
);
module.exports = mongoose.model('Item', itemSchema);


