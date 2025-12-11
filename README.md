# InkConnect

타투이스트들의 작품을 공유하고 타투이스트들을 연결하는 SNS 플랫폼

## 📋 프로젝트 개요

**InkConnect**는 타투 작가들이 자신의 작품을 공유하고, 서로 팔로우하며 소통할 수 있는 소셜 네트워크 서비스입니다. 작가들은 작품을 업로드하고, 좋아요와 댓글을 통해 상호작용하며, 콜라보 보드를 통해 협업 기회를 찾을 수 있습니다.

### 주요 기능
- ✅ 작가 회원가입 및 프로필 관리
- ✅ 작품 업로드 및 피드 공유
- ✅ 팔로우/좋아요/댓글 기능
- ✅ 콜라보 보드 (협업 제안 및 참여)
- ✅ 관리자 대시보드 (작가 인증, 콘텐츠 관리)
- ✅ 인기 작품/작가 추천 시스템

---

## 🏗️ 프로젝트 구조

```
inkconnect/
├── app.js                    # 메인 서버 파일 (Express 앱 설정)
├── config/
│   ├── dbConnect.js         # MongoDB 연결 설정
│   └── multer.js            # 파일 업로드 설정 (Multer)
├── controllers/
│   ├── adminController.js   # 관리자 기능 컨트롤러
│   ├── authController.js    # 인증 컨트롤러 (회원가입/로그인/로그아웃)
│   ├── collabController.js  # 콜라보 보드 컨트롤러
│   ├── commentController.js # 댓글 컨트롤러
│   ├── itemController.js    # 작품 컨트롤러 (CRUD)
│   └── userController.js    # 사용자 컨트롤러 (프로필/팔로우)
├── middleware/
│   └── auth.js              # 인증 미들웨어 (로그인 체크, 관리자 권한)
├── models/
│   ├── User.js              # 사용자(작가) 스키마
│   ├── Item.js              # 작품 스키마
│   ├── Comment.js           # 댓글 스키마
│   └── Collab.js            # 콜라보 스키마
├── routes/
│   ├── adminRoutes.js       # 관리자 라우트
│   ├── authRoutes.js        # 인증 라우트
│   ├── collabRoutes.js      # 콜라보 라우트
│   ├── commentRoutes.js     # 댓글 라우트
│   ├── itemRoutes.js        # 작품 라우트
│   └── userRoutes.js        # 사용자 라우트
├── scripts/
│   └── createAdmin.js       # 초기 관리자 계정 생성 스크립트
├── views/                   # EJS 템플릿 파일들
│   ├── admin/               # 관리자 페이지
│   ├── auth/                # 로그인/회원가입 페이지
│   ├── include/             # 공통 헤더/푸터
│   ├── artist.ejs          # 작가 프로필 페이지
│   ├── artists.ejs         # 작가 목록 페이지
│   ├── collabs.ejs         # 콜라보 목록 페이지
│   ├── collab_detail.ejs   # 콜라보 상세 페이지
│   ├── collab_new.ejs      # 콜라보 작성 페이지
│   ├── detail.ejs          # 작품 상세 페이지
│   ├── dropink.ejs         # 작품 업로드 페이지
│   ├── feed.ejs            # 피드 페이지 (작품 목록)
│   ├── home.ejs           # 메인 페이지
│   ├── inspire.ejs        # 좋아요한 작품 모아보기
│   └── myink.ejs          # 마이페이지
└── public/
    └── uploads/            # 업로드된 이미지 파일 저장소
```

---

## 📦 사용된 라이브러리 (Dependencies)

### 핵심 프레임워크
- **express** (^4.19.2) - Node.js 웹 프레임워크
- **ejs** (^3.1.10) - 서버 사이드 템플릿 엔진

### 데이터베이스
- **mongoose** (^8.7.0) - MongoDB ODM (Object Document Mapper)

### 인증 및 보안
- **bcryptjs** (^2.4.3) - 비밀번호 해싱
- **express-session** (^1.18.1) - 세션 관리
- **dotenv** (^16.4.5) - 환경 변수 관리

### 파일 업로드
- **multer** (^1.4.5-lts.1) - 파일 업로드 미들웨어

### 유틸리티
- **method-override** (^3.0.0) - HTTP 메서드 오버라이드 (PUT/DELETE 지원)
- **morgan** (^1.10.0) - HTTP 요청 로거

### 개발 도구
- **nodemon** (^3.1.10) - 개발 서버 자동 재시작

---

## 🗄️ 데이터베이스 스키마

### 1. User (사용자/작가)
타투 작가의 계정 정보, 프로필, 팔로우 관계를 저장하는 핵심 스키마입니다.

