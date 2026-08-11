import React from 'react';
import { useLocation } from 'react-router-dom';

export default function Topbar() {
  const location = useLocation();
  
  let title = "Overview";
  let sub = "Welcome back, here's your book at a glance";
  
  if (location.pathname === '/customers') {
    title = "Customers";
    sub = "Your portfolio";
  } else if (location.pathname.startsWith('/customer-360')) {
    title = "Customer 360";
    sub = "Detailed view";
  } else if (location.pathname === '/g1') {
    title = "Credit Exposure Brief (G1)";
    sub = "AI-powered risk summary";
  } else if (location.pathname === '/g2') {
    title = "Loan Counselling Prep (G2)";
    sub = "Pre-meeting talk track generator";
  } else if (location.pathname === '/g3') {
    title = "Document Intelligence (G3)";
    sub = "Extract facts from loan artifacts";
  } else if (location.pathname === '/g4') {
    title = "Limit Increase Assistant (G4)";
    sub = "Deterministic decisioning with AI rationale";
  } else if (location.pathname === '/history') {
    title = "Analysis History";
    sub = "Past AI runs";
  } else if (location.pathname === '/settings') {
    title = "Settings";
    sub = "System configuration";
  }

  return (
    <div className="topbar">
      <div>
        <h1>{title}</h1>
        <div className="topbar-sub">{sub}</div>
      </div>
      <div className="breadcrumb"></div>
    </div>
  );
}
