import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, User, LogOut, Sun, Moon, Film, MessageCircle, Search, Bell, Settings, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Logo from './Logo';

const Navbar = () => {
  const { user, token, API_URL, logout, hasUnread, hasUnreadNotifications, unreadCount, unreadMessageCount } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const isTimeline = location.pathname === '/';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([]);
        if (isMobileSearchOpen && !search.trim()) {
          setIsMobileSearchOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileSearchOpen, search]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!search.trim() || !token) {
        setSearchResults([]);
        return;
      }
      try {
        const isTagSearch = search.startsWith('@');
        const query = isTagSearch ? search.slice(1) : search;
        const response = await fetch(`${API_URL}/api/users?search=${query}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.filter(u => u.username.toLowerCase() !== user?.username?.toLowerCase()));
        }
      } catch (error) {
        console.error("Error searching in navbar:", error);
      }
    };

    const timer = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(timer);
  }, [search, user, token, API_URL]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container-inner">
        {/* Left: Brand / Logo */}
        <div className={`nav-left ${isMobileSearchOpen ? 'mobile-hidden' : ''}`}>
          <Link to="/" className="nav-brand" style={{ gap: '0' }}>
            <span className="brand-text">S</span>
            <Logo size="32px" className="nav-logo" style={{ margin: '0 -6px' }} />
            <span className="brand-text">cialPedia</span>
          </Link>
        </div>

        {/* Center: Search (Desktop and Mobile Expandable) */}
        <div className={`nav-center ${isMobileSearchOpen ? 'mobile-visible' : ''}`} ref={searchRef}>
          <div className="search-container">
            <Search size={16} opacity={0.5} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus={isMobileSearchOpen}
            />
            <button className="mobile-only search-close-btn" onClick={() => setIsMobileSearchOpen(false)}>
              <X size={18} />
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="search-results-dropdown card">
              {searchResults.map(u => (
                <Link key={u._id || u.id} to={`/profile/${u.username}`} onClick={() => { setSearch(''); setSearchResults([]); setIsMobileSearchOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '5px' }} className="nav-btn">
                  <div className="post-avatar" style={{ width: '28px', height: '28px', fontSize: '0.8rem', backgroundColor: u.avatarColor || 'var(--primary-color)', overflow: 'hidden' }}>
                    {u.profilePhoto ? <img src={u.profilePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : u.username[0].toUpperCase()}
                  </div>
                  <span style={{ color: 'var(--text-color)' }}>{u.username}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* Right: Navigation Icons */}
        <div className={`nav-right ${isMobileSearchOpen ? 'mobile-hidden' : ''}`}>
          {user ? (
            <div className="nav-links">
              {/* Mobile Search Trigger */}
              <button className="nav-btn mobile-only" onClick={() => setIsMobileSearchOpen(true)}>
                <Search size={20} />
              </button>
              
              <Link to="/" className="nav-btn desktop-only"><Home size={20} /></Link>
              <Link to="/reels" className="nav-btn"><Film size={20} /></Link>
              <Link to="/messages" className="nav-btn-wrapper nav-btn">
                <MessageCircle size={20} />
                {hasUnread && <div className="notification-dot">{unreadMessageCount > 0 ? unreadMessageCount : ''}</div>}
              </Link>
              <Link to="/notifications" className="nav-btn-wrapper nav-btn">
                <Bell size={20} />
                {hasUnreadNotifications && <div className="notification-dot">{unreadCount > 0 ? unreadCount : ''}</div>}
              </Link>
              <Link to={`/profile/${user.username}`} className="nav-btn profile-nav-link">
                <div className="post-avatar" style={{ width: '24px', height: '24px', fontSize: '0.7rem', backgroundColor: user.avatarColor, overflow: 'hidden' }}>
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  ) : (
                    user.username[0].toUpperCase()
                  )}
                </div>
              </Link>
              <Link to="/settings" className="nav-btn desktop-only"><Settings size={20} /></Link>
              <button onClick={handleLogout} className="nav-btn"><LogOut size={20} /></button>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
