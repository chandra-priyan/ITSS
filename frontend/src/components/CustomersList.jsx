import React from 'react';
import { useNavigate } from 'react-router-dom';
import { calcMetrics, riskEngine, badgeClass, fmtINR } from '../utils';
import { useCustomers } from '../context/CustomersContext';

export default function CustomersList() {
  const navigate = useNavigate();
  const { customers, loading } = useCustomers();

  if (loading) return <div>Loading...</div>;

  return (
    <div className="card" style={{padding: '6px 8px'}}>
      <table>
        <thead>
          <tr><th>Customer</th><th>ID</th><th>Credit Limit</th><th>Outstanding</th><th>Risk</th><th>Status</th></tr>
        </thead>
        <tbody>
          {customers.map(c => {
            const r = riskEngine(calcMetrics(c));
            return (
              <tr key={c.id} className="row-link" onClick={() => navigate(`/customer-360/${c.id}`)}>
                <td>{c.name}</td>
                <td className="mono">{c.id}</td>
                <td className="mono">{fmtINR(c.creditLimit)}</td>
                <td className="mono">{fmtINR(c.outstanding)}</td>
                <td><span className={`badge ${badgeClass(r.level)}`}>{r.level}</span></td>
                <td><span className={`status-dot ${c.status === 'Active' ? 'status-active' : 'status-dormant'}`}></span>{c.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
