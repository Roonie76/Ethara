import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  LogOut, 
  X 
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  function handleLogoutClick() {
    setShowLogoutConfirm(true);
  }

  function confirmLogout() {
    logout();
    navigate('/login');
    setShowLogoutConfirm(false);
  }

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="white" />
              <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6" />
              <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6" />
              <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.3" />
            </svg>
          </div>
          <span className="logo-name">Ethara</span>
          <button onClick={onClose} style={{ display: 'none', marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer' }} className="mobile-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Product</div>
          <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <LayoutDashboard size={15} /> Dashboard
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <FolderKanban size={15} /> Projects
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <CheckSquare size={15} /> Tasks
          </NavLink>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Team</div>
          <NavLink to="/members" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Users size={15} /> Team
          </NavLink>
        </div>

        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="avatar">{currentUser?.name?.slice(0, 2).toUpperCase() || 'JD'}</div>
            <div className="user-info">
              <div className="name">{currentUser?.name}</div>
              <div className="email">{currentUser?.role}</div>
            </div>
          </div>
          <button onClick={handleLogoutClick} className="nav-item" style={{ borderTop: '1px solid var(--gray-100)', borderRadius: 0, padding: '10px 16px' }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: '380px', width: '90%', padding: '24px' }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '8px' }}>Sign out?</div>
            <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '20px' }}>
              Are you sure you want to sign out? You will need to log in again to access your projects.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="btn-primary" style={{ background: 'var(--red)' }} onClick={confirmLogout}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
