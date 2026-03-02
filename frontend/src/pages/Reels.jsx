import React from 'react';
import { Hammer } from 'lucide-react';

const Reels = () => {
  return (
    <div className="main-content-wrapper" style={{ maxWidth: '800px' }}>
      <div className="card" style={{ textAlign: 'center', padding: '100px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{ backgroundColor: 'var(--bg-color)', padding: '30px', borderRadius: '50%' }}>
          <Hammer size={60} color="var(--primary-color)" />
        </div>
        <h2 style={{ fontSize: '2rem' }}>Reels is Under Development</h2>
        <p style={{ opacity: 0.6, maxWidth: '400px' }}>
          We're working hard to bring you a short-form video experience. Stay tuned for updates!
        </p>
        <div className="btn" style={{ cursor: 'default' }}>Coming Soon</div>
      </div>
    </div>
  );
};

export default Reels;
