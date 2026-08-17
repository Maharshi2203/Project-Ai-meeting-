import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, CheckSquare, Sparkles, X, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Meetings', path: '/meetings', icon: FileText },
    { label: 'Action Tracker', path: '/actions', icon: CheckSquare }
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 140
          }}
        />
      )}

      <aside className={`sidebar ${!isOpen ? 'closed' : 'open'}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <img
            src="/logo.png"
            alt="MeetingMind Logo"
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              objectFit: 'contain',
              boxShadow: '0 4px 12px var(--accent-glow)'
            }}
          />
          <span className="sidebar-logo-text">MeetingMind</span>
          <button
            onClick={onClose}
            className="sidebar-close-btn navbar-icon-btn"
            title="Close Sidebar"
            style={{ marginLeft: 'auto', display: 'none' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <div style={{
            fontSize: '0.7rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            padding: '0.5rem 0.95rem 0.25rem 0.95rem'
          }}>
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user-avatar">
            {getInitials(user?.name)}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-role">Account Owner</div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              color: 'var(--text-muted)',
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--danger)';
              e.currentTarget.style.backgroundColor = 'var(--danger-bg)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
