import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Settings as SettingsIcon, Moon, Sun, Trash2, AlertTriangle, User, History, Download, Clock, Heart, MessageSquare, FileText, Lock, ShieldCheck, ChevronRight, ChevronDown, Mail } from 'lucide-react';

const SettingsPage = () => {
  const { user, token, API_URL, logout, changePassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [allActivity, setAllActivity] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Toggle sections
  const [showSecurity, setShowSecurity] = useState(false);

  // Change Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changeMsg, setChangeMsg] = useState({ type: '', text: '' });
  const [isChanging, setIsChanging] = useState(false);

  if (!user) return null;

  const fetchActivity = async () => {
    setLoadingActivity(true);
    try {
      const response = await fetch(`${API_URL}/api/users/activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllActivity(data);
        setIsLoaded(true);
      }
    } catch (error) {
      console.error("Error fetching activity:", error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangeMsg({ type: '', text: '' });
    if (newPassword.length < 6) {
      return setChangeMsg({ type: 'error', text: 'New password must be at least 6 characters' });
    }
    
    setIsChanging(true);
    const res = await changePassword(oldPassword, newPassword);
    setIsChanging(false);
    
    if (res.success) {
      setChangeMsg({ type: 'success', text: 'Password changed successfully!' });
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => setShowSecurity(false), 2000);
    } else {
      setChangeMsg({ type: 'error', text: res.message || 'Failed to change password' });
    }
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
      case 'like': return <Heart size={16} color="#ff4d4d" fill="#ff4d4d" />;
      case 'comment': return <MessageSquare size={16} color="var(--primary-color)" />;
      case 'post': return <FileText size={16} color="#4caf50" />;
      default: return <Clock size={16} />;
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm("CRITICAL: Are you absolutely sure? This will permanently delete your account and all data.");
    if (confirmation) {
      const secondConfirmation = window.prompt("Type your username to confirm:");
      if (secondConfirmation?.toLowerCase() === user.username.toLowerCase()) {
        try {
          const response = await fetch(`${API_URL}/api/users/profile`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            alert("Account deleted.");
            logout();
          }
        } catch (error) {
          console.error("Error deleting account:", error);
        }
      }
    }
  };

  return (
    <div className="main-content-wrapper" style={{ maxWidth: '800px' }}>
      <div className="card">
        <h2 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center' }}>
          <SettingsIcon size={24} color="var(--primary-color)" style={{ marginRight: '10px' }} />
          Settings
        </h2>

        {/* Personal Info Section */}
        <section style={{ marginBottom: '35px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', opacity: 0.8, display: 'flex', alignItems: 'center' }}>
            <User size={18} color="var(--primary-color)" style={{ marginRight: '8px' }} />
            Personal Info
          </h3>
          <div className="card" style={{ margin: 0, padding: '20px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>Username</span>
                <span style={{ fontWeight: '600' }}>{user.username}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>Email Address</span>
                <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={14} opacity={0.5} />
                  {user.email || 'Not provided'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Theme Section */}
        <section style={{ marginBottom: '35px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', opacity: 0.8 }}>Appearance</h3>
          <div className="card" style={{ margin: 0, padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {theme === 'light' ? <Sun size={20} style={{ marginRight: '12px' }} /> : <Moon size={20} style={{ marginRight: '12px' }} />}
              <div>
                <p style={{ margin: 0, fontWeight: '600' }}>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>Toggle visual theme</p>
              </div>
            </div>
            <button onClick={toggleTheme} className="btn" style={{ padding: '8px 15px', fontSize: '0.85rem' }}>Toggle</button>
          </div>
        </section>

        {/* Security / Password Section (Toggleable) */}
        <section style={{ marginBottom: '35px' }}>
          <div 
            onClick={() => setShowSecurity(!showSecurity)} 
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}
          >
            <h3 style={{ fontSize: '1.1rem', margin: 0, opacity: 0.8, display: 'flex', alignItems: 'center' }}>
              <Lock size={18} color="var(--primary-color)" style={{ marginRight: '8px' }} />
              Security
            </h3>
            {showSecurity ? <ChevronDown size={20} opacity={0.5} /> : <ChevronRight size={20} opacity={0.5} />}
          </div>
          
          {showSecurity && (
            <div className="card" style={{ margin: 0, padding: '25px', border: '1px solid var(--border-color)', animation: 'fadeIn 0.3s ease' }}>
              <form onSubmit={handleChangePassword}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>Current Password</label>
                  <input type="password" className="input-field" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} style={{ margin: 0 }} required />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>New Password</label>
                  <input type="password" className="input-field" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ margin: 0 }} required />
                </div>
                {changeMsg.text && (
                  <div style={{ padding: '10px 15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem', backgroundColor: changeMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 77, 77, 0.1)', color: changeMsg.type === 'success' ? '#10b981' : '#ff4d4d', border: `1px solid ${changeMsg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 77, 77, 0.2)'}` }}>
                    {changeMsg.text}
                  </div>
                )}
                <button type="submit" className="btn" disabled={isChanging}>{isChanging ? 'Updating...' : 'Update Password'}</button>
              </form>
            </div>
          )}
        </section>

        {/* Activity Log Section */}
        <section style={{ marginBottom: '35px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, opacity: 0.8, display: 'flex', alignItems: 'center' }}>
              <History size={18} style={{ marginRight: '8px' }} />
              Activity Log
            </h3>
            {isLoaded && allActivity.length > 0 && (
              <button onClick={downloadLog} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', fontSize: '0.8rem', borderRadius: '15px' }}>
                <Download size={14} /> Download Log
              </button>
            )}
          </div>

          {!isLoaded ? (
            <div className="card" style={{ textAlign: 'center', padding: '30px', margin: 0, backgroundColor: 'var(--bg-color)', border: '1px dashed var(--border-color)' }}>
              <p style={{ opacity: 0.6, marginBottom: '15px' }}>View your recent actions, posts, and interactions.</p>
              <button onClick={fetchActivity} className="btn" disabled={loadingActivity}>{loadingActivity ? 'Loading...' : 'View Activity Log'}</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: 'var(--border-color)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              {allActivity.length > 0 ? allActivity.map(act => (
                <div key={act.id} className="activity-item" style={{ backgroundColor: 'var(--card-bg)', border: 'none' }}>
                  <div className="activity-icon" style={{ backgroundColor: 'var(--bg-color)' }}>{getActionIcon(act.type)}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{act.text}</p>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{new Date(act.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              )) : <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--card-bg)' }}><p style={{ opacity: 0.5 }}>No recent activity found.</p></div>}
            </div>
          )}
        </section>

        {/* Account Section */}
        <section style={{ marginBottom: '35px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
            <ShieldCheck size={18} color="var(--primary-color)" style={{ marginRight: '8px' }} />
            Account Session
          </h3>
          <div className="card" style={{ margin: 0, padding: '20px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontWeight: '600' }}>Session</p>
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.6 }}>Log out of your account on this device.</p>
              </div>
              <button onClick={logout} className="btn btn-secondary" style={{ padding: '10px 20px' }}>Log Out</button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section style={{ marginTop: '40px', borderTop: '2px solid #ff4d4d', paddingTop: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#ff4d4d', display: 'flex', alignItems: 'center' }}>
            <AlertTriangle size={18} style={{ marginRight: '8px' }} />
            Danger Zone
          </h3>
          <div className="card" style={{ margin: 0, padding: '20px', backgroundColor: 'rgba(255, 77, 77, 0.05)', border: '1px solid #ff4d4d' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ marginBottom: '10px' }}>
                <p style={{ margin: 0, fontWeight: '700', color: '#ff4d4d' }}>Delete Account</p>
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>Permanently remove all data. Cannot be undone.</p>
              </div>
              <button onClick={handleDeleteAccount} className="btn" style={{ backgroundColor: '#ff4d4d', padding: '10px 20px' }}><Trash2 size={18} style={{ marginRight: '8px' }} /> Delete My Account</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
