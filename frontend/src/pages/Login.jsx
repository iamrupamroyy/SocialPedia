import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Zap, Globe, MessageSquare, ArrowLeft, Mail, Lock, User, Eye, EyeOff, Info } from 'lucide-react';
import Logo from '../components/Logo';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const { login, register, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isForgotMode) {
      const res = await resetPassword(username);
      if (res.success) {
        setSuccessMsg(res.message);
        setIsForgotMode(false);
      } else {
        setError(res.message);
      }
      return;
    }

    if (isRegistering) {
      const res = await register(username, email, password);
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

      <div className="login-form-section">
        <div className="card login-card-v3">
          <div className="mobile-only" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
            <h1 style={{ color: 'var(--primary-color)', fontSize: '2.8rem', display: 'flex', alignItems: 'center', gap: '0', fontWeight: '900' }}>
              <span>S</span>
              <Logo size="48px" style={{ margin: '0 -8px' }} />
              <span>cialPedia</span>
            </h1>
          </div>

          {!isForgotMode && (
            <div className="auth-tabs">
              <button className={`auth-tab ${!isRegistering ? 'active' : ''}`} onClick={() => { setIsRegistering(false); setError(''); setSuccessMsg(''); }}>Log In</button>
              <button className={`auth-tab ${isRegistering ? 'active' : ''}`} onClick={() => { setIsRegistering(true); setError(''); setSuccessMsg(''); }}>Register</button>
            </div>
          )}
          
          {isForgotMode && (
            <button onClick={() => setIsForgotMode(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '25px', color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '0.9rem' }}>
              <ArrowLeft size={18} /> Back to Login
            </button>
          )}

          <h2 style={{ marginBottom: '10px', fontSize: '1.6rem', fontWeight: '800' }}>
            {isForgotMode ? 'Account Recovery' : isRegistering ? 'Create Account' : 'Welcome Back'}
          </h2>
          
          {error && <div style={{ backgroundColor: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', padding: '14px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem', border: '1px solid rgba(255, 77, 77, 0.2)', textAlign: 'left' }}>{error}</div>}
          {successMsg && <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '14px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'left' }}>{successMsg}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="auth-input-group">
              <label><User size={14} style={{marginRight:'5px'}}/> Username</label>
              <input className="auth-input-field" type="text" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>

            {isRegistering && (
              <div className="auth-input-group">
                <label><Mail size={14} style={{marginRight:'5px'}}/> Email (Optional)</label>
                <input className="auth-input-field" type="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                <p style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Info size={10} /> Email verification is currently under development.
                </p>
              </div>
            )}
            
            {!isForgotMode && (
              <div className="auth-input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ margin: 0 }}><Lock size={14} style={{marginRight:'5px'}}/> Password</label>
                  {!isRegistering && <button type="button" onClick={() => setIsForgotMode(true)} style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: '700' }}>Forgot?</button>}
                </div>
                <div style={{ position: 'relative' }}>
                  <input className="auth-input-field" type={showPassword ? "text" : "password"} placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="btn" style={{ width: '100%', padding: '16px', marginTop: '10px', fontSize: '1.1rem', borderRadius: '14px' }}>
              {isForgotMode ? 'Send My Password' : isRegistering ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p style={{ marginTop: '35px', fontSize: '0.85rem', opacity: 0.5, textAlign: 'center', width: '100%', fontWeight: '600' }}>
            &copy; 2026 - Present. All rights reserved to Rupam Roy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
