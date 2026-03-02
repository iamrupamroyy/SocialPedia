import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Settings as SettingsIcon, Moon, Sun, Clock, History, Heart, MessageSquare, FileText, Download, ChevronDown, Trash2, AlertTriangle } from 'lucide-react';

const Settings = () => {
  const { user, token, API_URL, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [allActivity, setAllActivity] = useState([]);
  const [displayedActivity, setDisplayedActivity] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoaded, setIsHeaderLoaded] = useState(false);
  const ITEMS_PER_PAGE = 10;

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm("CRITICAL: Are you absolutely sure? This will permanently delete your account, posts, messages, and all other data. This action cannot be undone.");
    if (confirmation) {
      const secondConfirmation = window.prompt("To confirm, please type your username below:");
      if (secondConfirmation?.toLowerCase() === user.username.toLowerCase()) {
        try {
          const response = await fetch(`${API_URL}/api/users/profile`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            alert("Your account has been successfully deleted.");
            logout();
          } else {
            alert("Failed to delete account. Please try again.");
          }
        } catch (error) {
          console.error("Error deleting account:", error);
          alert("A server error occurred. Please try again.");
        }
      } else if (secondConfirmation !== null) {
        alert("Username mismatch. Deletion cancelled.");
      }
    }
  };

  const fetchActivity = () => {
    if (!user) return;

    const allPosts = JSON.parse(localStorage.getItem('socialpedia_posts') || '[]');
    const userActions = [];

    // Posts
    allPosts.filter(p => p.author.toLowerCase() === user.username.toLowerCase()).forEach(p => {
      userActions.push({ id: `post-${p.id}`, type: 'post', text: `You posted: "${p.content.substring(0, 30)}..."`, timestamp: p.timestamp });
    });

    // Likes and Comments
    allPosts.forEach(p => {
      if (p.likes?.includes(user.username)) {
        userActions.push({ id: `like-${p.id}-${user.username}`, type: 'like', text: `You liked ${p.author}'s post`, timestamp: p.timestamp });
      }
      p.comments?.forEach(c => {
        if (c.author.toLowerCase() === user.username.toLowerCase()) {
          userActions.push({ id: `comment-${c.id}`, type: 'comment', text: `You commented on ${p.author}'s post: "${c.text.substring(0, 20)}..."`, timestamp: c.timestamp });
        }
      });
    });

    const sorted = userActions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setAllActivity(sorted);
    setDisplayedActivity(sorted.slice(0, ITEMS_PER_PAGE));
    setIsHeaderLoaded(true);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const newItems = allActivity.slice(0, nextPage * ITEMS_PER_PAGE);
    setDisplayedActivity(newItems);
    setPage(nextPage);
  };

  const downloadLog = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allActivity, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `socialpedia_activity_${user.username}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const getActionIcon = (type) => {
    switch (type) {
      case 'like': return <Heart size={16} color="#ff4d4d" />;
      case 'comment': return <MessageSquare size={16} color="var(--primary-color)" />;
      case 'post': return <FileText size={16} color="#4caf50" />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="main-content-wrapper" style={{ maxWidth: '800px' }}>
      <div className="card">
        <h2 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SettingsIcon size={24} color="var(--primary-color)" />
          Settings
        </h2>

        {/* Theme Section */}
        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', opacity: 0.8 }}>Appearance</h3>
          <div 
            className="card" 
            style={{ margin: 0, padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
              <div>
                <p style={{ margin: 0, fontWeight: '600' }}>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>Switch between light and dark themes</p>
              </div>
            </div>
            <button onClick={toggleTheme} className="btn" style={{ padding: '8px 15px', fontSize: '0.85rem' }}>
              Toggle
            </button>
          </div>
        </section>

        {/* Activity Log Section */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, opacity: 0.8, display: 'flex', alignItems: 'center', gap:8 }}>
              <History size={18} />
              Activity Log
            </h3>
            {isLoaded && (
              <button onClick={downloadLog} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', fontSize: '0.8rem', borderRadius: '15px' }}>
                <Download size={14} /> Download
              </button>
            )}
          </div>

          {!isLoaded ? (
            <div className="card" style={{ textAlign: 'center', padding: '30px', margin: 0, backgroundColor: 'var(--bg-color)', border: '1px dashed var(--border-color)' }}>
              <p style={{ opacity: 0.6, marginBottom: '15px' }}>Load your activity history to see posts, likes, and comments.</p>
              <button onClick={fetchActivity} className="btn">View Activity Log</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {displayedActivity.length > 0 ? (
                <>
                  {displayedActivity.map(act => (
                    <div 
                      key={act.id} 
                      style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                      <div style={{ opacity: 0.7 }}>{getActionIcon(act.type)}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>{act.text}</p>
                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(act.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  
                  {allActivity.length > displayedActivity.length && (
                    <button 
                      onClick={loadMore} 
                      className="btn-secondary" 
                      style={{ width: '100%', padding: '10px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <ChevronDown size={16} /> Load More (Showing {displayedActivity.length} of {allActivity.length})
                    </button>
                  )}
                </>
              ) : (
                <p style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>No activity found yet.</p>
              )}
            </div>
          )}
        </section>

        {/* Danger Zone */}
        <section style={{ marginTop: '40px', borderTop: '2px solid #ff4d4d', paddingTop: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#ff4d4d', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            Danger Zone
          </h3>
          <div 
            className="card" 
            style={{ margin: 0, padding: '20px', backgroundColor: 'rgba(255, 77, 77, 0.05)', border: '1px solid #ff4d4d' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <p style={{ margin: 0, fontWeight: '700', color: '#ff4d4d' }}>Delete Account</p>
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>
                  Permanently remove all your data. This cannot be undone.
                </p>
              </div>
              <button 
                onClick={handleDeleteAccount} 
                className="btn" 
                style={{ backgroundColor: '#ff4d4d', padding: '10px 20px' }}
              >
                <Trash2 size={18} /> Delete My Account
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
