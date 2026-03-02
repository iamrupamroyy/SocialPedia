import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCcw, Heart, MessageSquare, User, Music, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Reels = () => {
  const { token, API_URL, user } = useAuth();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/posts/type/video`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReels(data);
      }
    } catch (error) {
      console.error("Error fetching reels:", error);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    if (token) fetchReels();
  }, [token, fetchReels]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <RefreshCcw className="spin" size={40} color="var(--primary-color)" />
      </div>
    );
  }

  return (
    <div className="main-content-wrapper" style={{ maxWidth: '500px', padding: '0' }}>
      {reels.length > 0 ? (
        <div className="reels-feed" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {reels.map(reel => (
            <div key={reel._id} className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#000', position: 'relative', height: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <video 
                src={reel.media} 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                controls 
                loop
              />
              
              {/* Overlay Info */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', color: 'white', pointerEvents: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', pointerEvents: 'auto' }}>
                  <Link to={`/profile/${reel.author?.username}`}>
                    <div className="post-avatar" style={{ width: '36px', height: '36px', backgroundColor: reel.author?.avatarColor, border: '2px solid white' }}>
                      {reel.author?.profilePhoto ? <img src={reel.author.profilePhoto} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : reel.author?.username?.[0].toUpperCase()}
                    </div>
                  </Link>
                  <Link to={`/profile/${reel.author?.username}`} style={{ fontWeight: 'bold', color: 'white' }}>{reel.author?.username}</Link>
                </div>
                <p style={{ fontSize: '0.95rem', margin: '0 0 10px 0', pointerEvents: 'auto' }}>{reel.content}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', opacity: 0.8 }}>
                  <Music size={14} />
                  <span>Original Audio - {reel.author?.username}</span>
                </div>
              </div>

              {/* Interaction Bar */}
              <div style={{ position: 'absolute', right: '10px', bottom: '100px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <button className="nav-btn" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}><Heart size={24} fill={reel.likes?.includes(user?.id) ? "#ff4d4d" : "none"} color={reel.likes?.includes(user?.id) ? "#ff4d4d" : "white"} /></button>
                  <div style={{ color: 'white', fontSize: '0.75rem', marginTop: '4px' }}>{reel.likes?.length || 0}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <button className="nav-btn" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}><MessageSquare size={24} /></button>
                  <div style={{ color: 'white', fontSize: '0.75rem', marginTop: '4px' }}>{reel.comments?.length || 0}</div>
                </div>
                <button className="nav-btn" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}><Share2 size={24} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <p style={{ opacity: 0.5 }}>No video reels found. Share a video to see it here!</p>
          <Link to="/" className="btn" style={{ marginTop: '20px', display: 'inline-flex' }}>Go to Timeline</Link>
        </div>
      )}
    </div>
  );
};

export default Reels;
