// 사용자 컨트롤러 - 작가 프로필, 팔로우 등

const User = require('../models/User');
const Item = require('../models/Item');
const Comment = require('../models/Comment');

// 작가 프로필 페이지 (Artist)
async function getArtist(req, res, next) {
  try {
    const artist = await User.findOne({ _id: req.params.id, role: 'artist' })
      .select('artistName profileImage bio specialties followers following');
    
    if (!artist) return res.status(404).send('Artist not found');
    
    const items = await Item.find({ author: req.params.id })
      .sort({ createdAt: -1 })
      .populate('author', 'artistName profileImage');
    
    // 각 작품에 대해 현재 사용자가 좋아요했는지 확인하고 댓글 개수 추가
    const userId = req.session.userId;
    const itemsWithLikes = await Promise.all(
      items.map(async (item) => {
        const itemObj = item.toObject();
        if (userId && item.likes) {
          itemObj.isLiked = item.likes.some(likeId => likeId.toString() === userId.toString());
        } else {
          itemObj.isLiked = false;
        }
        // 댓글 개수 추가
        const commentsCount = await Comment.countDocuments({ item: item._id });
        itemObj.commentsCount = commentsCount;
        return itemObj;
      })
    );
    
    const isFollowing = userId 
      ? artist.followers.some(followerId => followerId.toString() === userId.toString())
      : false;
    
    res.render('artist', {
      title: artist.artistName,
      artist,
      items: itemsWithLikes,
      isFollowing
    });
  } catch (err) {
    next(err);
  }
}

// 팔로우 토글
async function toggleFollow(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }
    
    const targetUserId = req.params.id;
    const currentUserId = req.session.userId;
    
    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: '자기 자신을 팔로우할 수 없습니다.' });
    }
    
    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);
    
    if (!targetUser || targetUser.role !== 'artist') {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isFollowing = currentUser.following.includes(targetUserId);
    
    if (isFollowing) {
      // 언팔로우
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
    } else {
      // 팔로우
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }
    
    await currentUser.save();
    await targetUser.save();
    
    res.json({ 
      following: !isFollowing,
      followersCount: targetUser.followers.length 
    });
  } catch (err) {
    next(err);
  }
}

// My Ink 페이지 (내 프로필)
async function getMyInk(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.redirect('/auth/signin');
    }
    
    const user = await User.findById(req.session.userId)
      .populate('followers', 'artistName profileImage')
      .populate('following', 'artistName profileImage');
    
    if (!user) return res.status(404).send('User not found');
    
    const items = await Item.find({ author: req.session.userId })
      .sort({ createdAt: -1 });
    
    // 각 작품에 댓글 개수 추가
    const itemsWithComments = await Promise.all(
      items.map(async (item) => {
        const itemObj = item.toObject();
        const commentsCount = await Comment.countDocuments({ item: item._id });
        itemObj.commentsCount = commentsCount;
        return itemObj;
      })
    );
    
    res.render('myink', {
      title: 'My Ink',
      user,
      items: itemsWithComments,
      error: null
    });
  } catch (err) {
    next(err);
  }
}

// 프로필 수정 (공개 정보: Artist Name, Bio, Specialties, Profile Image)
async function updateProfile(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.redirect('/auth/signin');
    }
    
    const { artistName, bio, specialties } = req.body;
    
    // artistName은 필수
    if (!artistName || artistName.trim() === '') {
      const user = await User.findById(req.session.userId);
      const items = await Item.find({ author: req.session.userId }).sort({ createdAt: -1 });
      return res.render('myink', {
        title: 'My Ink',
        user,
        items,
        error: 'Artist Name is required.'
      });
    }
    
    // specialties를 쉼표로 구분된 문자열에서 배열로 변환
    let specialtiesArray = [];
    if (specialties) {
      if (Array.isArray(specialties)) {
        specialtiesArray = specialties;
      } else if (typeof specialties === 'string') {
        specialtiesArray = specialties.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
    }
    
    const updateData = {
      artistName: artistName.trim(),
      bio: bio || '',
      specialties: specialtiesArray
    };
    
    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }
    
    await User.findByIdAndUpdate(req.session.userId, updateData);
    
    // 세션의 userName도 업데이트 (artistName이 변경된 경우)
    if (artistName) {
      req.session.userName = artistName.trim();
    }
    
    res.redirect('/myink');
  } catch (err) {
    next(err);
  }
}

