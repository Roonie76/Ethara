import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const { currentUser } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!currentUser) return <Navigate to="/login" replace />;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="dashboard-container">
      <div className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} onClick={() => setIsSidebarOpen(false)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="main-content">
        {/* Mobile Header Toggle */}
        <div className="mobile-menu-toggle" style={{ display: 'none', padding: '12px 16px', background: '#fff', borderBottom: '1px solid var(--gray-200)', alignItems: 'center' }}>
          <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <Menu size={24} color="var(--gray-800)" />
          </button>
          <span style={{ marginLeft: '12px', fontWeight: '600', fontSize: '15px' }}>Ethara</span>
        </div>

        <Outlet />
      </main>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-toggle {
            display: flex !important;
          }
          .main-content {
            overflow-x: hidden;
          }
        }

        @media (max-width: 480px) {
          .mobile-menu-toggle {
            padding: 10px 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
