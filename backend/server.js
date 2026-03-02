import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import User from './models/User.js';
import Post from './models/Post.js';
import Message from './models/Message.js';
import Notification from './models/Notification.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Middleware to authenticate JWT
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    req.userId = decoded.id;
    next();
  });
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if username exists
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) return res.status(400).json({ message: 'Username already exists' });

    // Check if email exists (only if email is provided and not empty)
    if (email && email.trim() !== '') {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username: username.toLowerCase(),
      email: (email && email.trim() !== '') ? email.toLowerCase() : null,
      password: hashedPassword,
      avatarColor: '#' + Math.floor(Math.random()*16777215).toString(16)
    });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
    res.json({ 
      token, 
      user: { 
        id: newUser._id.toString(), 
        username: newUser.username, 
        email: newUser.email,
        avatarColor: newUser.avatarColor,
        profilePhoto: newUser.profilePhoto,
        bio: newUser.bio,
        followers: [],
        following: [],
        bookmarks: []
      } 
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ 
      token, 
      user: { 
        id: user._id.toString(), 
        username: user.username, 
        email: user.email,
        avatarColor: user.avatarColor, 
        profilePhoto: user.profilePhoto, 
        bio: user.bio,
        followers: user.followers,
        following: user.following,
        bookmarks: user.bookmarks
      } 
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

import nodemailer from 'nodemailer';

// Configure Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Forgot Password - With Real Email Sending
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'Username is required' });

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user || !user.email) return res.status(404).json({ message: 'No user found with a valid email address.' });

    // Generate temp password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    user.password = hashedPassword;
    await user.save();

    const [name, domain] = user.email.split('@');
    const maskedEmail = `${name.substring(0, 3)}**********@${domain}`;

    // Actual Email Sending
    const mailOptions = {
      from: `"SocialPedia Security" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Your Temporary Password - SocialPedia',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #1877f2;">SocialPedia</h2>
          <p>Hello <strong>${user.username}</strong>,</p>
          <p>We received a request to recover your password. Here is your new temporary password:</p>
          <div style="background: #f0f2f5; padding: 15px; text-align: center; font-size: 1.5rem; font-weight: bold; letter-spacing: 2px; color: #1c1e21; border-radius: 8px;">
            ${tempPassword}
          </div>
          <p>Please log in immediately and change this password in your <strong>Settings</strong>.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.8rem; color: #888;">If you did not request this, please ignore this email or contact support.</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`[SUCCESS] Real email sent to ${user.email}`);
    } catch (mailError) {
      console.error("[MAIL ERROR] Failed to send real email:", mailError);
      console.log(`[FALLBACK] Temp Password for ${user.username}: ${tempPassword}`);
    }

    res.json({ message: `Success! Your temporary password has been sent to your registered email: ${maskedEmail}` });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

app.patch('/api/auth/change-password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect old password' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
});

// User Activity Log
app.get('/api/users/activity', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userActions = [];

    // 1. Fetch User's Posts
    const myPosts = await Post.find({ author: req.userId }).sort({ timestamp: -1 }).limit(50);
    myPosts.forEach(p => {
      userActions.push({ 
        id: `post-${p._id}`, 
        type: 'post', 
        text: `You shared a new post: "${p.content?.substring(0, 30)}${p.content?.length > 30 ? '...' : ''}"`, 
        timestamp: p.timestamp 
      });
    });

    // 2. Fetch User's Comments and Likes (Simplified by searching all posts)
    // In a large app, you'd store these references on the User model
    const allRecentPosts = await Post.find({
      $or: [
        { likes: req.userId },
        { "comments.user": req.userId }
      ]
    }).populate('author', 'username').limit(100);

    allRecentPosts.forEach(p => {
      if (p.likes.includes(req.userId)) {
        userActions.push({ 
          id: `like-${p._id}`, 
          type: 'like', 
          text: `You liked ${p.author.username}'s post`, 
          timestamp: p.timestamp // Note: Using post timestamp as simplified logic
        });
      }
      p.comments.forEach(c => {
        if (c.user.toString() === req.userId.toString()) {
          userActions.push({ 
            id: `comment-${c._id}`, 
            type: 'comment', 
            text: `You commented on ${p.author.username}'s post: "${c.text.substring(0, 20)}..."`, 
            timestamp: c.timestamp 
          });
        }
      });
    });

    const sorted = userActions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);
    res.json(sorted);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity log', error: error.message });
  }
});

