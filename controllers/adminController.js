// 관리자 컨트롤러 - 관리자 대시보드 및 관리 기능

const User = require('../models/User');
const Item = require('../models/Item');
const Comment = require('../models/Comment');

// 관리자 대시보드 (통계)
async function getDashboard(req, res, next) {
  try {
    // 전체 통계
    const totalUsers = await User.countDocuments({ role: 'artist' });
    const totalItems = await Item.countDocuments();
    const totalComments = await Comment.countDocuments();
    const verifiedArtists = await User.countDocuments({ verified: true });
    
    // 최근 가입한 작가 (최근 7일)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await User.find({
      role: 'artist',
      createdAt: { $gte: sevenDaysAgo }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('artistName email createdAt verified');
    
    // 최근 업로드된 작품
    const recentItems = await Item.find()
      .populate('author', 'artistName')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title author createdAt');
    
    // 인증 대기 작가 목록
    const pendingVerification = await User.find({
      role: 'artist',
      verified: false
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('artistName email bio specialties createdAt');
    
    res.render('admin/dashboard', {
      title: '관리자 대시보드',
      stats: {
        totalUsers,
        totalItems,
        totalComments,
        verifiedArtists
      },
      recentUsers,
      recentItems,
      pendingVerification
    });
  } catch (err) {
    next(err);
  }
}

// 작가 목록 관리
async function getArtists(req, res, next) {
  try {
    const { search, verified, page } = req.query;
    const currentPage = parseInt(page) || 1;
    const itemsPerPage = 20;
    const skip = (currentPage - 1) * itemsPerPage;
    
    let query = { role: 'artist' };
    
    // 검색 필터
    if (search && search.trim() !== '') {
      query.$or = [
        { artistName: new RegExp(search.trim(), 'i') },
        { email: new RegExp(search.trim(), 'i') }
      ];
    }
    
    // 인증 필터
    if (verified === 'true') {
      query.verified = true;
    } else if (verified === 'false') {
      query.verified = false;
    }
    
    const totalArtists = await User.countDocuments(query);
    const artists = await User.find(query)
      .select('artistName email bio specialties verified createdAt followers')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(itemsPerPage);
    
    // 각 작가의 작품 수 추가
    const artistsWithStats = await Promise.all(
      artists.map(async (artist) => {
        const artistObj = artist.toObject();
        const worksCount = await Item.countDocuments({ author: artist._id });
        artistObj.worksCount = worksCount;
        artistObj.followersCount = artist.followers ? artist.followers.length : 0;
        return artistObj;
      })
    );
    
    res.render('admin/artists', {
      title: '작가 관리',
      artists: artistsWithStats,
      currentPage,
      totalPages: Math.ceil(totalArtists / itemsPerPage),
      searchQuery: search || '',
      verifiedFilter: verified || 'all'
    });
  } catch (err) {
    next(err);
  }
}

// 작가 인증 토글
async function toggleArtistVerification(req, res, next) {
  try {
    const artist = await User.findById(req.params.id);
    if (!artist || artist.role !== 'artist') {
      return res.status(404).json({ error: '작가를 찾을 수 없습니다.' });
    }
    
    artist.verified = !artist.verified;
    await artist.save();
    
    res.json({
      success: true,
      verified: artist.verified,
      message: artist.verified ? '작가가 인증되었습니다.' : '작가 인증이 해제되었습니다.'
    });
  } catch (err) {
    next(err);
  }
}

// 작품 관리
async function getItems(req, res, next) {
  try {
    const { search, page } = req.query;
    const currentPage = parseInt(page) || 1;
    const itemsPerPage = 20;
    const skip = (currentPage - 1) * itemsPerPage;
    
    let query = {};
    
    if (search && search.trim() !== '') {
      query.$or = [
        { title: new RegExp(search.trim(), 'i') },
        { description: new RegExp(search.trim(), 'i') }
      ];
    }
    
    const totalItems = await Item.countDocuments(query);
    const items = await Item.find(query)
      .populate('author', 'artistName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(itemsPerPage);
    
    // 각 작품의 댓글 수 추가
    const itemsWithStats = await Promise.all(
      items.map(async (item) => {
        const itemObj = item.toObject();
        const commentsCount = await Comment.countDocuments({ item: item._id });
        itemObj.commentsCount = commentsCount;
        itemObj.likesCount = item.likes ? item.likes.length : 0;
        return itemObj;
      })
    );
    
    res.render('admin/items', {
      title: '작품 관리',
      items: itemsWithStats,
      currentPage,
      totalPages: Math.ceil(totalItems / itemsPerPage),
      searchQuery: search || ''
    });
  } catch (err) {
    next(err);
  }
}

// 작품 삭제 (관리자)
async function deleteItem(req, res, next) {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: '작품을 찾을 수 없습니다.' });
    }
    
    // 관련 댓글 삭제
    await Comment.deleteMany({ item: req.params.id });
    
    // 작품 삭제
    await Item.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: '작품이 삭제되었습니다.'
    });
  } catch (err) {
    next(err);
  }
}

// 댓글 관리
async function getComments(req, res, next) {
  try {
    const { search, page } = req.query;
    const currentPage = parseInt(page) || 1;
    const itemsPerPage = 20;
    const skip = (currentPage - 1) * itemsPerPage;
    
    let query = {};
    
    if (search && search.trim() !== '') {
      query.content = new RegExp(search.trim(), 'i');
    }
    
    const totalComments = await Comment.countDocuments(query);
    const comments = await Comment.find(query)
      .populate('author', 'artistName email')
      .populate('item', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(itemsPerPage);
    
    res.render('admin/comments', {
      title: '댓글 관리',
      comments,
      currentPage,
      totalPages: Math.ceil(totalComments / itemsPerPage),
      searchQuery: search || ''
    });
  } catch (err) {
    next(err);
  }
}

// 댓글 삭제 (관리자)
async function deleteComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    }
    
    await Comment.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: '댓글이 삭제되었습니다.'
    });
  } catch (err) {
    next(err);
  }
}

// 작가 계정 삭제 (관리자)
async function deleteArtist(req, res, next) {
  try {
    const artist = await User.findById(req.params.id);
    if (!artist || artist.role !== 'artist') {
      return res.status(404).json({ error: '작가를 찾을 수 없습니다.' });
    }
    
    // 회원 탈퇴와 동일한 로직
    const userId = artist._id;
    const userItems = await Item.find({ author: userId });
    const itemIds = userItems.map(item => item._id);
    
    await Comment.deleteMany({ item: { $in: itemIds } });
    await Comment.deleteMany({ author: userId });
    await Item.deleteMany({ author: userId });
    await Item.updateMany({ likes: userId }, { $pull: { likes: userId } });
    await User.updateMany({ following: userId }, { $pull: { following: userId } });
    await User.updateMany({ followers: userId }, { $pull: { followers: userId } });
    await User.findByIdAndDelete(userId);
    
    res.json({
      success: true,
      message: '작가 계정이 삭제되었습니다.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  getArtists,
  toggleArtistVerification,
  getItems,
  deleteItem,
  getComments,
  deleteComment,
  deleteArtist
};