// 개인정보 수정 (비공개 정보: Email, Password)
async function updateAccount(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.redirect('/auth/signin');
    }
    
    const { email, password } = req.body;
    const user = await User.findById(req.session.userId);
    
    if (!user) {
      return res.status(404).send('User not found');
    }
    
    const updateData = {};
    
    // 이메일 변경
    if (email && email.trim() !== '' && email !== user.email) {
      // 이메일 중복 체크
      const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
      if (existingUser && existingUser._id.toString() !== req.session.userId) {
        const items = await Item.find({ author: req.session.userId }).sort({ createdAt: -1 });
        return res.render('myink', {
          title: 'My Ink',
          user,
          items,
          error: '이미 사용 중인 이메일입니다.'
        });
      }
      updateData.email = email.trim().toLowerCase();
    }
    
    // 비밀번호 변경
    if (password && password.trim() !== '') {
      updateData.password = password.trim();
    }
    
    // 업데이트할 데이터가 있는 경우에만 업데이트
    if (Object.keys(updateData).length > 0) {
      await User.findByIdAndUpdate(req.session.userId, updateData);
    }
    
    res.redirect('/myink');
  } catch (err) {
    next(err);
  }
}

// Inspire 페이지 (좋아요한 작품)
async function getInspire(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.redirect('/auth/signin');
    }
    
    // 쿼리 파라미터에서 카테고리 가져오기
    const { category } = req.query;
    
    // 기본 쿼리 (좋아요한 작품)
    let query = { likes: req.session.userId };
    
    // 카테고리 필터 (category는 배열이므로 배열에 포함되어 있는지 확인)
    if (category && category !== '전체') {
      // MongoDB는 배열 필드에 직접 값을 할당하면 해당 값이 배열에 포함되어 있는지 자동으로 확인
      query.category = category;
    }
    
    const items = await Item.find(query)
      .populate('author', 'artistName profileImage')
      .sort({ createdAt: -1 });
    
    // 디버깅 로그
    console.log('Inspire - Category filter:', category || '전체');
    console.log('Inspire - Query:', JSON.stringify(query));
    console.log('Inspire - Items found:', items.length);
    
    // 각 작품에 대해 isLiked 정보 추가하고 댓글 개수 추가
    const userId = req.session.userId;
    const itemsWithLikes = await Promise.all(
      items.map(async (item) => {
        const itemObj = item.toObject();
        itemObj.isLiked = true; // 좋아요한 작품만 표시되므로 모두 true
        // 댓글 개수 추가
        const commentsCount = await Comment.countDocuments({ item: item._id });
        itemObj.commentsCount = commentsCount;
        return itemObj;
      })
    );
    
    res.render('inspire', {
      title: 'Inspire',
      items: itemsWithLikes,
      currentCategory: category || '전체'
    });
  } catch (err) {
    next(err);
  }
}

// Drop Ink 페이지 (작품 업로드 폼)
function getDropInk(req, res) {
  if (!req.session.userId) {
    return res.redirect('/auth/signin');
  }
  res.render('dropink', { title: 'Drop Ink', error: null });
}

// 작가 목록 페이지 (Artists)
async function getArtists(req, res, next) {
  try {
    const currentUserId = req.session.userId;
    
    // 자기 자신을 제외한 작가 목록
    const query = currentUserId
      ? { _id: { $ne: currentUserId }, role: 'artist' }
      : { role: 'artist' };
    const artists = await User.find(query)
      .sort({ followers: -1 })
      .select('artistName profileImage bio specialties followers');
    
    // 현재 사용자의 팔로우 정보 가져오기
    let currentUserFollowing = [];
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId).select('following');
      currentUserFollowing = currentUser ? currentUser.following.map(id => id.toString()) : [];
    }
    
    // 각 작가의 작품 수 계산 및 팔로우 상태 추가
    const artistsWithWorks = await Promise.all(
      artists.map(async (artist) => {
        const artistObj = artist.toObject();
        const worksCount = await Item.countDocuments({ author: artist._id });
        artistObj.worksCount = worksCount;
        // 팔로우 상태 추가
        artistObj.isFollowing = currentUserFollowing.includes(artist._id.toString());
        return artistObj;
      })
    );
    
    res.render('artists', {
      title: 'Artists',
      artists: artistsWithWorks,
      userId: currentUserId || null
    });
  } catch (err) {
    next(err);
  }
}

