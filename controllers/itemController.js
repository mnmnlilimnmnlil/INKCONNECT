const Item = require('../models/Item');
const Comment = require('../models/Comment');

async function listItems(req, res, next) {
  try {
    // 쿼리 파라미터에서 카테고리, 검색어, 페이지 가져오기
    const { category, search, page } = req.query;
    const currentPage = parseInt(page) || 1;
    const itemsPerPage = 12; // 한 페이지에 표시할 작품 수
    const skip = (currentPage - 1) * itemsPerPage;
    
    // 기본 쿼리
    let query = {};
    
    // 카테고리 필터 (category는 배열이므로 배열에 포함되어 있는지 확인)
    if (category && category !== '전체') {
      // MongoDB는 배열 필드에 직접 값을 할당하면 해당 값이 배열에 포함되어 있는지 자동으로 확인
      // 예: category: ['블랙워크', '재패니즈'] 인 경우 category: '블랙워크'로 쿼리하면 매칭됨
      query.category = category;
    }
    
    // 작품 조회 (카테고리 필터만 먼저 적용)
    let items = await Item.find(query)
      .populate('author', 'artistName profileImage')
      .sort({ createdAt: -1 });
    
    // 디버깅 로그
    console.log('Feed - Category filter:', category || '전체');
    console.log('Feed - Query:', JSON.stringify(query));
    console.log('Feed - Items found before search filter:', items.length);
    
    // 검색 필터 (제목, 설명, 작가명, 카테고리 검색)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      items = items.filter(item => {
        const matchesTitle = item.title && searchRegex.test(item.title);
        const matchesDescription = item.description && searchRegex.test(item.description);
        const matchesAuthor = item.author && item.author.artistName && searchRegex.test(item.author.artistName);
        const matchesCategory = item.category && item.category.some(cat => searchRegex.test(cat));
        return matchesTitle || matchesDescription || matchesAuthor || matchesCategory;
      });
    }
    
    // 전체 작품 수
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // 페이지네이션 적용
    const paginatedItems = items.slice(skip, skip + itemsPerPage);
    
    // 각 작품에 대해 현재 사용자가 좋아요를 눌렀는지 확인하고 댓글 개수 추가
    const itemsWithLikes = await Promise.all(
      paginatedItems.map(async (item) => {
        const itemObj = item.toObject();
        // 명시적으로 isLiked 설정 (비로그인 시 항상 false)
        if (req.session.userId) {
          itemObj.isLiked = item.likes && item.likes.length > 0 
            ? item.likes.some(likeId => likeId.toString() === req.session.userId)
            : false;
        } else {
          itemObj.isLiked = false;
        }
        // likes 배열도 명시적으로 설정
        itemObj.likes = item.likes || [];
        // 댓글 개수 추가
        const commentsCount = await Comment.countDocuments({ item: item._id });
        itemObj.commentsCount = commentsCount;
        return itemObj;
      })
    );
    
    // 디버깅을 위한 로그 (나중에 제거 가능)
    console.log('Category filter:', category);
    console.log('Total items found:', totalItems);
    console.log('Items on this page:', itemsWithLikes.length);
    
    res.render('feed', { 
      title: 'Feed', 
      items: itemsWithLikes,
      userId: req.session.userId || null,
      currentCategory: category || '전체',
      searchQuery: search || '',
      currentPage: currentPage,
      totalPages: totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    });
  } catch (err) {
    next(err);
  }
}

async function createItem(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.redirect('/auth/signin');
    }
    
    const { title, description, category } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : '';
    
    // 카테고리를 배열로 변환 (체크박스에서 여러 개 선택 가능)
    const categoryArray = category ? (Array.isArray(category) ? category : [category]) : [];
    
    await Item.create({
      title,
      description: description || '',
      image,
      author: req.session.userId,
      category: categoryArray
    });
    res.redirect('/feed');
  } catch (err) {
    next(err);
  }
}

async function getItem(req, res, next) {
  try {
    const item = await Item.findById(req.params.id)
      .populate('author', 'artistName profileImage bio');
    if (!item) return res.status(404).send('Item not found');
    
    // 현재 사용자가 좋아요를 눌렀는지 확인
    const itemObj = item.toObject();
    if (req.session.userId) {
      itemObj.isLiked = item.likes && item.likes.length > 0 
        ? item.likes.some(likeId => likeId.toString() === req.session.userId)
        : false;
    } else {
      itemObj.isLiked = false;
    }
    itemObj.likes = item.likes || [];
    
    // 댓글 목록 조회
    const comments = await Comment.find({ item: req.params.id })
      .populate('author', 'artistName profileImage')
      .sort({ createdAt: -1 }); // 최신순
    
    res.render('detail', { 
      title: item.title, 
      item: itemObj,
      comments: comments || [],
      userId: req.session.userId || null
    });
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.redirect('/auth/signin');
    }
    
    const { title, description, category } = req.body;
    const updateData = { title, description: description || '' };
    
    // 카테고리 업데이트
    if (category !== undefined) {
      const categoryArray = category ? (Array.isArray(category) ? category : [category]) : [];
      updateData.category = categoryArray;
    }
    
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }
    
    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, author: req.session.userId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).send('Item not found');
    res.redirect(`/items/${item._id}`);
  } catch (err) {
    next(err);
  }
}

async function deleteItem(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.redirect('/auth/signin');
    }
    
    const item = await Item.findOne({ _id: req.params.id, author: req.session.userId });
    if (!item) {
      return res.status(404).send('Item not found or you do not have permission');
    }
    
    // 작품 삭제 시 관련 댓글도 함께 삭제
    await Comment.deleteMany({ item: req.params.id });
    
    // 작품 삭제
    await Item.findByIdAndDelete(req.params.id);
    res.redirect('/feed');
  } catch (err) {
    next(err);
  }
}

// 좋아요 토글
async function toggleLike(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }
    
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    
    const userId = req.session.userId;
    // ObjectId를 문자열로 변환하여 비교
    const likeIndex = item.likes.findIndex(likeId => likeId.toString() === userId);
    
    if (likeIndex > -1) {
      item.likes.splice(likeIndex, 1);
    } else {
      item.likes.push(userId);
    }
    
    await item.save();
    res.json({ liked: likeIndex === -1, likesCount: item.likes.length });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listItems,
  createItem,
  getItem,
  updateItem,
  deleteItem,
  toggleLike
};


