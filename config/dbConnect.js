const mongoose = require('mongoose');

async function connectDB() {
  const { DB_URI } = process.env;
  if (!DB_URI) {
    throw new Error(' Environment variable DB_URI is not set. Please create .env file.');
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(DB_URI);
    console.log(' MongoDB connected');
  } catch (err) {
    console.error(' MongoDB connection failed:');
    console.error('Error:', err.message);
    
    if (err.message.includes('authentication failed') || err.message.includes('bad auth')) {
      console.error('\n 인증 오류 해결 방법:');
      console.error('1. 로컬 MongoDB 사용 시: mongodb://localhost:27017/inkconnect');
      console.error('2. Atlas 사용 시: mongodb+srv://username:password@cluster.mongodb.net/dbname');
      console.error('   - username과 password를 올바르게 입력했는지 확인하세요');
      console.error('   - Atlas에서 Network Access에 현재 IP를 추가했는지 확인하세요');
      console.error('   - Database User가 올바르게 생성되어 있는지 확인하세요');
    }
    
    throw err;
  }
}

module.exports = connectDB;


