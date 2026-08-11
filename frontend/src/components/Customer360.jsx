import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { calcMetrics, riskEngine, badgeClass, fmtINR } from '../utils';

export default function Customer360() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await api.getCustomer360(id);
        setCustomer(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!customer) return <div>Customer not found</div>;

  const m = calcMetrics(customer);
  const r = riskEngine(m);
  const prevAnalyses = customer.history || [];

  return (
    <>
      <div className="card" style={{marginBottom: '18px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px'}}>
          <div>
            <h2 style={{fontSize: '20px'}}>{customer.name}</h2>
            <div style={{color: 'var(--text-400)', fontSize: '12.5px', marginTop: '3px'}}>
              <span className={`status-dot ${customer.status === 'Active' ? 'status-active' : 'status-dormant'}`}></span>
              {customer.status} &middot; Customer {customer.id}
            </div>
          </div>
          <span className={`badge ${badgeClass(r.level)}`}>{r.level} RISK</span>
        </div>
        
        <div className="grid cols-3">
          <div className="metric-box"><div className="label">Income</div><div className="value">{fmtINR(customer.income)}</div></div>
          <div className="metric-box"><div className="label">Total Exposure</div><div className="value">{fmtINR(m.totalExposure)}</div></div>
          <div className="metric-box"><div className="label">Risk Score</div><div className="value">{r.score} / 100</div></div>
        </div>
        <div className="divider"></div>
        <div className="grid cols-4">
          <div className="metric-box"><div className="label">Credit Limit</div><div className="value">{fmtINR(customer.creditLimit)}</div></div>
          <div className="metric-box"><div className="label">Outstanding</div><div className="value">{fmtINR(customer.outstanding)}</div></div>
          <div className="metric-box"><div className="label">Collateral</div><div className="value">{fmtINR(customer.collateral)}</div></div>
          <div className="metric-box"><div className="label">Existing Loan</div><div className="value">{fmtINR(customer.existingLoan)}</div></div>
        </div>
      </div>

      <div className="section-title">AI Tools</div>
      <div className="grid cols-4" style={{marginBottom: '8px'}}>
        <div className="module-card" onClick={() => navigate('/g1')}><h3>Credit Brief</h3><p>G1 risk analysis</p></div>
        <div className="module-card" onClick={() => navigate('/g2')}><h3>Counselling Prep</h3><p>G2 meeting prep</p></div>
        <div className="module-card" onClick={() => navigate('/g3')}><h3>Documents</h3><p>G3 extraction</p></div>
        <div className="module-card" onClick={() => navigate('/g4')}><h3>Limit Increase</h3><p>G4 decision</p></div>
      </div>

      <div className="section-title">Previous Analyses</div>
      <div className="card" style={{padding: '6px 8px'}}>
        {prevAnalyses.length ? (
          <table>
            <thead><tr><th>Date</th><th>Module</th><th>Result</th></tr></thead>
            <tbody>
              {prevAnalyses.map((h, i) => (
                <tr key={i}><td className="mono">{h.date}</td><td>{h.module}</td><td>{h.result}</td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state"><div className="glyph">◌</div>No analyses recorded yet for this customer.</div>
        )}
      </div>
    </>
  );
}