// Post routes
app.get('/api/posts', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const filter = {
      $or: [
        { author: req.userId },
        { author: { $in: user.following || [] } }
      ]
    };

    const posts = await Post.find(filter)
      .populate('author', 'username avatarColor profilePhoto')
      .populate('comments.user', 'username avatarColor profilePhoto')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(filter);

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
});

app.post('/api/posts', authenticate, async (req, res) => {
  try {
    const { content, media, mediaType, tags } = req.body;
    const newPost = new Post({
      author: req.userId,
      content,
      media,
      mediaType,
      tags
    });
    await newPost.save();

    // Mention notifications
    if (content) {
      const mentions = content.match(/@(\w+)/g);
      if (mentions) {
        const usernames = mentions.map(m => m.substring(1).toLowerCase());
        const mentionedUsers = await User.find({ username: { $in: usernames } });
        
        for (const targetUser of mentionedUsers) {
          if (targetUser._id.toString() !== req.userId.toString()) {
            await new Notification({
              recipient: targetUser._id,
              sender: req.userId,
              type: 'tag',
              post: newPost._id,
              content: content.substring(0, 50)
            }).save();
          }
        }
      }
    }

    const populatedPost = await Post.findById(newPost._id).populate('author', 'username avatarColor profilePhoto');
    res.json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Error creating post', error: error.message });
  }
});

app.post('/api/posts/:id/like', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isLiked = post.likes.includes(req.userId);
    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== req.userId.toString());
    } else {
      post.likes.push(req.userId);
      // Notify author
      if (post.author.toString() !== req.userId.toString()) {
        await new Notification({
          recipient: post.author,
          sender: req.userId,
          type: 'like',
          post: post._id,
          content: post.content?.substring(0, 50)
        }).save();
      }
    }
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error liking post', error: error.message });
  }
});

app.post('/api/posts/:id/comment', authenticate, async (req, res) => {
  try {
    const { text, parentId } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const newComment = {
      user: req.userId,
      text,
      timestamp: new Date(),
      parentId: parentId || null
    };
    post.comments.push(newComment);
    await post.save();

    // Notify post author
    if (post.author.toString() !== req.userId.toString()) {
      await new Notification({
        recipient: post.author,
        sender: req.userId,
        type: 'comment',
        post: post._id,
        content: text.substring(0, 50)
      }).save();
    }

    // Notify parent comment author if it's a reply
    if (parentId) {
      const parentComment = post.comments.id(parentId);
      if (parentComment && parentComment.user.toString() !== req.userId.toString()) {
        await new Notification({
          recipient: parentComment.user,
          sender: req.userId,
          type: 'comment',
          post: post._id,
          content: `Replied: ${text.substring(0, 40)}`
        }).save();
      }
    }

    // Mention notifications in comment
    const mentions = text.match(/@(\w+)/g);
    if (mentions) {
      const usernames = mentions.map(m => m.substring(1).toLowerCase());
      const mentionedUsers = await User.find({ username: { $in: usernames } });
      for (const targetUser of mentionedUsers) {
        if (targetUser._id.toString() !== req.userId.toString()) {
          await new Notification({
            recipient: targetUser._id,
            sender: req.userId,
            type: 'tag',
            post: post._id,
            content: text.substring(0, 50)
          }).save();
        }
      }
    }

    const updatedPost = await Post.findById(post._id).populate('author', 'username avatarColor profilePhoto').populate('comments.user', 'username avatarColor profilePhoto');
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Error commenting', error: error.message });
  }
});

