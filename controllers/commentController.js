// 댓글 컨트롤러 - 댓글 CRUD 처리

const Comment = require('../models/Comment');
const Item = require('../models/Item');

// 댓글 작성
async function createComment(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }
    
    const { content } = req.body;
    const itemId = req.params.itemId;
    
    // 입력값 체크
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: '댓글 내용을 입력해주세요.' });
    }
    
    // 작품 존재 확인
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: '작품을 찾을 수 없습니다.' });
    }
    
    // 댓글 생성
    const comment = await Comment.create({
      content: content.trim(),
      author: req.session.userId,
      item: itemId
    });
    
    // 작성자 정보와 함께 반환
    await comment.populate('author', 'artistName profileImage');
    
    res.status(201).json({
      success: true,
      comment: {
        _id: comment._id,
        content: comment.content,
        author: comment.author,
        createdAt: comment.createdAt
      }
    });
    
  } catch (err) {
    next(err);
  }
}

// 댓글 목록 조회 (작품별)
async function getComments(req, res, next) {
  try {
    const itemId = req.params.itemId;
    
    const comments = await Comment.find({ item: itemId })
      .populate('author', 'artistName profileImage')
      .sort({ createdAt: -1 }); // 최신순
    
    res.json({
      success: true,
      comments: comments
    });
    
  } catch (err) {
    next(err);
  }
}

// 댓글 수정
async function updateComment(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }
    
    const { content } = req.body;
    const commentId = req.params.commentId;
    
    // 입력값 체크
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: '댓글 내용을 입력해주세요.' });
    }
    
    // 댓글 조회 및 권한 확인
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    }
    
    // 작성자 본인만 수정 가능
    if (comment.author.toString() !== req.session.userId) {
      return res.status(403).json({ error: '댓글을 수정할 권한이 없습니다.' });
    }
    
    // 댓글 수정
    comment.content = content.trim();
    await comment.save();
    
    await comment.populate('author', 'artistName profileImage');
    
    res.json({
      success: true,
      comment: {
        _id: comment._id,
        content: comment.content,
        author: comment.author,
        updatedAt: comment.updatedAt
      }
    });
    
  } catch (err) {
    next(err);
  }
}

// 댓글 삭제
async function deleteComment(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }
    
    const commentId = req.params.commentId;
    
    // 댓글 조회 및 권한 확인
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    }
    
    // 작성자 본인만 삭제 가능
    if (comment.author.toString() !== req.session.userId) {
      return res.status(403).json({ error: '댓글을 삭제할 권한이 없습니다.' });
    }
    
    // 댓글 삭제
    await Comment.findByIdAndDelete(commentId);
    
    res.json({
      success: true,
      message: '댓글이 삭제되었습니다.'
    });
    
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createComment,
  getComments,
  updateComment,
  deleteComment
};

