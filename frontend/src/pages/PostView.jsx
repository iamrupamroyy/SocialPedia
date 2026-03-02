import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Post from '../components/Post';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCcw, ArrowLeft } from 'lucide-react';

const PostView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, API_URL } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`${API_URL}/api/posts/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setPost(data);
        } else {
          setError("Post not found or unavailable.");
        }
      } catch (err) {
        setError("Error loading post.");
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchPost();
    }
  }, [id, token, API_URL]);

  const handlePostUpdate = (updated) => {
    setPost(updated);
  };

  const handlePostDelete = () => {
    navigate('/');
  };

  return (
    <div className="main-content-wrapper" style={{ maxWidth: '700px' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', marginBottom: '20px', padding: 0, opacity: 0.7 }}
      >
        <ArrowLeft size={20} />
        Back
      </button>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <RefreshCcw className="spin" size={40} color="var(--primary-color)" />
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>{error}</p>
          <button className="btn" onClick={() => navigate('/')} style={{ marginTop: '20px' }}>Go to Timeline</button>
        </div>
      ) : (
        <Post 
          post={post} 
          onPostUpdate={handlePostUpdate} 
          onPostDelete={handlePostDelete} 
          isHighlighted={true}
        />
      )}
    </div>
  );
};

export default PostView;