// Get trending tags
app.get('/api/posts/trending/tags', authenticate, async (req, res) => {
  try {
    const posts = await Post.find({ timestamp: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
    const tagCounts = {};
    posts.forEach(post => {
      if (post.content) {
        const tags = post.content.match(/#\w+/g);
        if (tags) {
          tags.forEach(tag => {
            const t = tag.toLowerCase();
            tagCounts[t] = (tagCounts[t] || 0) + 1;
          });
        }
      }
    });
    const trending = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
    res.json(trending);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trending tags', error: error.message });
  }
});

// Get all video posts for Reels
app.get('/api/posts/type/video', authenticate, async (req, res) => {
  try {
    const posts = await Post.find({ mediaType: 'video' })
      .populate('author', 'username avatarColor profilePhoto')
      .populate('comments.user', 'username avatarColor profilePhoto')
      .sort({ timestamp: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reels', error: error.message });
  }
});

app.get('/api/posts/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatarColor profilePhoto')
      .populate('comments.user', 'username avatarColor profilePhoto');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching post', error: error.message });
  }
});

app.delete('/api/posts/:id', authenticate, async (req, res) => {
  try {
    const cleanId = req.params.id.trim();
    console.log(`[DELETE] Request for ID: "${cleanId}"`);
    
    if (!mongoose.Types.ObjectId.isValid(cleanId)) {
      console.log(`[DELETE] Invalid ObjectId format: "${cleanId}"`);
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const post = await Post.findById(cleanId);
    
    if (!post) {
      console.log(`[DELETE] Post NOT found in DB. Searched for: ${cleanId}`);
      // Let's check if any posts exist at all
      const count = await Post.countDocuments();
      console.log(`[DELETE] Total posts in DB right now: ${count}`);
      return res.status(404).json({ message: 'Post not found in database' });
    }
    
    const authorId = post.author.toString();
    const requesterId = req.userId.toString();
    
    console.log(`[DELETE] Author: ${authorId} | Requester: ${requesterId}`);

    if (authorId !== requesterId) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    await Post.findByIdAndDelete(cleanId);
    console.log(`[DELETE] SUCCESS: Post ${cleanId} removed.`);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(`[DELETE] CRITICAL ERROR: ${error.message}`);
    res.status(500).json({ message: 'Server error during deletion' });
  }
});

// User routes
app.patch('/api/users/profile', authenticate, async (req, res) => {
  try {
    const { profilePhoto, bio } = req.body;
    const updates = {};
    if (profilePhoto !== undefined) updates.profilePhoto = profilePhoto;
    if (bio !== undefined) updates.bio = bio;

    const user = await User.findByIdAndUpdate(req.userId, updates, { returnDocument: 'after' });
    res.json({ id: user._id, username: user.username, avatarColor: user.avatarColor, profilePhoto: user.profilePhoto, bio: user.bio });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

app.delete('/api/users/profile', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    // 1. Delete all posts by this user
    await Post.deleteMany({ author: userId });

    // 2. Remove user from all follow lists (both followers and following of others)
    await User.updateMany({}, { 
      $pull: { followers: userId, following: userId } 
    });

    // 3. Remove user's likes and comments from all posts
    await Post.updateMany({}, { 
      $pull: { likes: userId, comments: { user: userId } } 
    });

    // 4. Delete all messages sent by or received by this user
    await Message.deleteMany({ 
      $or: [{ sender: userId }, { recipient: userId }] 
    });

    // 5. Finally, delete the user account
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account', error: error.message });
  }
});
// User routes
app.get('/api/users', authenticate, async (req, res) => {
  try {
    const { search } = req.query;
    const query = search 
      ? { username: { $regex: search, $options: 'i' } } 
      : {};
    const users = await User.find(query).limit(20).select('username avatarColor profilePhoto bio');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

app.get('/api/users/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user._id, username: user.username, avatarColor: user.avatarColor, profilePhoto: user.profilePhoto, bio: user.bio, followers: user.followers, following: user.following });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

app.get('/api/users/suggestions', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const followingIds = user.following.map(id => new mongoose.Types.ObjectId(id));
    const currentUserId = new mongoose.Types.ObjectId(req.userId);
    const followerIds = user.followers.map(id => new mongoose.Types.ObjectId(id));

    const suggestions = await User.aggregate([
      { $match: { _id: { $nin: [...followingIds, currentUserId] } } },
      { $sample: { size: 10 } },
      { 
        $addFields: { 
          followsMe: { $in: ["$_id", followerIds] } 
        } 
      },
      { $project: { username: 1, avatarColor: 1, profilePhoto: 1, followsMe: 1 } }
    ]);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching suggestions', error: error.message });
  }
});

app.post('/api/users/follow/:id', authenticate, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.userId) return res.status(400).json({ message: 'Cannot follow yourself' });

    await User.findByIdAndUpdate(req.userId, { $addToSet: { following: targetId } });
    await User.findByIdAndUpdate(targetId, { $addToSet: { followers: req.userId } });

    // Send notification
    await new Notification({
      recipient: targetId,
      sender: req.userId,
      type: 'follow'
    }).save();

    res.json({ message: 'Followed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error following user', error: error.message });
  }
});

app.post('/api/users/unfollow/:id', authenticate, async (req, res) => {
  try {
    const targetId = req.params.id;
    await User.findByIdAndUpdate(req.userId, { $pull: { following: targetId } });
    await User.findByIdAndUpdate(targetId, { $pull: { followers: req.userId } });
    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error unfollowing user', error: error.message });
  }
});

// Remove a follower (force someone to unfollow you)
app.delete('/api/users/follower/:id', authenticate, async (req, res) => {
  try {
    const followerId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(followerId)) {
      return res.status(400).json({ message: 'Invalid follower ID format' });
    }

    const requesterId = new mongoose.Types.ObjectId(req.userId);
    const targetFollowerId = new mongoose.Types.ObjectId(followerId);

    // 1. Remove requester from the follower's following list
    await User.findByIdAndUpdate(targetFollowerId, { $pull: { following: requesterId } });
    
    // 2. Remove the follower from the requester's followers list
    await User.findByIdAndUpdate(requesterId, { $pull: { followers: targetFollowerId } });
    
    res.json({ message: 'Follower removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing follower', error: error.message });
  }
});

app.get('/api/users/:username/followers', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .populate('followers', 'username');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.followers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching followers', error: error.message });
  }
});

