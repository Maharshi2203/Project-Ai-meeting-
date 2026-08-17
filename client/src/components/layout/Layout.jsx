import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <div className="main-content">
        <Navbar toggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)} />
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
