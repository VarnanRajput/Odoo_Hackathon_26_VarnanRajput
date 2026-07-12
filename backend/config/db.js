const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/assetflow';
  
  try {
    // Attempt Mongoose connection with a short 3-second timeout
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });
    
    global.useInMemoryDb = false;
    console.log('==================================================');
    console.log(' SUCCESS: Connected to MongoDB database successfully!');
    console.log('==================================================');
  } catch (err) {
    global.useInMemoryDb = true;
    console.log('==================================================');
    console.log(' WARNING: MongoDB connection failed or was not found.');
    console.log(' FALLBACK: Activating persistent JSON/In-Memory database!');
    console.log(' Path: backend/data/db.json');
    console.log('==================================================');
  }
};

module.exports = connectDB;