```javascript
{
  email: String (unique, required),        // 로그인 ID
  password: String (hashed, required),   // bcrypt 해시된 비밀번호
  profileImage: String,                    // 프로필 이미지 경로
  role: String (enum: ['artist', 'admin']), // 역할 (기본값: 'artist')
  artistName: String (required),           // 작가 이름
  bio: String (maxlength: 500),            // 작가 소개
  specialties: [String],                  // 전문 장르 배열
  verified: Boolean (default: false),     // 관리자 인증 여부
  followers: [ObjectId],                  // 나를 팔로우하는 사용자들
  following: [ObjectId],                  // 내가 팔로우하는 사용자들
  createdAt: Date,                        // 생성일 (자동)
  updatedAt: Date                         // 수정일 (자동)
}
```

**주요 메서드:**
- `comparePassword(candidatePassword)` - 비밀번호 비교 (bcrypt)

**Pre-hooks:**
- `save` - 비밀번호 자동 해싱
- `findOneAndUpdate` - 업데이트 시 비밀번호 해싱

---

### 2. Item (작품)
타투 작가가 업로드한 작품의 정보를 저장합니다.

```javascript
{
  title: String (required),               // 작품 제목
  description: String,                    // 작품 설명
  image: String,                          // 작품 이미지 경로
  author: ObjectId (ref: 'User', required), // 업로드한 작가
  likes: [ObjectId (ref: 'User')],        // 좋아요를 누른 사용자들
  category: [String],                     // 작품 카테고리 배열
  createdAt: Date,                        // 생성일 (자동)
  updatedAt: Date                         // 수정일 (자동)
}
```

**카테고리 예시:** 블랙워크, 재패니즈, 리얼리스틱, 트래디셔널, 올드스쿨, 뉴스쿨 등

---

### 3. Comment (댓글)
작품에 대한 댓글을 저장합니다.

```javascript
{
  content: String (required, maxlength: 500), // 댓글 내용
  author: ObjectId (ref: 'User', required),   // 댓글 작성자
  item: ObjectId (ref: 'Item', required),     // 댓글이 달린 작품
  createdAt: Date,                            // 생성일 (자동)
  updatedAt: Date                             // 수정일 (자동)
}
```

**인덱스:**
- `{ item: 1, createdAt: -1 }` - 작품별 댓글 조회 성능 향상
- `{ author: 1 }` - 작성자별 댓글 조회 성능 향상

---

### 4. Collab (콜라보)
타투이스트들 간의 협업 제안 및 게스트스팟 정보를 저장합니다.

```javascript
{
  author: ObjectId (ref: 'User', required), // 작성자 (작가만)
  title: String (required),                 // 제목
  description: String (maxlength: 2000),    // 설명
  styles: [String],                         // 스타일 태그 배열
  location: String,                         // 위치 (도시/샵)
  startDate: Date,                         // 시작일
  endDate: Date,                           // 종료일
  status: String (enum: ['open', 'closed']), // 상태 (기본값: 'open')
  participants: [ObjectId (ref: 'User')],   // 참여한 작가들
  likes: [ObjectId (ref: 'User')],         // 좋아요를 누른 사용자들
  createdAt: Date,                          // 생성일 (자동)
  updatedAt: Date                           // 수정일 (자동)
}
```

**상태 자동 도출 로직:**
- 종료일이 지났거나 남은 일수가 0일 이하 → `closed` (마감)
- 그 외 → `open` (모집중)

**인덱스:**
- `{ status: 1, createdAt: -1 }` - 상태별 최신순 조회
- `{ styles: 1 }` - 스타일별 검색
- 텍스트 검색 인덱스 (location, title, description)

---

## 📁 파일별 상세 설명

### 서버 설정 파일

#### `app.js`
- Express 앱의 메인 진입점
- 미들웨어 설정 (body-parser, session, morgan 등)
- 정적 파일 서빙 설정
- 라우트 연결 및 404 처리
- MongoDB 연결 초기화
- 전역 변수 설정 (res.locals에 로그인 상태, 사용자 정보 등)

#### `config/dbConnect.js`
- MongoDB 연결 함수
- 연결 실패 시 에러 처리 및 안내 메시지

#### `config/multer.js`
- 파일 업로드 설정 (Multer)
- 프로필 이미지와 작품 이미지 구분 저장
- 파일 크기 제한 (5MB)
- 이미지 파일만 허용 (jpeg, jpg, png, gif, webp)

---

### 컨트롤러 파일

#### `controllers/authController.js`
- **getSignup** - 회원가입 페이지 렌더링
- **postSignup** - 회원가입 처리 (비밀번호 해싱, 프로필 이미지 업로드)
- **getSignin** - 로그인 페이지 렌더링
- **postSignin** - 로그인 처리 (비밀번호 검증, 세션 생성)
- **getSignout** - 로그아웃 처리 (세션 삭제)

