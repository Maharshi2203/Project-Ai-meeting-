import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Search, Bell, Settings, Sun, Moon, Menu } from 'lucide-react';

const Navbar = ({ toggleMobileSidebar }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="navbar">
      {/* Mobile menu toggle */}
      <button
        className="mobile-menu-btn navbar-icon-btn"
        onClick={toggleMobileSidebar}
        style={{ display: 'none' }}
      >
        <Menu size={18} />
      </button>

      {/* Search bar */}
      <div className="navbar-search">
        <Search size={15} className="navbar-search-icon" />
        <input
          type="text"
          placeholder="Search meetings, transcripts..."
          style={{ paddingLeft: '2.25rem' }}
        />
      </div>

      {/* Right actions */}
      <div className="navbar-actions">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="navbar-icon-btn"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark'
            ? <Sun size={17} style={{ color: '#fbbf24' }} />
            : <Moon size={17} style={{ color: '#6366f1' }} />
          }
        </button>

        {/* Bell */}
        <button className="navbar-icon-btn" title="Notifications">
          <Bell size={17} />
        </button>

        {/* Settings */}
        <button className="navbar-icon-btn" title="Settings">
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