// 메인 페이지 (인기 작품, 인기 작가)
async function getHome(req, res, next) {
  try {
    const userId = req.session.userId;
    
    // 인기 작품: 좋아요 수가 많은 순으로 정렬 (likes 배열의 길이 기준)
    // 모든 작품을 가져와서 좋아요 수로 정렬 후 상위 4개 선택
    const allItems = await Item.find()
      .populate('author', 'artistName profileImage')
      .lean();
    
    // 좋아요 수 기준으로 정렬 (내림차순)
    const sortedItems = allItems.sort((a, b) => {
      const aLikes = a.likes ? a.likes.length : 0;
      const bLikes = b.likes ? b.likes.length : 0;
      return bLikes - aLikes;
    });
    
    // 상위 4개만 선택
    const popularItems = sortedItems.slice(0, 4);
    
    // 각 작품에 대해 현재 사용자가 좋아요했는지 확인하고 댓글 개수 추가
    const itemsWithLiked = await Promise.all(
      popularItems.map(async (item) => {
        const itemObj = item;
        if (userId && item.likes) {
          itemObj.isLiked = item.likes.some(likeId => likeId.toString() === userId.toString());
        } else {
          itemObj.isLiked = false;
        }
        // 댓글 개수 추가
        const commentsCount = await Comment.countDocuments({ item: item._id });
        itemObj.commentsCount = commentsCount;
        return itemObj;
      })
    );
    
    // 자기 자신을 제외한 인기 작가: 팔로우 수가 많은 순으로 정렬 (followers 배열의 길이 기준)
    const query = userId
      ? { _id: { $ne: userId }, role: 'artist' }
      : { role: 'artist' };
    const allArtists = await User.find(query)
      .select('artistName profileImage bio followers')
      .lean();
    
    // 팔로우 수 기준으로 정렬 (내림차순)
    const sortedArtists = allArtists.sort((a, b) => {
      const aFollowers = a.followers ? a.followers.length : 0;
      const bFollowers = b.followers ? b.followers.length : 0;
      return bFollowers - aFollowers;
    });
    
    // 상위 4개만 선택
    const popularArtists = sortedArtists.slice(0, 4);
    
    // 현재 사용자의 팔로우 정보 가져오기
    let currentUserFollowing = [];
    if (userId) {
      const currentUser = await User.findById(userId).select('following');
      currentUserFollowing = currentUser ? currentUser.following.map(id => id.toString()) : [];
    }
    
    // 각 작가의 작품 수 계산 및 팔로우 상태 추가
    const artistsWithWorks = await Promise.all(
      popularArtists.map(async (artist) => {
        const artistObj = artist;
        const worksCount = await Item.countDocuments({ author: artist._id });
        artistObj.worksCount = worksCount;
        // 팔로우 상태 추가
        artistObj.isFollowing = currentUserFollowing.includes(artist._id.toString());
        return artistObj;
      })
    );
    
    res.render('home', {
      title: 'InkConnect',
      popularItems: itemsWithLiked,
      popularArtists: artistsWithWorks,
      userId: userId || null
    });
  } catch (err) {
    next(err);
  }
}

// 회원 탈퇴 (계정 삭제) - 비밀번호 확인 필요
async function deleteAccount(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.redirect('/auth/signin');
    }
    
    const { password } = req.body;
    const userId = req.session.userId;
    
    // 비밀번호 확인
    if (!password || password.trim() === '') {
      const user = await User.findById(userId);
      const items = await Item.find({ author: userId }).sort({ createdAt: -1 });
      return res.render('myink', {
        title: 'My Ink',
        user,
        items,
        error: '비밀번호를 입력해주세요.',
        showDeleteForm: true
      });
    }
    
    // 사용자 조회 및 비밀번호 확인
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }
    
    // 비밀번호 확인
    const isMatch = await user.comparePassword(password.trim());
    if (!isMatch) {
      const items = await Item.find({ author: userId }).sort({ createdAt: -1 });
      return res.render('myink', {
        title: 'My Ink',
        user,
        items,
        error: '비밀번호가 일치하지 않습니다.',
        showDeleteForm: true
      });
    }
    
    // 비밀번호 확인 완료 후 탈퇴 처리
    
    // 1. 사용자가 작성한 작품의 댓글 삭제
    const userItems = await Item.find({ author: userId });
    const itemIds = userItems.map(item => item._id);
    await Comment.deleteMany({ item: { $in: itemIds } });
    
    // 2. 사용자가 작성한 댓글 삭제
    await Comment.deleteMany({ author: userId });
    
    // 3. 사용자가 작성한 작품 삭제
    await Item.deleteMany({ author: userId });
    
    // 4. 사용자가 좋아요한 작품에서 좋아요 제거
    await Item.updateMany(
      { likes: userId },
      { $pull: { likes: userId } }
    );
    
    // 3. 팔로우 관계 정리
    // 다른 사람의 following에서 제거
    await User.updateMany(
      { following: userId },
      { $pull: { following: userId } }
    );
    // 다른 사람의 followers에서 제거
    await User.updateMany(
      { followers: userId },
      { $pull: { followers: userId } }
    );
    
    // 4. 사용자 계정 삭제
    await User.findByIdAndDelete(userId);
    
    // 5. 세션 삭제
    req.session.destroy((err) => {
      if (err) {
        return res.redirect('/myink');
      }
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getArtist,
  getArtists,
  toggleFollow,
  getMyInk,
  updateProfile,
  updateAccount,
  getInspire,
  getDropInk,
  getHome,
  deleteAccount
};

