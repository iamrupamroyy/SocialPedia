import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Heart, MessageSquare, UserPlus, Share2, AtSign } from 'lucide-react';

const Notifications = () => {
  const { user, token, API_URL, markNotificationsRead, clearNotifications, followUpdate } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !token) return;

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API_URL}/api/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
          markNotificationsRead();
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, [user, token, API_URL, followUpdate, markNotificationsRead]);

  const handleNotificationClick = (n) => {
    if (n.type === 'follow') {
      navigate(`/profile/${n.sender.username}`);
    } else if (n.post) {
      navigate(`/post/${n.post}`);
    } else {
      navigate(`/profile/${n.sender.username}`);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart size={18} color="#ff4d4d" fill="#ff4d4d" />;
      case 'comment': return <MessageSquare size={18} color="var(--primary-color)" />;
      case 'follow': return <UserPlus size={18} color="#4caf50" />;
      case 'tag': return <AtSign size={18} color="#ff9800" />;
      default: return <Bell size={18} />;
    }
  };

  const getMessage = (n) => {
    switch (n.type) {
      case 'like': return ` liked your post: "${n.content || ''}"`;
      case 'comment': return ` commented on your post: "${n.content || ''}"`;
      case 'follow': return ` started following you`;
      case 'tag': return ` tagged you in a post: "${n.content || ''}"`;
      default: return ` interacted with you`;
    }
  };

  return (
    <div className="main-content-wrapper" style={{ maxWidth: '800px' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={24} color="var(--primary-color)" />
            Notifications
          </h2>
          {notifications.length > 0 && (
            <button 
              onClick={() => window.confirm("Clear all notifications?") && clearNotifications()}
              className="btn-secondary"
              style={{ padding: '5px 12px', fontSize: '0.8rem', borderRadius: '15px' }}
            >
              Clear All
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.length > 0 ? notifications.map(n => (
            <div 
              key={n._id} 
              className="card" 
              onClick={() => handleNotificationClick(n)}
              style={{ margin: 0, padding: '15px', display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: n.isSeen ? 'var(--bg-color)' : 'var(--card-bg)', border: n.isSeen ? '1px solid var(--border-color)' : '2px solid var(--primary-color)', cursor: 'pointer' }}
            >
              <div className="post-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem', backgroundColor: n.sender.avatarColor }}>
                {n.sender.profilePhoto ? <img src={n.sender.profilePhoto} style={{width:'100%', height:'100%', borderRadius:'50%'}} alt="" /> : n.sender.username[0].toUpperCase()}
              </div>
              
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{n.sender.username}</span>
                  {' '}{getMessage(n)}
                </p>
                <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                  {new Date(n.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
              <Bell size={48} style={{ marginBottom: '10px' }} />
              <p>No notifications yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
