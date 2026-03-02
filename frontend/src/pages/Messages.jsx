import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowDownLeft, ArrowUpRight, CheckCircle, ChevronLeft, Send, Trash2, Image as ImageIcon, X, CheckCheck } from 'lucide-react';

const Messages = () => {
  const { user, token, API_URL, activeChatPartner, setActiveChatPartner } = useAuth();
  const [activeTab, setActiveTab] = useState('regular'); // 'regular', 'received', 'sent'
  const [conversations, setConversations] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null); // This will be the full partner object
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const allMessages = await response.json();
        
        // Group by partner
        const groups = {};
        allMessages.forEach(m => {
          const partner = m.sender._id === user.id ? m.recipient : m.sender;
          const partnerId = partner._id;
          if (!groups[partnerId]) {
            groups[partnerId] = {
              partner,
              lastMessage: m,
              unreadCount: (!m.isSeen && m.recipient._id === user.id) ? 1 : 0,
              isAccepted: m.isAccepted
            };
          } else {
            groups[partnerId].lastMessage = m;
            if (!m.isSeen && m.recipient._id === user.id) {
              groups[partnerId].unreadCount++;
            }
            // A conversation is accepted if ANY message in it is marked accepted
            if (m.isAccepted) groups[partnerId].isAccepted = true;
          }
        });

        const summary = Object.values(groups).sort((a, b) => 
          new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
        );
        setConversations(summary);

        // If we have an activeChatPartner from Profile, find them
        if (activeChatPartner && !selectedPartner) {
          const found = summary.find(c => c.partner.username.toLowerCase() === activeChatPartner.toLowerCase());
          if (found) {
            setSelectedPartner(found.partner);
          } else {
            // New conversation starting
            const userRes = await fetch(`${API_URL}/api/users/profile/${activeChatPartner}`);
            if (userRes.ok) {
              const userData = await userRes.json();
              setSelectedPartner(userData);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, [token, API_URL, user.id, activeChatPartner, selectedPartner]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const fetchMessages = useCallback(async () => {
    if (!selectedPartner || !token) return;
    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const all = await response.json();
        const relevant = all.filter(m => 
          (m.sender._id === user.id && m.recipient._id === selectedPartner.id) ||
          (m.sender._id === selectedPartner.id && m.recipient._id === user.id)
        );
        setMessages(relevant);

        // Mark as seen
        if (relevant.some(m => !m.isSeen && m.recipient._id === user.id)) {
          await fetch(`${API_URL}/api/messages/seen/${selectedPartner.id}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          fetchConversations();
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [selectedPartner, token, API_URL, user.id, fetchConversations]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll for new messages
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedMedia) || !selectedPartner) return;

    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: selectedPartner.id || selectedPartner._id,
          text: inputText,
          media: selectedMedia,
          mediaType: mediaType
        })
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages([...messages, newMessage]);
        setInputText('');
        setSelectedMedia(null);
        setMediaType(null);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleAccept = async () => {
    if (!selectedPartner) return;
    try {
      const response = await fetch(`${API_URL}/api/messages/accept/${selectedPartner.id || selectedPartner._id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchMessages();
        fetchConversations();
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const regularChats = conversations.filter(c => c.isAccepted);
  const receivedRequests = conversations.filter(c => !c.isAccepted && c.lastMessage.sender._id !== user.id);
  const sentRequests = conversations.filter(c => !c.isAccepted && c.lastMessage.sender._id === user.id);

  const isConversationAccepted = conversations.find(c => c.partner._id === selectedPartner?.id || c.partner._id === selectedPartner?._id)?.isAccepted;

  const renderList = (list, emptyMsg) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
      {list.length > 0 ? list.map(c => (
        <div 
          key={c.partner._id} 
          onClick={() => setSelectedPartner(c.partner)} 
          className="card" 
          style={{ cursor: 'pointer', margin: 0, padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-color)', position: 'relative' }}
        >
          <div className="post-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem', backgroundColor: c.partner.avatarColor }}>
            {c.partner.profilePhoto ? <img src={c.partner.profilePhoto} style={{width:'100%', height:'100%', borderRadius:'50%'}} /> : c.partner.username[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>{c.partner.username}</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{new Date(c.lastMessage.timestamp).toLocaleDateString()}</span>
            </div>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {c.lastMessage.sender._id === user.id && <span style={{ fontSize: '0.7rem' }}>You: </span>}
              {c.lastMessage.text || (c.lastMessage.media ? `[${c.lastMessage.mediaType}]` : '')}
            </p>
          </div>
          {c.unreadCount > 0 && <div className="notification-dot" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }} />}
        </div>
      )) : (
        <div style={{ textAlign: 'center', padding: '30px', opacity: 0.5 }}>{emptyMsg}</div>
      )}
    </div>
  );

  return (
    <div className="main-content-wrapper" style={{ maxWidth: '800px' }}>
      <div className="card messages-card" style={{ display: 'flex', flexDirection: 'column', height: '600px', padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          {selectedPartner ? (
            <>
              <button onClick={() => setSelectedPartner(null)} className="nav-btn" style={{ padding: '5px', marginLeft: '-10px' }}>
                <ChevronLeft size={24} />
              </button>
              <Link to={`/profile/${selectedPartner.username}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
                <div className="post-avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem', backgroundColor: selectedPartner.avatarColor }}>
                  {selectedPartner.profilePhoto ? <img src={selectedPartner.profilePhoto} style={{width:'100%', height:'100%', borderRadius:'50%'}} /> : selectedPartner.username[0].toUpperCase()}
                </div>
                <span style={{ fontWeight: 'bold' }}>{selectedPartner.username}</span>
              </Link>
            </>
          ) : (
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Messages</h2>
          )}
        </div>

        {selectedPartner ? (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.length > 0 ? messages.map(msg => (
                <div key={msg._id} className={`chat-message ${msg.sender._id === user.id ? 'sent' : 'received'}`} style={{ position: 'relative' }}>
                  {msg.text && <div style={{ marginBottom: msg.media ? '5px' : '0' }}>{msg.text}</div>}
                  {msg.media && (
                    msg.mediaType === 'image' ? (
                      <img src={msg.media} style={{ maxWidth: '100%', borderRadius: '8px' }} alt="" />
                    ) : (
                      <video src={msg.media} style={{ maxWidth: '100%', borderRadius: '8px' }} controls />
                    )
                  )}
                  <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '4px', textAlign: msg.sender._id === user.id ? 'right' : 'left', display: 'flex', alignItems: 'center', justifyContent: msg.sender._id === user.id ? 'flex-end' : 'flex-start', gap: '4px' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.sender._id === user.id && (
                      <CheckCheck size={12} color={msg.isSeen ? 'var(--primary-color)' : 'currentColor'} />
                    )}
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '50px' }}>No messages yet.</div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Accept Request Bar */}
            {!isConversationAccepted && messages.length > 0 && messages[messages.length-1].sender._id !== user.id && (
              <div style={{ padding: '15px', backgroundColor: 'var(--card-bg)', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Accept message request from {selectedPartner.username}?</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button className="btn" onClick={handleAccept} style={{ padding: '8px 20px' }}>Accept</button>
                  <button className="btn btn-secondary" onClick={() => setSelectedPartner(null)} style={{ padding: '8px 20px' }}>Ignore</button>
                </div>
              </div>
            )}

            {/* Input Area */}
            {(isConversationAccepted || (messages.length > 0 && messages[messages.length-1].sender._id === user.id) || messages.length === 0) && (
              <form onSubmit={handleSend} style={{ padding: '15px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--card-bg)' }}>
                {selectedMedia && (
                  <div className="media-preview-container" style={{ margin: 0, maxHeight: '120px', width: 'fit-content', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <button type="button" className="remove-media" onClick={() => setSelectedMedia(null)} style={{ width: '24px', height: '24px' }}><X size={14} /></button>
                    {mediaType === 'image' ? <img src={selectedMedia} className="media-preview" style={{ maxHeight: '120px' }} alt="" /> : <video src={selectedMedia} className="media-preview" style={{ maxHeight: '120px' }} controls />}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="post-avatar" style={{ width: '36px', height: '36px', fontSize: '0.8rem', backgroundColor: user.avatarColor }}>
                    {user.profilePhoto ? <img src={user.profilePhoto} style={{width:'100%', height:'100%', objectFit: 'cover'}} alt="" /> : user.username[0].toUpperCase()}
                  </div>
                  
                  <label style={{ cursor: 'pointer', padding: '8px', borderRadius: '50%', transition: 'background 0.2s' }} className="nav-btn">
                    <ImageIcon size={22} color="var(--primary-color)" />
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setSelectedMedia(ev.target.result);
                        setMediaType(file.type.startsWith('video') ? 'video' : 'image');
                      };
                      reader.readAsDataURL(file);
                    }} />
                  </label>

                  <input 
                    className="chat-input input-field"
                    placeholder={!isConversationAccepted && messages.length > 0 ? "Wait for acceptance..." : "Type a message..."}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={!isConversationAccepted && messages.length > 0 && messages[messages.length-1].sender._id === user.id}
                    style={{ margin: 0, borderRadius: '25px', padding: '12px 20px', flex: 1 }}
                  />
                  
                  <button 
                    type="submit" 
                    className="btn" 
                    style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, flexShrink: 0 }} 
                    disabled={(!inputText.trim() && !selectedMedia) || (!isConversationAccepted && messages.length > 0 && messages[messages.length-1].sender._id === user.id)}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          /* List View */
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button className={`btn ${activeTab === 'regular' ? '' : 'btn-secondary'}`} onClick={() => setActiveTab('regular')} style={{ padding: '8px 12px', fontSize: '0.85rem' }} title="Regular Chats">
                <CheckCircle size={18} /> <span className="desktop-only">Regular</span>
              </button>
              <button className={`btn ${activeTab === 'received' ? '' : 'btn-secondary'}`} onClick={() => setActiveTab('received')} style={{ padding: '8px 12px', fontSize: '0.85rem' }} title="Received Requests">
                <ArrowDownLeft size={18} /> <span className="desktop-only">Received</span>
              </button>
              <button className={`btn ${activeTab === 'sent' ? '' : 'btn-secondary'}`} onClick={() => setActiveTab('sent')} style={{ padding: '8px 12px', fontSize: '0.85rem' }} title="Sent Requests">
                <ArrowUpRight size={18} /> <span className="desktop-only">Sent</span>
              </button>
            </div>

            {activeTab === 'regular' && renderList(regularChats, "No mutual conversations yet.")}
            {activeTab === 'received' && renderList(receivedRequests, "No message requests received.")}
            {activeTab === 'sent' && renderList(sentRequests, "You haven't sent any requests.")}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
