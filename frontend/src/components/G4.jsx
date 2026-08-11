import React, { useState } from 'react';
import CustomerSelect from './CustomerSelect';
import { calcMetrics, riskEngine, decisionEngine, decisionLabel, decisionIcon, fmtINR, fmtPct, fmtX } from '../utils';
import { useCustomers } from '../context/CustomersContext';

export default function G4() {
  const { customers, loading } = useCustomers();
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState(500000);
  const [results, setResults] = useState(null);

  React.useEffect(() => {
    if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
    }
  }, [customers, customerId]);

  const handleRun = () => {
    const c = customers.find(c => c.id === customerId);
    const m = calcMetrics(c);
    const r = riskEngine(m);
    
    const mockPostIncrease = {
      ...c,
      creditLimit: c.creditLimit + amount
    };
    const mNew = calcMetrics(mockPostIncrease);
    const rNew = riskEngine(mNew);
    const dCode = decisionEngine(rNew.factors);

    setResults({ c, amount, mNew, rNew, dCode });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <div className="customer-select-row">
        <div className="field-row">
          <label>Customer</label>
          <CustomerSelect value={customerId} onChange={setCustomerId} />
        </div>
        <div className="field-row">
          <label>Requested Increase (₹)</label>
          <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} step="50000" />
        </div>
        <button className="btn btn-primary" onClick={handleRun}>Run Decision Engine</button>
      </div>

      {results && (
        <div id="g4Results">
          <div className="decision-banner" style={{
            background: results.dCode === 'ASK' ? 'var(--risk-low-bg)' : results.dCode === 'CONDITIONS' ? 'var(--risk-medium-bg)' : 'var(--risk-high-bg)',
            color: results.dCode === 'ASK' ? 'var(--risk-low)' : results.dCode === 'CONDITIONS' ? 'var(--risk-medium)' : 'var(--risk-high)'
          }}>
            <div className="decision-icon">{decisionIcon(results.dCode)}</div>
            <div>
              <div style={{fontWeight: 700, letterSpacing: '.05em', marginBottom: '2px'}}>DETERMINISTIC DECISION</div>
              <div style={{fontSize: '22px', fontWeight: 600, fontFamily: 'IBM Plex Mono'}}>{decisionLabel(results.dCode)}</div>
            </div>
          </div>

          <div className="grid cols-2" style={{marginTop: '16px'}}>
            <div className="card">
              <div className="card-title">Projected Profile (Post-Increase)</div>
              <div className="metric-grid">
                <div className="metric-box"><div className="label">New Limit</div><div className="value">{fmtINR(results.c.creditLimit + results.amount)}</div></div>
                <div className="metric-box"><div className="label">New Utilization</div><div className="value">{fmtPct(results.mNew.utilization)}</div></div>
                <div className="metric-box"><div className="label">Collateral</div><div className="value">{fmtINR(results.c.collateral)}</div></div>
                <div className="metric-box"><div className="label">Coverage</div><div className="value">{fmtX(results.mNew.coverage)}</div></div>
              </div>
            </div>
            <div className="card">
              <div className="card-title">Deterministic Factors</div>
              <div className="factor-list">
                <div className="factor-row"><span className="fname">Utilization</span><b>{results.rNew.factors.utilization}</b></div>
                <div className="factor-row"><span className="fname">Collateral coverage</span><b>{results.rNew.factors.collateral}</b></div>
                <div className="factor-row"><span className="fname">Income adequacy</span><b>{results.rNew.factors.income}</b></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
