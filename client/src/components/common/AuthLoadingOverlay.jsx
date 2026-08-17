import React from 'react';
import CustomSpinner from './CustomSpinner';

const AuthLoadingOverlay = ({ isOpen, title = "Authenticating...", subtitle = "Redirecting to your MeetingMind workspace..." }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(11, 15, 25, 0.82)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1.5rem',
      animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div className="card" style={{
        maxWidth: '400px',
        width: '100%',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        border: '1px solid var(--accent-light)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ marginBottom: '2.25rem', marginTop: '0.5rem', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CustomSpinner scale={1.6} />
        </div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.4rem', fontWeight: '700' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
};

export default AuthLoadingOverlay;
