import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, LogIn, ShieldCheck, Zap, Globe, MessageSquare, Heart, Share2 } from 'lucide-react';
import Logo from '../components/Logo';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      const res = await register(username, password);
      if (res.success) navigate('/');
      else setError(res.message);
    } else {
      const res = await login(username, password);
      if (res.success) navigate('/');
      else setError(res.message);
    }
  };

  return (
    <div className="login-page">
      {/* Visual Section */}
      <div className="login-visual-section desktop-only">
        <div className="login-visual-content">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            <span style={{color:'white'}}>S</span>
            <Logo size="100px" style={{ margin: '0 -18px' }} />
            <span style={{color:'white'}}>cialPedia</span>
          </h1>
          <p>The next generation social network. Connect, share, and engage with your community like never before.</p>
          
          <div className="feature-grid">
            <div className="feature-card">
              <h3><Zap size={20} color="#fbbf24" /> Real-time</h3>
              <p>Instant messaging and updates across the platform.</p>
            </div>
            <div className="feature-card">
              <h3><ShieldCheck size={20} color="#10b981" /> Secure</h3>
              <p>Your data is encrypted and protected with industry standards.</p>
            </div>
            <div className="feature-card">
              <h3><Globe size={20} color="#3b82f6" /> Global</h3>
              <p>Connect with people from all around the world.</p>
            </div>
            <div className="feature-card">
              <h3><MessageSquare size={20} color="#ec4899" /> Interactive</h3>
              <p>Deep engagement with threaded comments and mentions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="login-form-section">
        <div className="card login-card-v3">
          <div className="mobile-only" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
            <h1 style={{ color: 'var(--primary-color)', fontSize: '2.8rem', display: 'flex', alignItems: 'center', gap: '0', fontWeight: '900' }}>
              <span>S</span>
              <Logo size="48px" style={{ margin: '0 -8px' }} />
              <span>cialPedia</span>
            </h1>
          </div>

          <div className="auth-tabs">
            <button 
              className={`auth-tab ${!isRegistering ? 'active' : ''}`} 
              onClick={() => { setIsRegistering(false); setError(''); }}
            >
              Log In
            </button>
            <button 
              className={`auth-tab ${isRegistering ? 'active' : ''}`} 
              onClick={() => { setIsRegistering(true); setError(''); }}
            >
              Register
            </button>
          </div>
          
          {error && (
            <div style={{ backgroundColor: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.9rem', border: '1px solid rgba(255, 77, 77, 0.2)', textAlign: 'left' }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Username</label>
              <input
                className="input-field"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="input-group">
              <label>Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn" style={{ width: '100%', padding: '16px', marginTop: '10px', fontSize: '1.1rem' }}>
              {isRegistering ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p style={{ marginTop: '40px', fontSize: '0.85rem', opacity: 0.5, textAlign: 'center', width: '100%', fontWeight: '500' }}>
            &copy; 2026 - Present. All rights reserved to Rupam Roy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
