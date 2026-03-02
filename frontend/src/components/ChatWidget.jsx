import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Minus, Maximize2, Send, X, User, Image as ImageIcon, Trash2, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

const ChatWidget = () => {
  const { user, token, API_URL, getFollowStatus, markMessagesRead, followUpdate, activeChatPartner: recipient, setActiveChatPartner: setRecipient, isChatMinimized, setIsChatMinimized } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [chatType, setChatType] = useState('mutual');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [partnerDetails, setPartnerDetails] = useState(null);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isChatMinimized) {
      markMessagesRead();
    }
  }, [isChatMinimized, markMessagesRead]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!recipient || !token) return;
      try {
        const response = await fetch(`${API_URL}/api/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const all = await response.json();
          const relevant = all.filter(m => 
            (m.sender.username.toLowerCase() === user.username.toLowerCase() && m.recipient.username.toLowerCase() === recipient.toLowerCase()) ||
            (m.sender.username.toLowerCase() === recipient.toLowerCase() && m.recipient.username.toLowerCase() === user.username.toLowerCase())
          );
          setMessages(relevant);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [user, recipient, token, API_URL]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!userSearchQuery.trim() || !token) {
        setAllUsers([]);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/users?search=${userSearchQuery}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAllUsers(data.filter(u => u.username.toLowerCase() !== user?.username.toLowerCase()));
        }
      } catch (error) {
        console.error("Error searching users:", error);
      }
    };
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery, user, token, API_URL]);

  useEffect(() => {
    if (recipient) {
      const fetchPartner = async () => {
        try {
          const response = await fetch(`${API_URL}/api/users/profile/${recipient}`);
          if (response.ok) {
            const data = await response.json();
            setPartnerDetails(data);
            const status = data.followers?.includes(user.id) && data.following?.includes(user.id);
            setChatType(status ? 'mutual' : 'request');
          }
        } catch (error) {
          console.error("Error fetching partner details:", error);
        }
      };
      fetchPartner();
      setShowUserList(false);
    }
  }, [recipient, user.id, API_URL]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatMinimized, recipient]);

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

  const clearMedia = () => {
    setSelectedMedia(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedMedia) || !recipient || !partnerDetails) return;

    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: partnerDetails.id || partnerDetails._id,
          text: inputText,
          media: selectedMedia,
          mediaType: mediaType
        })
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages([...messages, newMessage]);
        setInputText('');
        clearMedia();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const deleteMessage = (msgId) => {
    setMessages(messages.filter(m => m._id !== msgId));
  };

  if (!user) return null;

  return (
    <div className={`chat-widget ${isChatMinimized ? 'minimized' : 'expanded'}`}>
      <div className="chat-header" onClick={() => setIsChatMinimized(!isChatMinimized)}>
        {isChatMinimized ? (
          <Logo size="64px" className="minimized-logo-anim" />
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
              <MessageCircle size={20} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {chatType === 'request' ? 'Request' : 'Chat'} {recipient ? `- ${recipient}` : ''}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Minus size={18} />
            </div>
          </>
        )}
      </div>

      <div className={`chat-content-container ${isChatMinimized ? 'content-hidden' : 'content-visible'}`}>
        <div className="chat-selector" style={{ position: 'relative', padding: '10px', borderBottom: '1px solid var(--border-color)' }}>
          <div 
            className="search-bar-trigger"
            onClick={() => setShowUserList(!showUserList)}
          >
            <Search size={14} opacity={0.5} />
            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{recipient || 'Select user to chat...'}</span>
          </div>

          {showUserList && (
            <div className="user-search-dropdown card">
              <input 
                autoFocus
                className="input-field"
                placeholder="Search followers..." 
                style={{ marginBottom: '8px', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '15px' }}
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />
              {allUsers.length > 0 ? allUsers.map(u => (
                <div key={u._id || u.id} className="nav-btn" onClick={() => { setRecipient(u.username); setShowUserList(false); setUserSearchQuery(''); }} style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderRadius: '8px' }}>
                  <div className="post-avatar" style={{ width: '24px', height: '24px', fontSize: '0.7rem', backgroundColor: u.avatarColor, overflow: 'hidden' }}>
                    {u.profilePhoto ? <img src={u.profilePhoto} style={{width:'100%', height:'100%', objectFit: 'cover'}} alt="" /> : u.username[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{u.username}</span>
                </div>
              )) : <div style={{ padding: '15px', textAlign: 'center', opacity: 0.5, fontSize: '0.85rem' }}>No users found</div>}
            </div>
          )}
        </div>
        
        <div className="chat-body" style={{ flex: 1, backgroundColor: 'var(--bg-color)' }}>
          {recipient ? (
            messages.length > 0 ? (
              messages.map(msg => (
                <div key={msg._id} className={`chat-message ${msg.sender.username.toLowerCase() === user.username.toLowerCase() ? 'sent' : 'received'}`} style={{ position: 'relative' }}>
                  {msg.sender.username.toLowerCase() === user.username.toLowerCase() && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteMessage(msg._id); }} 
                      style={{ position: 'absolute', left: '-25px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3, color: 'var(--text-color)', background: 'none' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  {msg.text && <div style={{ marginBottom: msg.media ? '5px' : '0' }}>{msg.text}</div>}
                  {msg.media && (
                    msg.mediaType === 'image' ? (
                      <img src={msg.media} className="chat-message-media" alt="sent media" style={{ borderRadius: '8px' }} />
                    ) : (
                      <video src={msg.media} className="chat-message-media" controls style={{ borderRadius: '8px' }} />
                    )
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '40px', padding: '0 20px' }}>
                <MessageCircle size={32} style={{ marginBottom: '10px' }} />
                <p style={{ fontSize: '0.85rem' }}>No messages yet. Send a hello to {recipient}!</p>
              </div>
            )
          ) : (
            <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '40px', padding: '0 20px' }}>
              <Search size={32} style={{ marginBottom: '10px' }} />
              <p style={{ fontSize: '0.85rem' }}>Search for a friend to start a conversation</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form 
          className="chat-input-area" 
          onSubmit={handleSend} 
          style={{ flexDirection: 'column', padding: '12px', backgroundColor: 'var(--card-bg)', borderTop: '1px solid var(--border-color)' }}
        >
          {selectedMedia && (
            <div className="media-preview-container" style={{ margin: '0 0 10px 0', maxHeight: '120px', width: '100%', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <button type="button" className="remove-media" onClick={clearMedia} style={{ width: '24px', height: '24px', backgroundColor: 'rgba(0,0,0,0.7)' }}><X size={14} /></button>
              {mediaType === 'image' ? (
                <img src={selectedMedia} className="media-preview" style={{ maxHeight: '120px', borderRadius: '12px' }} alt="Preview" />
              ) : (
                <video src={selectedMedia} className="media-preview" style={{ maxHeight: '120px', borderRadius: '12px' }} />
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label className="file-input-label" style={{ padding: '8px', margin: 0 }}>
              <ImageIcon size={20} />
              <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileChange} ref={fileInputRef} />
            </label>
            <input 
              ref={inputRef}
              className="input-field" 
              placeholder="Type a message..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{ margin: 0, borderRadius: '20px', padding: '8px 15px' }}
            />
            <button 
              type="submit" 
              className="btn" 
              disabled={!inputText.trim() && !selectedMedia}
              style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, flexShrink: 0 }}
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWidget;
