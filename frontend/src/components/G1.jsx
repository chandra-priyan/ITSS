import React, { useState } from 'react';
import axios from 'axios';
import CustomerSelect from './CustomerSelect';
import { fmtINR, fmtPct, fmtX } from '../utils';
import { useCustomers } from '../context/CustomersContext';
import Gauge from './Gauge';

export default function G1() {
  const { customers, loading } = useCustomers();
  const [customerId, setCustomerId] = useState('');
  const [results, setResults] = useState(null);
  
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Set initial customer ID once data loads
  React.useEffect(() => {
    if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
    }
  }, [customers, customerId]);

  const handleRun = async () => {
    if (!customerId) return;
    
    // Clear previous results/errors
    setResults(null);
    setAiError(null);
    setIsGeneratingAI(true);
    
    try {
      const response = await axios.post(`http://localhost:3001/api/ai/g1/${customerId}`);
      if (response.data.success) {
        setResults(response.data);
      } else {
        setAiError(response.data.message || 'Unable to connect to AI service.');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setAiError(err.response.data.message);
      } else {
        setAiError('Unable to connect to AI service. Please try again.');
      }
    } finally {
      setIsGeneratingAI(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <div className="customer-select-row">
        <div className="field-row">
          <label>Customer</label>
          <CustomerSelect value={customerId} onChange={setCustomerId} />
        </div>
        <button className="btn btn-primary" onClick={handleRun} disabled={isGeneratingAI}>
          {isGeneratingAI ? 'Generating...' : 'Generate Credit Brief'}
        </button>
      </div>
      
      {isGeneratingAI && (
        <div className="ai-panel">
          <div className="loading-line">
            <span className="spinner"></span> Generating AI Risk Brief...
          </div>
        </div>
      )}

      {aiError && (
        <div className="card" style={{borderColor: 'var(--risk-high)', marginBottom: '16px'}}>
          <div style={{color: 'var(--risk-high)', fontWeight: 'bold'}}>Error</div>
          <div>{aiError}</div>
        </div>
      )}

      {results && results.success && (
        <div id="g1Results">
          <div className="grid cols-2" style={{alignItems: 'start', marginBottom: '16px'}}>
            <div className="card">
              <div className="card-title">Exposure Overview</div>
              <div className="metric-grid">
                <div className="metric-box"><div className="label">Credit Limit</div><div className="value">{fmtINR(results.financialFacts.creditLimit)}</div></div>
                <div className="metric-box"><div className="label">Outstanding</div><div className="value">{fmtINR(results.financialFacts.outstanding)}</div></div>
                <div className="metric-box"><div className="label">Utilization</div><div className="value">{fmtPct(results.financialFacts.utilizationPct)}</div></div>
                <div className="metric-box"><div className="label">Collateral</div><div className="value">{fmtINR(results.financialFacts.collateralValue)}</div></div>
                <div className="metric-box"><div className="label">Coverage</div><div className="value">{fmtX(results.financialFacts.collateralCoverage)}</div></div>
                <div className="metric-box"><div className="label">Income</div><div className="value">{fmtINR(results.financialFacts.annualIncome)}</div></div>
              </div>
            </div>
            <div className="card">
              <div className="card-title">Risk Assessment</div>
              <div className="gauge-wrap"><Gauge score={results.risk.score} level={results.risk.level} /></div>
              <div className="factor-list">
                {results.risk.factors.map((factor, idx) => {
                  const parts = factor.split(' is ');
                  if (parts.length === 2) {
                    return (
                      <div className="factor-row" key={idx}>
                        <span className="fname">{parts[0]}</span>
                        <b>{parts[1]}</b>
                      </div>
                    );
                  }
                  return (
                    <div className="factor-row" key={idx}>
                      <span className="fname">{factor}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="section-title">AI Risk Brief</div>
          
          {results.aiBrief ? (
            <>
              <div className="ai-panel" id="g1AiPanel">
                <div className="ai-panel-head"><span className="ai-dot"></span><span className="ai-panel-label">AI-generated</span></div>
                <p className="ai-summary-text">{results.aiBrief.summary}</p>
              </div>
              <div className="grid cols-2" style={{marginTop: '16px', alignItems: 'start'}}>
                <div className="card">
                  <div className="card-title">Key Findings</div>
                  <ul className="findings-list">
                    {results.aiBrief.keyFindings.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
                <div className="card" style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  <div>
                    <div className="card-title">Recommended Actions</div>
                    <ul className="checklist">
                      {results.aiBrief.recommendedActions.map((r, i) => (
                        <li key={i}><span className="check-yes">✓</span>{r}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="card-title">Open Questions</div>
                    <ul className="qa-list">
                      {results.aiBrief.openQuestions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card">
              <p>AI brief could not be generated. Your deterministic financial analysis is still available above.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
