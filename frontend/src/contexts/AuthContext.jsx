import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('socialpedia_token') || null);
  const [loading, setLoading] = useState(true);
  
  const [hasUnread, setHasUnread] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [followUpdate, setFollowUpdate] = useState(0);
  const [activeChatPartner, setActiveChatPartner] = useState('');
  const [isChatMinimized, setIsChatMinimized] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const savedUser = localStorage.getItem('socialpedia_user');
    if (savedUser && token) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        
        // Fetch fresh data from server to ensure email etc are up to date
        fetch(`${API_URL}/api/users/profile/${parsed.username}`)
          .then(res => res.json())
          .then(freshUser => {
            if (freshUser && freshUser.username) {
              const updated = { ...parsed, ...freshUser, id: freshUser.id || freshUser._id };
              setUser(updated);
              localStorage.setItem('socialpedia_user', JSON.stringify(updated));
            }
          })
          .catch(err => console.error("Error refreshing user data", err));
      } catch (e) {
        console.error("Error parsing saved user", e);
      }
    }
    setLoading(false);

    const handleStorageChange = (e) => {
      if (e.key === 'socialpedia_user' || e.key === 'socialpedia_token' || e.key?.includes('socialpedia')) {
        setFollowUpdate(prev => prev + 1);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token]);

  const checkUnreads = useCallback(async () => {
    if (!user || !token) return;
    try {
      const [messagesRes, notificationsRes] = await Promise.all([
        fetch(`${API_URL}/api/messages`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/notifications`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (messagesRes.ok) {
        const messages = await messagesRes.json();
        const unreads = messages.filter(m => !m.isSeen && m.recipient?._id?.toString() === user.id?.toString());
        setUnreadMessageCount(unreads.length);
        setHasUnread(unreads.length > 0);
      }

      if (notificationsRes.ok) {
        const notifications = await notificationsRes.json();
        const unreads = notifications.filter(n => !n.isSeen);
        setUnreadCount(unreads.length);
        setHasUnreadNotifications(unreads.length > 0);
      }
    } catch (error) {
      console.error("Error checking unreads:", error);
    }
  }, [user, token, API_URL]);

  useEffect(() => {
    checkUnreads();
    const interval = setInterval(checkUnreads, 3000); // Check every 3s
    return () => clearInterval(interval);
  }, [checkUnreads]);

  const addNotification = useCallback(async (recipient, sender, type, postContent = '', postId = null) => {
    // This is now mostly handled by the backend, but we keep it for any legacy client-side triggers if needed
    // or we can remove it if we've updated all backend routes.
  }, []);

  const clearNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setUnreadCount(0);
        setHasUnreadNotifications(false);
        setFollowUpdate(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  }, [token, API_URL]);

  const markNotificationsRead = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/notifications/seen`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setUnreadCount(0);
        setHasUnreadNotifications(false);
      }
    } catch (error) {
      console.error("Error marking notifications read:", error);
    }
  }, [token, API_URL]);

  const markMessagesRead = useCallback(() => {
    // This is handled per conversation in Messages.jsx or ChatWidget.jsx
    setHasUnread(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('socialpedia_token', data.token);
        localStorage.setItem('socialpedia_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (error) {
      console.error('Login Fetch Error:', error);
      return { success: false, message: 'Server unreachable or error' };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('socialpedia_token', data.token);
        localStorage.setItem('socialpedia_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch (error) {
      console.error('Registration Fetch Error:', error);
      return { success: false, message: 'Server unreachable or error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('socialpedia_token');
    localStorage.removeItem('socialpedia_user');
    setToken(null);
    setUser(null);
  };

  const resetPassword = async (username) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await response.json();
      if (response.ok) return { success: true, message: data.message };
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: 'Server error' };
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    if (!token) return { success: false, message: 'Not authenticated' };
    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await response.json();
      if (response.ok) return { success: true, message: data.message };
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: 'Server error' };
    }
  };

  const updateProfilePhoto = async (photoUrl) => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profilePhoto: photoUrl })
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        localStorage.setItem('socialpedia_user', JSON.stringify(updatedUser));
        setFollowUpdate(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error updating profile photo:', error);
    }
  };

  const updateBio = async (bio) => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bio })
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        localStorage.setItem('socialpedia_user', JSON.stringify(updatedUser));
        setFollowUpdate(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error updating bio:', error);
    }
  };

  const followUser = useCallback(async (targetId) => {
    if (!user || !token) return false;
    try {
      const response = await fetch(`${API_URL}/api/users/follow/${targetId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setFollowUpdate(prev => prev + 1);
        return true;
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
    return false;
  }, [user, token, API_URL]);

  const unfollowUser = useCallback(async (targetId) => {
    if (!user || !token) return false;
    try {
      const response = await fetch(`${API_URL}/api/users/unfollow/${targetId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setFollowUpdate(prev => prev + 1);
        return true;
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
    return false;
  }, [user, token, API_URL]);

  const getFollowStatus = useCallback((targetUsername) => {
    if (!user) return { following: false, followedBy: false, isMutual: false };
    const follows = JSON.parse(localStorage.getItem('socialpedia_follows') || '[]');
    const following = !!follows.find(
      f => f.follower.toLowerCase() === user.username.toLowerCase() && 
           f.following.toLowerCase() === targetUsername.toLowerCase()
    );
    const followedBy = !!follows.find(
      f => f.follower.toLowerCase() === targetUsername.toLowerCase() && 
           f.following.toLowerCase() === user.username.toLowerCase()
    );
    return {
      following,
      followedBy,
      isMutual: following && followedBy
    };
  }, [user]);

  const getFollowStats = useCallback((username) => {
    const follows = JSON.parse(localStorage.getItem('socialpedia_follows') || '[]');
    const followingCount = follows.filter(f => f.follower.toLowerCase() === username.toLowerCase()).length;
    const followersCount = follows.filter(f => f.following.toLowerCase() === username.toLowerCase()).length;
    return { followingCount, followersCount };
  }, []);

  const openChat = useCallback((username) => {
    setActiveChatPartner(username);
    setIsChatMinimized(false);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, token, API_URL, login, register, logout, resetPassword, changePassword, loading, 
      followUser, unfollowUser, getFollowStatus, getFollowStats, 
      hasUnread, hasUnreadNotifications, unreadCount, unreadMessageCount,
      markMessagesRead, markNotificationsRead, addNotification, clearNotifications, followUpdate,
      activeChatPartner, setActiveChatPartner, isChatMinimized, setIsChatMinimized, openChat,
      updateProfilePhoto, updateBio
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
