import React from 'react';
import { useNavigate } from 'react-router-dom';
import { calcMetrics, riskEngine, badgeClass } from '../utils';
import { useCustomers } from '../context/CustomersContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { customers, loading } = useCustomers();
  const history = []; // TODO: fetch history if needed globally
  
  if (loading) return <div>Loading...</div>;
  
  const totalCustomers = customers.length;
  const totalAnalyses = history.length;
  const highRisk = customers.filter(c => riskEngine(calcMetrics(c)).level === 'HIGH').length;
  const recentCustomers = customers.slice(0, 5);

  const modules = [
    {code:'G1', color:'linear-gradient(135deg,#1D6FA5,#0F2941)', title:'Credit Exposure Brief', desc:'Utilization, collateral coverage and a rule-based risk score, explained by AI.', view:'/g1'},
    {code:'G2', color:'linear-gradient(135deg,#C8963E,#8A611F)', title:'Loan Counselling Prep', desc:'Talking points and a document checklist retrieved from policy, ahead of the meeting.', view:'/g2'},
    {code:'G3', color:'linear-gradient(135deg,#1E8E5A,#0F2941)', title:'Document Intelligence', desc:'Extract structured facts and a summary from a loan application document.', view:'/g3'},
    {code:'G4', color:'linear-gradient(135deg,#C0392B,#0F2941)', title:'Limit Increase Assistant', desc:'ASK / CONDITIONS / HOLD decision from a deterministic engine, explained by AI.', view:'/g4'},
  ];

  return (
    <>
      <div className="grid cols-4" style={{marginBottom: '22px'}}>
        <div className="card stat-card"><div className="stat-label">Customers in book</div><div className="stat-value">{totalCustomers}</div></div>
        <div className="card stat-card"><div className="stat-label">Analyses run</div><div className="stat-value">{totalAnalyses}</div></div>
        <div className="card stat-card"><div className="stat-label">High risk accounts</div><div className="stat-value" style={{color: 'var(--risk-high)'}}>{highRisk}</div></div>
        <div className="card stat-card"><div className="stat-label">Active modules</div><div className="stat-value">4</div></div>
      </div>

      <div className="section-title">AI Modules</div>
      <div className="grid cols-4" style={{marginBottom: '8px'}}>
        {modules.map(m => (
          <div key={m.code} className="module-card" onClick={() => navigate(m.view)}>
            <div className="module-tag" style={{background: m.color}}>{m.code}</div>
            <h3>{m.title}</h3>
            <p>{m.desc}</p>
          </div>
        ))}
      </div>

      <div className="section-title">Recent Customer Activity</div>
      <div className="card" style={{padding: '6px 8px'}}>
        <table>
          <thead>
            <tr><th>Customer</th><th>ID</th><th>Risk</th><th>Status</th></tr>
          </thead>
          <tbody>
            {recentCustomers.map(c => {
              const r = riskEngine(calcMetrics(c));
              return (
                <tr key={c.id} className="row-link" onClick={() => navigate(`/customer-360/${c.id}`)}>
                  <td>{c.name}</td>
                  <td className="mono">{c.id}</td>
                  <td><span className={`badge ${badgeClass(r.level)}`}>{r.level}</span></td>
                  <td><span className={`status-dot ${c.status === 'Active' ? 'status-active' : 'status-dormant'}`}></span>{c.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
