// 인증 컨트롤러 - 회원가입, 로그인, 로그아웃 처리

const User = require('../models/User');
const path = require('path');

// 회원가입 페이지 보여주기
function getSignup(req, res) {
  res.render('auth/signup', { title: '회원가입', error: null });
}

// 회원가입 처리
async function postSignup(req, res, next) {
  try {
    // 사용자가 입력한 데이터 가져오기
    const { email, password, artistName, bio, specialties } = req.body;
    
    // 필수 입력값 체크
    if (!artistName || !email || !password) {
      return res.render('auth/signup', {
        title: '회원가입',
        error: 'Please enter Artist Name, Email, and Password.'
      });
    }

    // 이메일 중복 체크
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('auth/signup', {
        title: '회원가입',
        error: '이미 사용 중인 이메일입니다.'
      });
    }

    // 프로필 이미지 경로 처리
    const profileImage = req.file ? `/uploads/${req.file.filename}` : '';

    // specialties를 배열로 변환 (체크박스에서 여러 개 선택 가능ㅎ다고함함)
    const specialtiesArray = specialties ? (Array.isArray(specialties) ? specialties : [specialties]) : [];

    // 새 사용자 저장
    const user = await User.create({
      email,
      password,
      profileImage,
      artistName,                        // Artist Name (required)
      bio: bio || '',                   // 작가 소개 (선택)
      specialties: specialtiesArray,    // 전문 분야 (선택, 배열)
      role: 'artist'                    // 자동으로 artist로 등록
    });

    // 세션에 저장해서 자동 로그인
    req.session.userId = user._id.toString();
    req.session.userName = user.artistName;
    req.session.userRole = user.role;

    res.redirect('/');
    
  } catch (err) {
    next(err);
  }
}

// 로그인 페이지 보여주기
function getSignin(req, res) {
  res.render('auth/signin', {
    title: '로그인',
    error: req.query.error || null
  });
}

// 로그인 처리
async function postSignin(req, res, next) {
  try {
    const { email, password } = req.body;

    // 입력값 체크
    if (!email || !password) {
      return res.render('auth/signin', {
        title: '로그인',
        error: '이메일과 비밀번호를 입력해주세요.'
      });
    }

    // 이메일로 사용자 찾기
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('auth/signin', {
        title: '로그인',
        error: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 비밀번호 확인
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('auth/signin', {
        title: '로그인',
        error: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 세션에 저장해서 로그인 상태 유지
    req.session.userId = user._id.toString();
    req.session.userName = user.artistName;
    req.session.userRole = user.role;

    // 원래 가려던 페이지로 이동 (없으면 홈으로)
    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(returnTo);
    
  } catch (err) {
    next(err);
  }
}

// 로그아웃 처리
function getSignout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
}

module.exports = {
  getSignup,
  postSignup,
  getSignin,
  postSignin,
  getSignout
};

