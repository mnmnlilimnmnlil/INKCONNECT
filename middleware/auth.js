// 인증 미들웨어 - 로그인 체크 기능

const User = require('../models/User');

// 로그인 여부만 확인 (로그인 안 했어도 통과)
function isLoggedIn(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  next();
}

// 로그인 필수 (업로드, 좋아요, 댓글 등에 접근하려면 로그인 필요)
function requireAuth(req, res, next) {
  if (req.session.userId) {
    return next();
  }

  // AJAX 요청이면 JSON으로 에러 반환
  const acceptsJson = req.xhr || req.headers['content-type']?.includes('application/json') || req.headers.accept?.includes('application/json');
  if (acceptsJson) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  // 원래 가려던 URL 저장 (로그인 후 돌아오기 위해)
  req.session.returnTo = req.originalUrl;
  // 로그인 페이지로 리다이렉트
  return res.status(401).render('auth/signin', {
    title: '로그인',
    error: '로그인이 필요합니다.'
  });
}

// 관리자 권한 체크
async function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    // AJAX 요청이면 JSON으로 에러 반환
    if (req.xhr || req.headers['content-type']?.includes('application/json')) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }
    return res.status(401).render('auth/signin', {
      title: '로그인',
      error: '로그인이 필요합니다.'
    });
  }
  
  try {
    const user = await User.findById(req.session.userId);
    
    if (!user || user.role !== 'admin') {
      // AJAX 요청이면 JSON으로 에러 반환
      if (req.xhr || req.headers['content-type']?.includes('application/json')) {
        return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
      }
      return res.status(403).send('관리자 권한이 필요합니다.');
    }
    
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { isLoggedIn, requireAuth, requireAdmin };

