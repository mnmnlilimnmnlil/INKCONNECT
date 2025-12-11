// 메인 서버 파일 - Express 앱 설정

require('dotenv').config();
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const methodOverride = require('method-override');
const session = require('express-session');
const connectDB = require('./config/dbConnect');
const { isLoggedIn } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB 연결
connectDB().catch((err) => {
  console.error('Mongo connection error:', err.message);
  process.exit(1);
});

// 뷰 엔진 설정 (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 미들웨어
app.use(express.urlencoded({ extended: true }));  // 폼 데이터 파싱
app.use(express.json());                          // JSON 파싱
app.use(methodOverride('_method'));               // PUT/DELETE 지원
app.use(morgan('dev'));                           // 요청 로그

// 세션 설정 (로그인 상태 유지용)
app.use(session({
  secret: process.env.SESSION_SECRET || 'inkconnect-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7  // 7일
  }
}));

// 정적 파일 (CSS, JS, 이미지 등)
app.use(express.static(path.join(__dirname, 'public')));

// 뷰에서 사용할 전역 변수 설정
app.use((req, res, next) => {
  res.locals.isLoggedIn = !!req.session.userId;
  res.locals.userName = req.session.userName || '';
  res.locals.userId = req.session.userId || '';
  res.locals.userRole = req.session.userRole || '';
  res.locals.isAdmin = req.session.userRole === 'admin';
  next();
});

// 라우트 연결
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

const itemRoutes = require('./routes/itemRoutes');
app.use('/items', itemRoutes);

const commentRoutes = require('./routes/commentRoutes');
app.use('/', commentRoutes);

const collabRoutes = require('./routes/collabRoutes');
app.use('/collabs', collabRoutes);

// 홈페이지 (인기 작품, 인기 작가) - 가장 먼저 처리
const userController = require('./controllers/userController');
app.get('/', userController.getHome);

// Feed 페이지 - 쿼리 파라미터 유지하며 리다이렉트
app.get('/feed', (req, res) => {
  const queryString = req.url.split('?')[1];
  const redirectUrl = queryString ? `/items?${queryString}` : '/items';
  res.redirect(redirectUrl);
});

const userRoutes = require('./routes/userRoutes');
app.use('/', userRoutes);

// 관리자 라우트
const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes);

// 404 처리
app.use((req, res) => res.status(404).send('Not Found'));

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});


