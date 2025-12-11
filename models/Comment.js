// Comment 모델 - 작품에 대한 댓글 다는 스키마

const mongoose = require('mongoose');

/**
 * 작품에 대한 댓글 스키마 정의
 * 사용자가 작품에 남긴 댓글을 저ㅈㅏㅇ
 */
const commentSchema = new mongoose.Schema(
  {
    // 댓글 내용 (필수)
        content: { 
      type: String, 
      required: true,      
      trim: true,
      maxlength: 500       
    },
    
    // 댓글을 작성한 사용자 (User 모델 참조)
    author: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',      
      required: true     , 
    },
    
    // 댓글이 달린 작품 (Item 모델 참조)
    item: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Item',        
      required: true      
    }
  },
  { 
    timestamps: true    
  }
);

// 인덱스 추가 (조회 성능 향상)
commentSchema.index({ item: 1, createdAt: -1 }); 
commentSchema.index({ author: 1 }); 

module.exports = mongoose.model('Comment', commentSchema);

