import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, CheckSquare, PlusCircle, Sparkles, X } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Meetings', path: '/meetings', icon: FileText },
    { label: 'Action Tracker', path: '/actions', icon: CheckSquare }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 140
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 150,
        transition: 'transform 0.3s ease'
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px var(--accent-glow)'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                MeetingMind
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--accent-primary)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                AI Tracker
              </div>
            </div>
          </div>

          <button onClick={onClose} className="mobile-close-btn" style={{ display: 'none', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Action Button */}
        <div style={{ padding: '1.25rem 1.25rem 0.5rem 1.25rem' }}>
          <NavLink
            to="/meetings/new"
            onClick={onClose}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
          >
            <PlusCircle size={18} />
            <span>New Meeting</span>
          </NavLink>
        </div>

        {/* Nav Links */}
        <nav style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '0.925rem',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                  transition: 'all 0.2s ease'
                })}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info badge */}
        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.775rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Post-Meeting AI Intelligence v1.0
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
