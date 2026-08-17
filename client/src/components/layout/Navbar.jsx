import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { actionService } from '../../services/actionService';
import {
  Search,
  Bell,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  AlertTriangle,
  Clock,
  CheckCircle,
  Sparkles,
  Database,
  Cpu,
  Shield,
  LogOut,
  ChevronRight
} from 'lucide-react';

const Navbar = ({ toggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef(null);
  const settingsRef = useRef(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await actionService.getDashboardStats();
      const { recentActions, metrics } = res.data;

      const notifList = [];

      if (metrics.overdueActionItems > 0) {
        notifList.push({
          id: 'overdue-summary',
          title: `${metrics.overdueActionItems} Overdue Action Item${metrics.overdueActionItems > 1 ? 's' : ''}`,
          desc: 'Tasks have exceeded their scheduled due date.',
          type: 'overdue',
          link: '/actions?overdue=true'
        });
      }

      recentActions.slice(0, 5).forEach((action) => {
        const isOverdue = action.dueDate && new Date(action.dueDate) < new Date() && action.status !== 'Completed';
        notifList.push({
          id: action.id,
          title: action.task,
          desc: `Owner: ${action.owner || 'Unassigned'} • Due: ${action.dueDate ? new Date(action.dueDate).toLocaleDateString() : 'No date'}`,
          type: isOverdue ? 'overdue' : 'task',
          link: action.meetingId ? `/meetings/${action.meetingId}` : '/actions'
        });
      });

      setNotifications(notifList);
      setUnreadCount(metrics.overdueActionItems > 0 ? metrics.overdueActionItems : notifList.length > 0 ? 1 : 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/meetings?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/meetings');
    }
  };

  const handleNotificationClick = (link) => {
    setShowNotifications(false);
    setUnreadCount(0);
    navigate(link);
  };

  return (
    <header className="navbar">
      {/* Left side: Toggle button + optional Brand text when sidebar is closed */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <button
          className="navbar-icon-btn"
          onClick={toggleSidebar}
          title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          aria-label={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
        >
          <Menu size={18} />
        </button>

        {!sidebarOpen && (
          <div className="navbar-brand-mobile" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            <img
              src="/logo.png"
              alt="MeetingMind Logo"
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                objectFit: 'contain',
                boxShadow: '0 4px 12px var(--accent-glow)'
              }}
            />
            <span className="sidebar-logo-text" style={{ fontSize: '1.05rem' }}>MeetingMind</span>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="navbar-search">
        <Search size={16} className="navbar-search-icon" />
        <input
          type="text"
          placeholder="Search meetings, transcripts, actions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>

      {/* Right Actions */}
      <div className="navbar-actions">
        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="navbar-icon-btn"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark'
            ? <Sun size={18} style={{ color: '#fbbf24' }} />
            : <Moon size={18} style={{ color: '#6366f1' }} />
          }
        </button>

        {/* Notifications Button & Dropdown */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="navbar-icon-btn"
            title="Notifications"
            onClick={() => {
              setShowNotifications(prev => !prev);
              setShowSettings(false);
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--danger)',
                boxShadow: '0 0 0 2px var(--bg-secondary)'
              }} />
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              width: '350px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--card-shadow-hover)',
              overflow: 'hidden',
              zIndex: 1000,
              animation: 'fadeIn 0.2s ease'
            }}>
              <div style={{
                padding: '0.85rem 1.15rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-tertiary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={16} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => setUnreadCount(0)}
                    style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: '600' }}
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <CheckCircle size={28} style={{ color: 'var(--success)', marginBottom: '0.5rem', opacity: 0.8 }} />
                    <p style={{ margin: 0 }}>All caught up! No active notifications.</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item.link)}
                      style={{
                        padding: '0.85rem 1.15rem',
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start',
                        transition: 'background 0.15s ease',
                        backgroundColor: item.type === 'overdue' ? 'var(--danger-bg)' : 'transparent'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = item.type === 'overdue' ? 'var(--danger-bg)' : 'transparent'}
                    >
                      {item.type === 'overdue' ? (
                        <AlertTriangle size={18} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                      ) : (
                        <Clock size={18} style={{ color: 'var(--info)', flexShrink: 0, marginTop: '2px' }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{
                padding: '0.65rem 1.15rem',
                borderTop: '1px solid var(--border-color)',
                textAlign: 'center',
                backgroundColor: 'var(--bg-tertiary)'
              }}>
                <button
                  onClick={() => handleNotificationClick('/actions')}
                  style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <span>View Action Tracker</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings Button & Popover */}
        <div ref={settingsRef} style={{ position: 'relative' }}>
          <button
            className="navbar-icon-btn"
            title="Settings & System Diagnostics"
            onClick={() => {
              setShowSettings(prev => !prev);
              setShowNotifications(false);
            }}
          >
            <Settings size={18} />
          </button>

          {/* Settings Popover Panel */}
          {showSettings && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              width: '320px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--card-shadow-hover)',
              overflow: 'hidden',
              zIndex: 1000,
              animation: 'fadeIn 0.2s ease'
            }}>
              <div style={{
                padding: '0.85rem 1.15rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-tertiary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Settings size={16} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Settings & System</span>
                </div>
                <button onClick={() => setShowSettings(false)} style={{ color: 'var(--text-muted)' }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Profile Card */}
                <div style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    color: '#ffffff',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    boxShadow: '0 2px 8px var(--accent-glow)'
                  }}>
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.name || 'User'}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.email || 'user@example.com'}
                    </div>
                  </div>
                </div>

                {/* Appearance Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Appearance</span>
                  <button
                    onClick={toggleTheme}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '0.4rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    {theme === 'dark' ? <Sun size={14} style={{ color: '#fbbf24' }} /> : <Moon size={14} style={{ color: '#6366f1' }} />}
                    <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                  </button>
                </div>

                {/* System Info */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                  <div style={{ fontSize: '0.725rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                    System Architecture
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                        <Database size={14} style={{ color: 'var(--info)' }} />
                        <span>Database</span>
                      </span>
                      <span style={{ color: 'var(--success)', fontWeight: '600', fontSize: '0.775rem' }}>MySQL 8.0 Connected</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                        <Cpu size={14} style={{ color: 'var(--accent-primary)' }} />
                        <span>AI Engine</span>
                      </span>
                      <span style={{ color: 'var(--success)', fontWeight: '600', fontSize: '0.775rem' }}>Gemini Active</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                        <Shield size={14} style={{ color: 'var(--warning)' }} />
                        <span>Authentication</span>
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.775rem' }}>JWT Bearer</span>
                    </div>
                  </div>
                </div>

                {/* Sign Out */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      logout();
                      navigate('/login');
                    }}
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', color: 'var(--danger)', padding: '0.5rem', fontSize: '0.85rem', gap: '0.4rem' }}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
