import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Post from './models/Post.js';
import Message from './models/Message.js';
import Notification from './models/Notification.js';

dotenv.config();

async function cleanDatabase() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    console.log('Deleting all Users...');
    await User.deleteMany({});
    
    console.log('Deleting all Posts...');
    await Post.deleteMany({});
    
    console.log('Deleting all Messages...');
    await Message.deleteMany({});
    
    console.log('Deleting all Notifications...');
    await Notification.deleteMany({});

    console.log('Database successfully wiped clean for a fresh start.');
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning database:', error);
    process.exit(1);
  }
}

cleanDatabase();
