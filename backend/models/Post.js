import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String },
  media: { type: String }, // Base64 string
  mediaType: { type: String }, // 'image' or 'video'
  timestamp: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    timestamp: { type: Date, default: Date.now },
    parentId: { type: mongoose.Schema.Types.ObjectId, default: null }
  }],
  tags: [String]
});

const Post = mongoose.model('Post', postSchema);
export default Post;
