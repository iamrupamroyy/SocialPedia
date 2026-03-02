import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Post from '../components/Post';
import { Send, Image as ImageIcon, X, UserPlus, RefreshCcw, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Timeline = () => {
  const { user, token, API_URL, followUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  
  // Mentions state
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const textAreaRef = useRef(null);
  const [allUsers, setAllUsers] = useState([]);

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const fileInputRef = useRef(null);

  const fetchPosts = useCallback(async (pageNum = 1, shouldAppend = false) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/posts?page=${pageNum}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (shouldAppend) {
          setPosts(prev => [...prev, ...data.posts]);
        } else {
          setPosts(data.posts);
        }
        setHasMore(data.hasMore);
        setPage(data.currentPage);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, [token, API_URL]);

  const fetchSuggestions = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/suggestions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }, [token, API_URL]);

  const fetchTrendingTags = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/posts/trending/tags`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTrendingTags(data);
      }
    } catch (error) {
      console.error('Error fetching trending tags:', error);
    }
  }, [token, API_URL]);

  const fetchAllUsers = useCallback(async () => {
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
  }, [token, API_URL]);

  useEffect(() => {
    if (token) {
      fetchPosts(1, false);
      fetchSuggestions();
      fetchAllUsers();
      fetchTrendingTags();
    }
  }, [token, fetchPosts, fetchSuggestions, fetchAllUsers, fetchTrendingTags]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setNewPostContent(val);
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
    const textBefore = newPostContent.slice(0, cursorPos);
    const lastAt = textBefore.lastIndexOf('@');
    const before = newPostContent.slice(0, lastAt);
    const after = newPostContent.slice(cursorPos);
    setNewPostContent(`${before}@${username} ${after}`);
    setShowMentions(false);
    setTimeout(() => {
      textAreaRef.current?.focus();
    }, 0);
  };

  const handleShowMore = () => {
    if (hasMore && !loading) {
      fetchPosts(page + 1, true);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedMedia(event.target.result);
      setMediaType(file.type.startsWith('video') ? 'video' : 'image');
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !selectedMedia) return;

    try {
      const response = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          content: newPostContent,
          media: selectedMedia,
          mediaType: mediaType
        })
      });

      if (response.ok) {
        const newPost = await response.json();
        setPosts([newPost, ...posts]);
        setNewPostContent('');
        setSelectedMedia(null);
        setMediaType(null);
        fetchTrendingTags(); // Refresh tags
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleFollowSuggestion = async (userId) => {
    const success = await followUser(userId);
    if (success) {
      setSuggestions(suggestions.filter(s => s.id !== userId && s._id !== userId));
      fetchPosts(1, false);
    }
  };

  return (
    <div className="timeline-grid main-content-wrapper">
      <div className="timeline-container">
        <div className="card create-post">
          <form onSubmit={handleCreatePost}>
            <div style={{ display: 'flex', padding: '15px 20px 5px 20px', gap: '15px' }}>
              <Link to={`/profile/${user?.username}`}>
                <div className="post-avatar" style={{ backgroundColor: user?.avatarColor }}>
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  ) : (
                    user?.username?.[0].toUpperCase()
                  )}
                </div>
              </Link>
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  ref={textAreaRef}
                  className="create-post-textarea"
                  placeholder={`What's on your mind, ${user?.username}?`}
                  value={newPostContent}
                  onChange={handleInputChange}
                />
                
                {showMentions && (
                  <div className="mention-dropdown" style={{ top: '100%', left: '0', marginTop: '5px' }}>
                    {mentionSuggestions.map(u => (
                      <div key={u._id || u.id} className="mention-item" onClick={() => selectMention(u.username)}>
                        <div className="post-avatar" style={{ width: '24px', height: '24px', fontSize: '0.7rem', backgroundColor: u.avatarColor, overflow: 'hidden' }}>
                          {u.profilePhoto ? <img src={u.profilePhoto} style={{width:'100%', height:'100%', objectFit: 'cover'}} alt="" /> : u.username[0].toUpperCase()}
                        </div>
                        <span>{u.username}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {selectedMedia && (
              <div className="media-preview-container" style={{ padding: '0 20px 15px 75px' }}>
                <div style={{ position: 'relative', width: 'fit-content', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <button type="button" className="remove-media" onClick={() => setSelectedMedia(null)} style={{ width: '24px', height: '24px' }}><X size={14} /></button>
                  {mediaType === 'image' ? (
                    <img src={selectedMedia} className="media-preview" style={{ maxHeight: '200px' }} alt="Preview" />
                  ) : (
                    <video src={selectedMedia} className="media-preview" style={{ maxHeight: '200px' }} />
                  )}
                </div>
              </div>
            )}
            
            <div className="create-post-actions">
              <label className="file-input-label">
                <ImageIcon size={20} />
                <span>Photo/Video</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </label>
              <button type="submit" className="btn" disabled={!newPostContent.trim() && !selectedMedia}>
                <Send size={18} />
                Post
              </button>
            </div>
          </form>
        </div>

        <div className="timeline">
          {posts.map(post => (
            <Post 
              key={post._id} 
              post={post} 
              onPostUpdate={(updated) => setPosts(posts.map(p => p._id === updated._id ? updated : p))}
              onPostDelete={async (id) => {
                if (window.confirm("Delete this post?")) {
                  try {
                    const response = await fetch(`${API_URL}/api/posts/${id}`, {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                      setPosts(posts.filter(p => p._id !== id));
                    }
                  } catch (error) {
                    console.error('Error deleting post:', error);
                  }
                }
              }} 
            />
          ))}
          {loading && <div style={{ textAlign: 'center', padding: '20px' }}><RefreshCcw className="spin" /></div>}
          {!loading && hasMore && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <button onClick={handleShowMore} className="btn-secondary" style={{ width: '100%', padding: '12px' }}>
                Show More
              </button>
            </div>
          )}
          {!hasMore && posts.length > 0 && <div style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>No more posts to show.</div>}
          {posts.length === 0 && hasFetched && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p>No posts yet. Follow people to see their posts!</p>
            </div>
          )}
        </div>
      </div>

      <div className="sidebar desktop-only">
        {/* Trending Section */}
        {trendingTags.length > 0 && (
          <div className="card" style={{ marginBottom: '20px', position: 'sticky', top: '85px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={20} color="var(--primary-color)" />
              Trending for you
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {trendingTags.map(item => (
                <div key={item.tag} style={{ cursor: 'pointer' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--primary-color)' }}>{item.tag}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{item.count} {item.count === 1 ? 'post' : 'posts'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card" style={{ position: 'sticky', top: trendingTags.length > 0 ? '320px' : '85px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Suggestions for you</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {suggestions.map(s => (
              <div key={s._id || s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link to={`/profile/${s.username}`}>
                  <div className="post-avatar" style={{ width: '35px', height: '35px', fontSize: '0.9rem', backgroundColor: s.avatarColor, overflow: 'hidden' }}>
                    {s.profilePhoto ? <img src={s.profilePhoto} style={{width:'100%', height:'100%', objectFit: 'cover'}} alt="" /> : s.username[0].toUpperCase()}
                  </div>
                </Link>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <Link to={`/profile/${s.username}`} style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.username}</Link>
                  {s.followsMe && <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Follows you</span>}
                </div>
                <button onClick={() => handleFollowSuggestion(s._id || s.id)} style={{ color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  {s.followsMe ? 'Follow back' : 'Follow'}
                </button>
              </div>
            ))}
            {suggestions.length === 0 && <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>No suggestions right now.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
