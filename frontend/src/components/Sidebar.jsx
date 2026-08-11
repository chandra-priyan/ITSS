import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export default function Sidebar({ onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">M</div>
        <div>
          <div className="brand-name">Meridian</div>
          <div className="brand-sub">Banking AI</div>
        </div>
      </div>

      <NavLink to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}><span className="dot"></span> Overview</NavLink>
      <NavLink to="/customers" className={`nav-item ${isActive('/customers') ? 'active' : ''}`}><span className="dot"></span> Customers</NavLink>

      <div className="nav-group-label">AI Modules</div>
      <NavLink to="/g1" className={`nav-item ${isActive('/g1') ? 'active' : ''}`}><span className="dot"></span> Credit Exposure — G1</NavLink>
      <NavLink to="/g2" className={`nav-item ${isActive('/g2') ? 'active' : ''}`}><span className="dot"></span> Loan Counselling — G2</NavLink>
      <NavLink to="/g3" className={`nav-item ${isActive('/g3') ? 'active' : ''}`}><span className="dot"></span> Document Intelligence — G3</NavLink>
      <NavLink to="/g4" className={`nav-item ${isActive('/g4') ? 'active' : ''}`}><span className="dot"></span> Limit Increase — G4</NavLink>

      <div className="nav-group-label">Records</div>
      <NavLink to="/history" className={`nav-item ${isActive('/history') ? 'active' : ''}`}><span className="dot"></span> Analysis History</NavLink>
      <NavLink to="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`}><span className="dot"></span> Settings</NavLink>

      <div className="sidebar-foot">
        <div className="rm-chip">
          <div className="rm-avatar">RK</div>
          <div>
            <div className="rm-name">Ramesh Krishnan</div>
            <div className="rm-role">Relationship Manager</div>
          </div>
        </div>
        <span className="logout-link" onClick={onLogout}>Sign out</span>
      </div>
    </aside>
  );
}