#### `controllers/userController.js`
- **getHome** - 메인 페이지 (인기 작품, 인기 작가 표시)
- **getArtists** - 작가 목록 페이지
- **getArtist** - 작가 프로필 페이지
- **toggleFollow** - 팔로우/언팔로우 토글
- **getMyInk** - 마이페이지
- **updateProfile** - 프로필 수정 (공개 정보)
- **updateAccount** - 개인정보 수정 (이메일, 비밀번호)
- **getInspire** - 좋아요한 작품 모아보기
- **getDropInk** - 작품 업로드 페이지 렌더링
- **deleteAccount** - 회원 탈퇴 (관련 데이터 정리)

#### `controllers/itemController.js`
- **listItems** - 피드 페이지 (작품 목록, 검색, 카테고리 필터, 페이지네이션)
- **createItem** - 작품 업로드
- **getItem** - 작품 상세 페이지
- **updateItem** - 작품 수정
- **deleteItem** - 작품 삭제
- **toggleLike** - 좋아요/좋아요 취소 토글

#### `controllers/commentController.js`
- **createComment** - 댓글 작성
- **getComments** - 댓글 목록 조회
- **updateComment** - 댓글 수정
- **deleteComment** - 댓글 삭제

#### `controllers/collabController.js`
- **listCollabs** - 콜라보 목록 (검색, 상태 필터, 페이지네이션)
- **createCollab** - 콜라보 작성
- **getCollab** - 콜라보 상세 페이지
- **toggleParticipate** - 참여/참여 취소 토글
- **toggleLike** - 좋아요 토글
- **deleteCollab** - 콜라보 삭제

#### `controllers/adminController.js`
- **getDashboard** - 관리자 대시보드 (통계, 최근 가입자, 최근 작품 등)
- **getArtists** - 작가 관리 페이지
- **toggleArtistVerification** - 작가 인증 토글
- **deleteArtist** - 작가 계정 삭제
- **getItems** - 작품 관리 페이지
- **deleteItem** - 작품 삭제
- **getComments** - 댓글 관리 페이지
- **deleteComment** - 댓글 삭제

---

### 미들웨어 파일

#### `middleware/auth.js`
- **isLoggedIn** - 로그인 여부 확인 (선택적)
- **requireAuth** - 로그인 필수 (비로그인 시 로그인 페이지로 리다이렉트)
- **requireAdmin** - 관리자 권한 필수 (관리자가 아니면 403 에러)

---

### 라우트 파일

#### `routes/authRoutes.js`
- `GET /auth/signup` - 회원가입 페이지
- `POST /auth/signup` - 회원가입 처리
- `GET /auth/signin` - 로그인 페이지
- `POST /auth/signin` - 로그인 처리
- `GET /auth/signout` - 로그아웃

#### `routes/userRoutes.js`
- `GET /artists` - 작가 목록
- `GET /artist/:id` - 작가 프로필
- `POST /artist/:id/follow` - 팔로우 토글
- `GET /myink` - 마이페이지
- `PUT /myink` - 프로필 수정
- `PUT /myink/account` - 개인정보 수정
- `DELETE /myink` - 회원 탈퇴
- `GET /inspire` - 좋아요한 작품 모아보기
- `GET /dropink` - 작품 업로드 페이지

#### `routes/itemRoutes.js`
- `GET /items` - 피드 페이지 (작품 목록)
- `POST /items` - 작품 업로드
- `GET /items/:id` - 작품 상세
- `PUT /items/:id` - 작품 수정
- `DELETE /items/:id` - 작품 삭제
- `POST /items/:id/like` - 좋아요 토글

#### `routes/commentRoutes.js`
- `GET /items/:itemId/comments` - 댓글 목록
- `POST /items/:itemId/comments` - 댓글 작성
- `PUT /comments/:commentId` - 댓글 수정
- `DELETE /comments/:commentId` - 댓글 삭제

#### `routes/collabRoutes.js`
- `GET /collabs` - 콜라보 목록
- `POST /collabs` - 콜라보 작성
- `GET /collabs/:id` - 콜라보 상세
- `POST /collabs/:id/participate` - 참여 토글
- `POST /collabs/:id/like` - 좋아요 토글
- `DELETE /collabs/:id` - 콜라보 삭제

#### `routes/adminRoutes.js`
- `GET /admin/dashboard` - 관리자 대시보드
- `GET /admin/artists` - 작가 관리
- `POST /admin/artists/:id/verify` - 작가 인증 토글
- `DELETE /admin/artists/:id` - 작가 삭제
- `GET /admin/items` - 작품 관리
- `DELETE /admin/items/:id` - 작품 삭제
- `GET /admin/comments` - 댓글 관리
- `DELETE /admin/comments/:id` - 댓글 삭제

---

### 스크립트 파일

