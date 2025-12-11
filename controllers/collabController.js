const Collab = require('../models/Collab');
const User = require('../models/User');

function deriveStatus(collab) {
  // 규칙 단순화: 남은 기간 기준으로 모집중/마감만 사용
  // - 종료일 기준 0일 이하: 마감(closed)
  // - 그 외: 모집중(open)
  if (!collab.endDate) return 'open';
  const now = new Date();
  const end = new Date(collab.endDate);
  const diffMs = end.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return 'closed';
  return 'open';
}

// 목록
async function listCollabs(req, res, next) {
  try {
    const { status, style, search } = req.query;
    const query = {};

    if (status && ['open', 'in_progress', 'closed'].includes(status)) {
      query.status = status;
    }
    if (style) {
      query.styles = style;
    }
    if (search && search.trim() !== '') {
      query.$text = { $search: search.trim() };
    }

    const collabs = await Collab.find(query)
      .sort({ createdAt: -1 })
      .populate('author', 'artistName profileImage verified')
      .populate('participants', 'artistName profileImage');

    const userId = req.session.userId;

    let collabsView = collabs.map((c) => {
      const obj = c.toObject();
      obj.derivedStatus = deriveStatus(c);
      obj.isLiked = userId ? c.likes.some(id => id.toString() === userId) : false;
      obj.isParticipating = userId ? c.participants.some(id => id.toString() === userId) : false;
      obj.likesCount = c.likes ? c.likes.length : 0;
      obj.participantsCount = c.participants ? c.participants.length : 0;
      return obj;
    });

    // 상태 필터는 도출된 상태 기준으로 적용
    if (status && ['open', 'closed'].includes(status)) {
      collabsView = collabsView.filter(c => c.derivedStatus === status);
    }

    res.render('collabs', {
      title: 'Collab',
      collabs: collabsView,
      currentStatus: status || 'all',
      currentStyle: style || 'all',
      searchQuery: search || '',
      userId: userId || null
    });
  } catch (err) {
    next(err);
  }
}

// 작성 폼
function getNewCollab(req, res) {
  if (!req.session.userId) {
    return res.redirect('/auth/signin');
  }
  if (req.session.userRole !== 'artist') {
    return res.status(403).send('작가만 작성할 수 있습니다.');
  }
  res.render('collab_new', { title: '새 콜라보' });
}

// 작성 처리
async function createCollab(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.redirect('/auth/signin');
    }
    if (req.session.userRole !== 'artist') {
      return res.status(403).send('작가만 작성할 수 있습니다.');
    }

    const { title, description, styles, location, startDate, endDate } = req.body;
    const stylesArr = styles
      ? (Array.isArray(styles) ? styles : styles.split(',').map(s => s.trim()).filter(Boolean))
      : [];

    await Collab.create({
      author: req.session.userId,
      title,
      description: description || '',
      styles: stylesArr,
      location: location || '',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status: 'open'
    });

    res.redirect('/collabs');
  } catch (err) {
    next(err);
  }
}

// 상세
async function getCollab(req, res, next) {
  try {
    const collab = await Collab.findById(req.params.id)
      .populate('author', 'artistName profileImage bio verified')
      .populate('participants', 'artistName profileImage');
    if (!collab) return res.status(404).send('Collab not found');

    const userId = req.session.userId;
    const collabObj = collab.toObject();
    collabObj.derivedStatus = deriveStatus(collab);
    collabObj.isLiked = userId ? collab.likes.some(id => id.toString() === userId) : false;
    collabObj.isParticipating = userId ? collab.participants.some(id => id.toString() === userId) : false;
    collabObj.likesCount = collab.likes ? collab.likes.length : 0;
    collabObj.participantsCount = collab.participants ? collab.participants.length : 0;

    res.render('collab_detail', {
      title: collab.title,
      collab: collabObj,
      userId: userId || null
    });
  } catch (err) {
    next(err);
  }
}

// 참여 토글
async function toggleParticipate(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }
    if (req.session.userRole !== 'artist') {
      return res.status(403).json({ error: '작가만 참여할 수 있습니다.' });
    }

    const collab = await Collab.findById(req.params.id);
    if (!collab) return res.status(404).json({ error: 'Collab not found' });

    const userId = req.session.userId;
    const idx = collab.participants.findIndex(id => id.toString() === userId);
    if (idx > -1) {
      collab.participants.splice(idx, 1);
    } else {
      collab.participants.push(userId);
    }

    await collab.save();
    return res.json({
      participating: idx === -1,
      participantsCount: collab.participants.length
    });
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

    const collab = await Collab.findById(req.params.id);
    if (!collab) return res.status(404).json({ error: 'Collab not found' });

    const userId = req.session.userId;
    const idx = collab.likes.findIndex(id => id.toString() === userId);
    if (idx > -1) {
      collab.likes.splice(idx, 1);
    } else {
      collab.likes.push(userId);
    }
    await collab.save();

    return res.json({
      liked: idx === -1,
      likesCount: collab.likes.length
    });
  } catch (err) {
    next(err);
  }
}

// 삭제 (작성자 또는 관리자)
async function deleteCollab(req, res, next) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }
    const collab = await Collab.findById(req.params.id);
    if (!collab) return res.status(404).json({ error: 'Collab not found' });

    const isAuthor = collab.author.toString() === req.session.userId;
    const isAdmin = req.session.userRole === 'admin';
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: '삭제 권한이 없습니다.' });
    }

    await Collab.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCollabs,
  getNewCollab,
  createCollab,
  getCollab,
  toggleParticipate,
  toggleLike,
  deleteCollab
};