app.get('/api/users/:username/following', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .populate('following', 'username');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.following);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching following', error: error.message });
  }
});

// Messaging routes
app.get('/api/messages', authenticate, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.userId }, { recipient: req.userId }]
    }).populate('sender recipient', 'username avatarColor profilePhoto').sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

app.post('/api/messages', authenticate, async (req, res) => {
  try {
    const { recipientId, text, media, mediaType } = req.body;

    // Check if there is an existing conversation that is accepted
    const existingConversation = await Message.findOne({
      $or: [
        { sender: req.userId, recipient: recipientId },
        { sender: recipientId, recipient: req.userId }
      ],
      isAccepted: true
    });

    const newMessage = new Message({
      sender: req.userId,
      recipient: recipientId,
      text,
      media,
      mediaType,
      isAccepted: !!existingConversation
    });

    await newMessage.save();
    const populated = await Message.findById(newMessage._id).populate('sender recipient', 'username avatarColor profilePhoto');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

app.patch('/api/messages/accept/:senderId', authenticate, async (req, res) => {
  try {
    await Message.updateMany(
      { sender: req.params.senderId, recipient: req.userId },
      { isAccepted: true }
    );
    await Message.updateMany(
      { sender: req.userId, recipient: req.params.senderId },
      { isAccepted: true }
    );
    res.json({ message: 'Request accepted' });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting request', error: error.message });
  }
});

app.patch('/api/messages/seen/:partnerId', authenticate, async (req, res) => {
  try {
    await Message.updateMany(
      { sender: req.params.partnerId, recipient: req.userId, isSeen: false },
      { isSeen: true }
    );
    res.json({ message: 'Messages marked as seen' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as seen', error: error.message });
  }
});

// Notification routes
app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId })
      .populate('sender', 'username profilePhoto avatarColor')
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

app.patch('/api/notifications/seen', authenticate, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.userId, isSeen: false }, { isSeen: true });
    res.json({ message: 'Notifications marked as seen' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notifications as seen', error: error.message });
  }
});

app.delete('/api/notifications', authenticate, async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.userId });
    res.json({ message: 'Notifications cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing notifications', error: error.message });
  }
});


// Get user's bookmarks
app.get('/api/users/bookmarks', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: 'bookmarks',
      populate: [
        { path: 'author', select: 'username avatarColor profilePhoto' },
        { path: 'comments.user', select: 'username avatarColor profilePhoto' }
      ]
    });
    res.json(user.bookmarks.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookmarks', error: error.message });
  }
});

// Toggle bookmark
app.post('/api/posts/:id/bookmark', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const isBookmarked = user.bookmarks.includes(req.params.id);
    
    if (isBookmarked) {
      user.bookmarks = user.bookmarks.filter(id => id.toString() !== req.params.id);
    } else {
      user.bookmarks.push(req.params.id);
    }
    
    await user.save();
    res.json({ isBookmarked: !isBookmarked });
  } catch (error) {
    res.status(500).json({ message: 'Error bookmarking post', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend V2.2 running on http://localhost:${port}`);
});