#### `scripts/createAdmin.js`
- 초기 관리자 계정 생성 스크립트
- `.env` 파일의 `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` 사용
- 실행: `npm run create-admin`

---

## 🔐 보안 기능

### 비밀번호 보안
- **bcryptjs**를 사용한 비밀번호 해싱 (salt rounds: 10)
- 저장 시 자동 해싱 (pre-save hook)
- 업데이트 시에도 자동 해싱 (pre-findOneAndUpdate hook)
- 기존 평문 비밀번호와의 하위 호환 처리

### 세션 관리
- **express-session**을 사용한 서버 사이드 세션
- 쿠키 설정: httpOnly, maxAge (7일)
- 세션 시크릿 키는 환경 변수로 관리

### 인증 미들웨어
- 로그인 필수 기능에 `requireAuth` 적용
- 관리자 기능에 `requireAdmin` 적용
- 비로그인 시 적절한 에러 메시지 및 리다이렉트

---

## 🎨 주요 기능 흐름

### 1. 회원가입 및 로그인
1. 사용자가 회원가입 페이지에서 정보 입력
2. 비밀번호는 bcrypt로 해싱되어 저장
3. 프로필 이미지 업로드 (선택사항)
4. 로그인 시 세션 생성 및 사용자 정보 저장

### 2. 작품 업로드 및 피드
1. 작가가 Drop Ink 페이지에서 작품 정보 입력 및 이미지 업로드
2. 작품이 Item 컬렉션에 저장되고 피드에 표시
3. 다른 사용자들이 좋아요 및 댓글 작성 가능

### 3. 팔로우 시스템
1. 작가 프로필에서 팔로우 버튼 클릭
2. 현재 사용자의 `following` 배열에 추가
3. 대상 작가의 `followers` 배열에 추가
4. 팔로워 수가 실시간으로 업데이트

### 4. 콜라보 보드
1. 작가가 콜라보 제안 작성 (제목, 설명, 스타일, 위치, 기간)
2. 다른 작가들이 참여하기 버튼으로 참여 신청
3. 종료일 기준으로 자동으로 모집중/마감 상태 표시

### 5. 관리자 기능
1. 관리자만 접근 가능한 대시보드
2. 작가 인증 토글 (verified 필드)
3. 작품/댓글/작가 삭제 권한

---

## 📊 데이터 예시

### User 데이터 예시
```json
{
  "email": "artist@example.com",
  "password": "$2a$10$...", // 해시된 비밀번호
  "artistName": "홍길동",
  "role": "artist",
  "specialties": ["블랙워크", "라인워크"],
  "verified": false,
  "followers": [],
  "following": []
}
```

### Item 데이터 예시
```json
{
  "title": "Black Rose",
  "description": "블랙워크 장미 타투",
  "image": "/uploads/artwork-1234567890.jpg",
  "author": ObjectId("..."),
  "category": ["블랙워크"],
  "likes": [ObjectId("..."), ObjectId("...")]
}
```

### Collab 데이터 예시
```json
{
  "title": "4월 서울 블랙워크 듀오 플래시 콜라보",
  "description": "블랙워크/라인워크 플래시로 하루 동시 진행",
  "styles": ["블랙워크", "라인워크"],
  "location": "서울 합정 근처 스튜디오",
  "startDate": "2025-04-12",
  "endDate": "2025-04-13",
  "status": "open",
  "participants": [ObjectId("...")],
  "likes": [ObjectId("...")]
}
```

---

## 🚀 실행 방법

### 환경 변수 설정 (.env 파일)
```env
DB_URI=mongodb+srv://username:password@cluster.mongodb.net/inkconnect
SESSION_SECRET=your-secret-key-here
ADMIN_EMAIL=admin@inkconnect.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=관리자
PORT=3000
```

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행 (nodemon)
npm run dev

# 프로덕션 서버 실행
npm start

# 관리자 계정 생성
npm run create-admin
```

---

## 📝 추가 정보

### 비로그인 사용자 제한
- 비로그인 시 피드와 작가 프로필만 조회 가능
- 좋아요, 댓글, 팔로우, 작품 업로드 등은 로그인 필수
- 비로그인 시 해당 기능 클릭 시 로그인 페이지로 안내

### 관리자 계정
- 관리자 계정은 작가 목록에 표시되지 않음
- 관리자 계정을 팔로우할 수 없음
- 관리자만 `/admin` 경로 접근 가능

### 파일 업로드
- 프로필 이미지: `public/uploads/profile-{timestamp}-{random}.{ext}`
- 작품 이미지: `public/uploads/artwork-{timestamp}-{random}.{ext}`
- 최대 파일 크기: 5MB
- 허용 형식: jpeg, jpg, png, gif, webp

---

## 📄 라이선스

MIT License

---

## 👨‍💻 개발자

InkConnect 프로젝트

