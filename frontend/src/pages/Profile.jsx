import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import Post from '../components/Post';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, UserMinus, MessageCircle, Camera, Edit2, Check, X } from 'lucide-react';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const highlightId = queryParams.get('highlight');

  const { user: currentUser, token, API_URL, followUser, unfollowUser, getFollowStatus, getFollowStats, followUpdate, openChat, updateProfilePhoto, updateBio } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [status, setStatus] = useState({ following: false, followedBy: false, isMutual: false });
  const [stats, setStats] = useState({ followersCount: 0, followingCount: 0 });
  const [showList, setShowList] = useState(null); 
  const [listData, setListData] = useState([]);
  const [otherListData, setOtherListData] = useState([]); // To check mutuals
  const [searchQuery, setSearchQuery] = useState('');
  const [mutualFilter, setMutualFilter] = useState('all'); // 'all', 'mutual', 'not-mutual'
  
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');

  useEffect(() => {
    if (!username) return;

    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users/profile/${username}`);
        if (response.ok) {
          const data = await response.json();
          setProfileUser(data);
          setNewBio(data.bio || '');
          
          if (currentUser) {
            // Check following status from the database results
            const isFollowing = data.followers?.includes(currentUser.id);
            const isFollowedBy = data.following?.includes(currentUser.id);
            setStatus({
              following: isFollowing,
              followedBy: isFollowedBy,
              isMutual: isFollowing && isFollowedBy
            });
            setStats({
              followersCount: data.followers?.length || 0,
              followingCount: data.following?.length || 0
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();

    const fetchUserPosts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/posts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const allPostsData = await response.json();
          const allPosts = allPostsData.posts || [];
          const filteredPosts = allPosts.filter(p => {
            const authorUsername = p.author?.username?.toLowerCase();
            return authorUsername === username.toLowerCase();
          });
          setUserPosts(filteredPosts);
        }
      } catch (error) {
        console.error('Error fetching user posts:', error);
      }
    };
    
    fetchUserPosts();
  }, [username, currentUser, followUpdate, API_URL]);

  const handlePhotoUpdate = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image too large (Max 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => updateProfilePhoto(event.target.result);
    reader.readAsDataURL(file);
  };

  const handleSaveBio = () => {
    updateBio(newBio);
    setIsEditingBio(false);
  };

  const handlePostUpdate = (updatedPost) => {
    setUserPosts(userPosts.map(p => (p._id || p.id) === (updatedPost._id || updatedPost.id) ? updatedPost : p));
  };

  const handlePostDelete = async (postId) => {
    if (window.confirm("Delete this post?")) {
      try {
        const response = await fetch(`${API_URL}/api/posts/${postId.toString()}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          setUserPosts(userPosts.filter(p => (p._id || p.id) !== postId));
        } else {
          const data = await response.json();
          alert(data.message || "Failed to delete post");
        }
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleShowList = async (type) => {
    try {
      const otherType = type === 'followers' ? 'following' : 'followers';
      const [resp1, resp2] = await Promise.all([
        fetch(`${API_URL}/api/users/${username}/${type}`),
        fetch(`${API_URL}/api/users/${username}/${otherType}`)
      ]);
      
      if (resp1.ok && resp2.ok) {
        const data1 = await resp1.json();
        const data2 = await resp2.json();
        setListData(data1);
        setOtherListData(data2);
        setShowList(type);
        setSearchQuery('');
        setMutualFilter('all');
      }
    } catch (error) {
      console.error(`Error fetching lists:`, error);
    }
  };

  const handleRemoveFollower = async (followerId) => {
    if (window.confirm("Remove this follower? They will no longer be following you.")) {
      try {
        const response = await fetch(`${API_URL}/api/users/follower/${followerId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          setListData(listData.filter(u => (u._id || u.id)?.toString() !== followerId));
          setStats(prev => ({ ...prev, followersCount: Math.max(0, prev.followersCount - 1) }));
        } else {
          const errorData = await response.json();
          alert(errorData.message || "Failed to remove follower");
        }
      } catch (error) {
        console.error('Error removing follower:', error);
      }
    }
  };

  const handleFollow = async () => {
    if (!profileUser) return;
    const targetId = profileUser.id || profileUser._id;
    let success = false;
    if (status.following) success = await unfollowUser(targetId);
    else success = await followUser(targetId);
    
    if (success) {
      try {
        const response = await fetch(`${API_URL}/api/users/profile/${username}`);
        if (response.ok) {
          const data = await response.json();
          setProfileUser(data);
          setStats({
            followersCount: data.followers?.length || 0,
            followingCount: data.following?.length || 0
          });
          if (currentUser) {
            const isFollowing = data.followers?.includes(currentUser.id);
            const isFollowedBy = data.following?.includes(currentUser.id);
            setStatus({
              following: isFollowing,
              followedBy: isFollowedBy,
              isMutual: isFollowing && isFollowedBy
            });
          }
        }
      } catch (error) {
        console.error('Error refreshing profile after follow action:', error);
      }
    }
  };

  const filteredListData = listData.filter(u => {
    const matchesSearch = u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const isMutual = otherListData.some(other => (other._id || other.id) === (u._id || u.id));
    if (mutualFilter === 'mutual') return isMutual;
    if (mutualFilter === 'not-mutual') return !isMutual;
    return true;
  });
  const isOwnProfile = currentUser?.username?.toLowerCase() === username?.toLowerCase();

  if (!profileUser) return <div className="main-content-wrapper" style={{maxWidth:'800px'}}><div className="card" style={{padding:'40px', textAlign:'center'}}>Loading profile...</div></div>;

  return (
    <>
      <div className="main-content-wrapper" style={{ maxWidth: '800px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', backgroundColor: profileUser?.avatarColor || '#3b82f6', flexShrink: 0 }}>
              {profileUser?.profilePhoto ? (
                <img src={profileUser.profilePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={username} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white', fontWeight: 'bold' }}>
                  {username ? username[0].toUpperCase() : '?'}
                </div>
              )}
              {isOwnProfile && (
                <label style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', height: '30%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Camera size={14} color="white" />
                  <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handlePhotoUpdate} />
                </label>
              )}
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{username}</h2>
              <p style={{ opacity: 0.6, fontSize: '0.9rem', marginBottom: '10px' }}>@{username?.toLowerCase()}</p>
              
              <div style={{ display: 'flex', gap: '15px', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                <div><strong>{userPosts.length}</strong> Posts</div>
                <div onClick={() => handleShowList('followers')} style={{ cursor: 'pointer' }}>
                  <strong>{stats.followersCount}</strong> Followers
                </div>
                <div onClick={() => handleShowList('following')} style={{ cursor: 'pointer' }}>
                  <strong>{stats.followingCount}</strong> Following
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 5px 0', opacity: 0.8 }}>Bio</h4>
                {isEditingBio ? (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <textarea 
                      className="input-field" 
                      value={newBio} 
                      onChange={(e) => setNewBio(e.target.value)}
                      style={{ height: '60px', margin: 0 }}
                    />
                    <button onClick={handleSaveBio} className="btn" style={{ padding: '8px' }}><Check size={18} /></button>
                  </div>
                ) : (
                  <p style={{ margin: 0, lineHeight: '1.4' }}>{profileUser?.bio || 'No bio yet.'}</p>
                )}
              </div>
              {isOwnProfile && !isEditingBio && (
                <button onClick={() => setIsEditingBio(true)} style={{ color: 'var(--primary-color)' }}><Edit2 size={16} /></button>
              )}
            </div>

            {!isOwnProfile && currentUser && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button className={`btn ${status.following ? 'btn-secondary' : ''}`} onClick={handleFollow} style={{ flex: 1 }}>
                  {status.following ? (
                    <><UserMinus size={18} /> Unfollow</>
                  ) : status.followedBy ? (
                    <><UserPlus size={18} /> Follow back</>
                  ) : (
                    <><UserPlus size={18} /> Follow</>
                  )}
                </button>
                <button className="btn" onClick={() => { openChat(username); navigate('/messages'); }} style={{ flex: 1 }}>
                  <MessageCircle size={18} /> {status.isMutual ? 'Message' : 'Message Request'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="timeline">
          <h3 style={{ marginBottom: '25px', opacity: 0.8, textAlign: 'center' }}>Posts by {username}</h3>
          {userPosts.length > 0 ? (
            userPosts.map(post => (
              <Post 
                key={post._id || post.id} 
                post={post} 
                onPostUpdate={handlePostUpdate} 
                onPostDelete={handlePostDelete} 
                isHighlighted={highlightId === (post._id || post.id)?.toString()}
              />
            ))
          ) : (
            <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '20px' }}>No posts yet.</p>
          )}
        </div>
      </div>

      {showList && (
        <div className="list-modal-overlay" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={() => setShowList(null)}>
          <div className="card list-modal-content" style={{ backgroundColor: 'var(--card-bg)', border: '2px solid var(--primary-color)', minHeight: '200px', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>{showList.charAt(0).toUpperCase() + showList.slice(1)}</h3>
              <button onClick={() => setShowList(null)} style={{ fontSize: '2rem', color: 'var(--text-color)', lineHeight: 0.5 }}>&times;</button>
            </div>
            <input type="text" className="input-field" placeholder={`Search in ${showList}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
            
            <div style={{ display: 'flex', gap: '5px', marginBottom: '15px', overflowX: 'auto', paddingBottom: '5px' }}>
              <button 
                className={`btn-secondary ${mutualFilter === 'all' ? 'active' : ''}`} 
                onClick={() => setMutualFilter('all')}
                style={{ fontSize: '0.75rem', padding: '5px 10px', backgroundColor: mutualFilter === 'all' ? 'var(--primary-color)' : '', color: mutualFilter === 'all' ? 'white' : '' }}
              >
                All
              </button>
              <button 
                className={`btn-secondary ${mutualFilter === 'mutual' ? 'active' : ''}`} 
                onClick={() => setMutualFilter('mutual')}
                style={{ fontSize: '0.75rem', padding: '5px 10px', backgroundColor: mutualFilter === 'mutual' ? 'var(--primary-color)' : '', color: mutualFilter === 'mutual' ? 'white' : '' }}
              >
                {showList === 'following' ? 'Mutual Follow' : 'Follows Back'}
              </button>
              <button 
                className={`btn-secondary ${mutualFilter === 'not-mutual' ? 'active' : ''}`} 
                onClick={() => setMutualFilter('not-mutual')}
                style={{ fontSize: '0.75rem', padding: '5px 10px', backgroundColor: mutualFilter === 'not-mutual' ? 'var(--primary-color)' : '', color: mutualFilter === 'not-mutual' ? 'white' : '' }}
              >
                {showList === 'following' ? 'Does not follow back' : 'Not following back'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
              {filteredListData.length > 0 ? filteredListData.map(u => {
                const isMutual = otherListData.some(other => (other._id || other.id)?.toString() === (u._id || u.id)?.toString());
                return (
                  <div key={u._id || u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                    <div style={{ flex: 1 }}>
                      <Link to={`/profile/${u.username}`} onClick={() => setShowList(null)} style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-color)' }}>{u.username}</Link>
                      {isMutual && <span style={{ marginLeft: '8px', fontSize: '0.7rem', backgroundColor: 'var(--primary-color)', color: 'white', padding: '2px 6px', borderRadius: '10px', opacity: 0.8 }}>Mutual</span>}
                    </div>
                    {isOwnProfile && showList === 'followers' && (
                      <button 
                        onClick={() => handleRemoveFollower((u._id || u.id)?.toString())} 
                        style={{ color: '#ff4d4d', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ff4d4d' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              }) : (
                <div style={{ textAlign: 'center', opacity: 0.6, padding: '20px' }}>
                  <p style={{ fontSize: '0.9rem' }}>{searchQuery ? 'No matching users.' : `No users found.`}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
