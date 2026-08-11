import React from 'react';

export default function Login({ onLogin }) {
  return (
    <div id="loginScreen">
      <div className="login-card">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <div className="brand-name">Meridian</div>
            <div className="brand-sub">Banking AI Platform</div>
          </div>
        </div>
        <div className="login-title">Relationship Manager Portal</div>
        <div className="login-desc">Sign in to access your customer book, credit briefs and decision tools.</div>
        <div id="loginForm">
          <div className="field">
            <label htmlFor="loginEmail">Work email</label>
            <input id="loginEmail" type="text" defaultValue="r.krishnan@meridianbank.demo" required />
          </div>
          <div className="field">
            <label htmlFor="loginPass">Password</label>
            <input id="loginPass" type="password" defaultValue="••••••••" required />
          </div>
          <button type="button" onClick={onLogin} className="btn btn-primary">Sign in</button>
        </div>
        <div className="login-hint">Demo build — any credentials will sign you in.</div>
      </div>
    </div>
  );
}
