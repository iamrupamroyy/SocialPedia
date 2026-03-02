import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageSquare, Share2, Trash2, Send, Reply, AtSign, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Post = ({ post, onPostUpdate, onPostDelete, isHighlighted }) => {
  const { user, token, API_URL } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // comment id
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Mentions state for comments
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const [allUsers, setAllUsers] = useState([]);
  const commentInputRef = useRef(null);

  useEffect(() => {
    if (user && post) {
      const bookmarked = user.bookmarks?.some(id => id.toString() === (post._id || post.id)?.toString());
      setIsBookmarked(bookmarked);
    }
  }, [user, post]);

  const handleBookmark = async () => {
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/bookmark`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.isBookmarked);
      }
    } catch (error) {
      console.error("Error bookmarking:", error);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/api/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAllUsers(data);
        }
      } catch (error) {
        console.error("Error fetching users for mentions:", error);
      }
    };
    fetchUsers();
  }, [token, API_URL]);

  const author = post.author || {};
  const profilePhoto = author.profilePhoto;
  const username = author.username || 'Unknown';

  const isLiked = post.likes?.some(id => id.toString() === user?.id?.toString());
  const isAuthor = (author._id || author.id)?.toString() === user?.id?.toString();
  const rawId = post._id || post.id;
  const postId = typeof rawId === 'string' ? rawId.split(':')[0] : rawId;

  const handleLike = async () => {
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const updatedPost = await response.json();
        onPostUpdate({ ...post, likes: updatedPost.likes });
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setCommentText(val);
    setCursorPos(pos);

    const textBefore = val.slice(0, pos);
    const lastAt = textBefore.lastIndexOf('@');
    if (lastAt !== -1) {
      const query = textBefore.slice(lastAt + 1);
      const charBefore = lastAt > 0 ? textBefore[lastAt - 1] : ' ';
      if (!query.includes(' ') && (charBefore === ' ' || charBefore === '\n')) {
        const matches = allUsers.filter(u => 
          u.username.toLowerCase().includes(query.toLowerCase()) && 
          u.username.toLowerCase() !== user?.username?.toLowerCase()
        ).slice(0, 5);
        setMentionSuggestions(matches);
        setShowMentions(matches.length > 0);
        return;
      }
    }
    setShowMentions(false);
  };

  const selectMention = (username) => {
    const textBefore = commentText.slice(0, cursorPos);
    const lastAt = textBefore.lastIndexOf('@');
    const before = commentText.slice(0, lastAt);
    const after = commentText.slice(cursorPos);
    setCommentText(`${before}@${username} ${after}`);
    setShowMentions(false);
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 0);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          text: commentText,
          parentId: replyingTo 
        })
      });
      if (response.ok) {
        const updatedPost = await response.json();
        onPostUpdate(updatedPost);
        setCommentText('');
        setReplyingTo(null);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const renderContent = (content) => {
    if (!content) return null;
    const words = content.split(/(\s+)/);
    return words.map((word, index) => {
      if (word.startsWith('@') && word.length > 1) {
        const usernameMention = word.substring(1).replace(/[.,!?;:]+$/, '');
        const punct = word.substring(usernameMention.length + 1);
        return <React.Fragment key={index}><Link to={`/profile/${usernameMention}`} style={{ color: 'var(--primary-color)', fontWeight: '600' }}>@{usernameMention}</Link>{punct}</React.Fragment>;
      }
      return word;
    });
  };

  const CommentThread = ({ comments, parentId = null, depth = 0 }) => {
    const filtered = (comments || []).filter(c => (c.parentId || null) === parentId);
    if (filtered.length === 0) return null;

    return (
      <div className={`comments-thread ${depth > 0 ? 'nested-comments' : ''}`} style={{ paddingTop: depth === 0 ? '10px' : '0' }}>
        {filtered.map(c => (
          <div key={c._id} className="comment-wrapper">
            <div className="comment-item">
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link to={`/profile/${c.user?.username}`}>
                  <div className="post-avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem', backgroundColor: c.user?.avatarColor, overflow: 'hidden' }}>
                    {c.user?.profilePhoto ? <img src={c.user.profilePhoto} style={{width:'100%', height:'100%', objectFit: 'cover'}} alt="" /> : (c.user?.username ? c.user.username[0].toUpperCase() : '?')}
                  </div>
                </Link>
                <div style={{ flex: 1 }}>
                  <div className="comment-bubble">
                    <Link to={`/profile/${c.user?.username}`} style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{c.user?.username}</Link>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.9rem' }}>{renderContent(c.text)}</p>
                  </div>
                  <div className="comment-actions" style={{ display: 'flex', gap: '15px', marginTop: '4px', fontSize: '0.75rem', opacity: 0.7, paddingLeft: '8px' }}>
                    <span>{new Date(c.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    <button 
                      onClick={() => { 
                        setReplyingTo(c._id); 
                        setCommentText(`@${c.user?.username} `); 
                        commentInputRef.current?.focus(); 
                      }}
                      style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <CommentThread comments={comments} parentId={c._id} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`card post ${isHighlighted ? 'highlighted-post' : ''}`} id={`post-${postId}`}>
      <div className="post-header">
        <Link to={`/profile/${username}`}>
          <div className="post-avatar" style={{ backgroundColor: author.avatarColor || '#1877f2' }}>
            {profilePhoto ? <img src={profilePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : username[0].toUpperCase()}
          </div>
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
            <Link to={`/profile/${username}`} className="post-author">{username}</Link>
            {post.tags?.length > 0 && (
              <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                with <Link to={`/profile/${post.tags[0]}`} style={{ fontWeight: 600 }}>{post.tags[0]}</Link>
                {post.tags.length > 1 && ` and ${post.tags.length - 1} others`}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{new Date(post.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
        </div>
        {isAuthor && (
          <button onClick={() => onPostDelete(postId)} style={{ color: '#ff4d4d', opacity: 0.6 }} title="Delete Post">
            <Trash2 size={18} />
          </button>
        )}
      </div>
      
      <div className="post-content">{renderContent(post.content)}</div>

      {post.media && (
        <div className="post-media-content">
          {post.mediaType === 'image' ? <img src={post.media} className="post-media" alt="" /> : <video src={post.media} className="post-media" controls />}
        </div>
      )}
      
      <div className="post-actions">
        <button className="action-btn" onClick={handleLike} style={{ color: isLiked ? 'var(--primary-color)' : 'inherit', opacity: isLiked ? 1 : 0.6 }}>
          <Heart size={20} fill={isLiked ? 'var(--primary-color)' : 'none'} /> 
          <span>{post.likes?.length || 0}</span>
        </button>
        <button className="action-btn" onClick={() => setShowComments(!showComments)}>
          <MessageSquare size={20} />
          <span>{post.comments?.length || 0}</span>
        </button>
        <button className="action-btn" onClick={() => {navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`); alert("Link copied!"); }}>
          <Share2 size={20} />
          <span className="desktop-only">Share</span>
        </button>
        <button className="action-btn" onClick={handleBookmark} style={{ color: isBookmarked ? '#f59e0b' : 'inherit', opacity: isBookmarked ? 1 : 0.6 }}>
          <Bookmark size={20} fill={isBookmarked ? '#f59e0b' : 'none'} />
          <span className="desktop-only">{isBookmarked ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      {showComments && (
        <div className="post-comments-section">
          <CommentThread comments={post.comments} />
          
          <div style={{ position: 'relative' }}>
            {showMentions && (
              <div className="mention-dropdown" style={{ bottom: '100%', left: '0', marginBottom: '10px' }}>
                {mentionSuggestions.map(u => (
                  <div key={u._id || u.id} className="mention-item" onClick={() => selectMention(u.username)}>
                    <div className="post-avatar" style={{ width: '24px', height: '24px', fontSize: '0.7rem', backgroundColor: u.avatarColor, overflow: 'hidden' }}>
                      {u.profilePhoto ? <img src={u.profilePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : u.username[0].toUpperCase()}
                    </div>
                    <span>{u.username}</span>
                  </div>
                ))}
              </div>
            )}
            
            <form className="comment-input-area" onSubmit={handleAddComment}>
              <div className="post-avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem', backgroundColor: user?.avatarColor }}>
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                ) : (
                  user?.username?.[0].toUpperCase()
                )}
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                {replyingTo && (
                  <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '4px', display: 'flex', justifyContent: 'space-between', paddingLeft: '10px' }}>
                    <span>Replying to {post.comments.find(c => c._id === replyingTo)?.user?.username}</span>
                    <button type="button" onClick={() => setReplyingTo(null)} style={{ color: '#ff4d4d' }}>Cancel</button>
                  </div>
                )}
                <input 
                  ref={commentInputRef}
                  type="text" 
                  placeholder={replyingTo ? "Write a reply..." : "Write a comment..."} 
                  value={commentText}
                  onChange={handleInputChange}
                />
              </div>
              <button type="submit" disabled={!commentText.trim()} style={{ background: 'var(--primary-color)', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {showLikesModal && (
        <div className="list-modal-overlay" onClick={() => setShowLikesModal(null)}>
          <div className="card list-modal-content" style={{ backgroundColor: 'var(--card-bg)', border: '2px solid var(--primary-color)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Liked by</h3>
              <button onClick={() => setShowLikesModal(false)} style={{ fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {post.likes.map(u => {
                const userObj = allUsers.find(user => (user._id || user.id)?.toString() === u.toString());
                const dispName = userObj ? userObj.username : u;
                return (
                  <div key={u} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderBottom: '1px solid var(--border-color)' }}>
                    <div className="post-avatar" style={{ width: '35px', height: '35px', fontSize: '0.9rem', backgroundColor: userObj?.avatarColor || 'var(--primary-color)' }}>
                      {userObj?.profilePhoto ? <img src={userObj.profilePhoto} style={{width:'100%', height:'100%', borderRadius:'50%'}} /> : dispName[0]?.toUpperCase()}
                    </div>
                    <Link to={`/profile/${dispName}`} onClick={() => setShowLikesModal(false)} style={{ fontWeight: 600 }}>{dispName}</Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;
