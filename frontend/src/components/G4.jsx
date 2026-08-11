import React, { useState } from 'react';
import axios from 'axios';
import CustomerSelect from './CustomerSelect';
import { useCustomers } from '../context/CustomersContext';
import { decisionIcon, decisionLabel, fmtINR, fmtPct, fmtX } from '../utils';

export default function G4() {
  const { customers, loading } = useCustomers();
  const [customerId, setCustomerId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
    }
  }, [customers, customerId]);

  const handleRun = async () => {
    if (!customerId) return;
    setError(null);
    setIsProcessing(true);
    setResults(null);

    try {
      const response = await axios.post(`http://localhost:3001/api/ai/g4/${customerId}`);
      setResults(response.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('An unexpected error occurred during limit decision generation.');
      }
    } finally {
      setIsProcessing(false);
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
        <button 
          className="btn btn-primary" 
          onClick={handleRun}
          disabled={isProcessing}
        >
          {isProcessing ? 'Analyzing Limit Increase...' : 'Analyze Limit Increase'}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '8px', border: '1px solid #ef9a9a' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {results && (
        <div id="g4Results" style={{ marginTop: '24px' }}>
          <div className="decision-banner" style={{
            background: results.decision.result === 'ASK' ? 'var(--risk-low-bg)' : results.decision.result === 'ASK_WITH_CONDITIONS' ? 'var(--risk-medium-bg)' : 'var(--risk-high-bg)',
            color: results.decision.result === 'ASK' ? 'var(--risk-low)' : results.decision.result === 'ASK_WITH_CONDITIONS' ? 'var(--risk-medium)' : 'var(--risk-high)'
          }}>
            <div className="decision-icon">{decisionIcon(results.decision.result)}</div>
            <div>
              <div style={{fontWeight: 700, letterSpacing: '.05em', marginBottom: '2px'}}>DETERMINISTIC DECISION</div>
              <div style={{fontSize: '22px', fontWeight: 600, fontFamily: 'IBM Plex Mono'}}>
                {results.decision.result === 'ASK_WITH_CONDITIONS' ? 'ASK WITH CONDITIONS' : results.decision.result.replace('_', ' ')}
              </div>
            </div>
          </div>

          <div className="grid cols-2" style={{marginTop: '24px'}}>
            <div className="card">
              <div className="card-title">Current Exposure</div>
              <div className="metric-grid">
                <div className="metric-box"><div className="label">Credit Limit</div><div className="value">{fmtINR(results.financialFacts.creditLimit)}</div></div>
                <div className="metric-box"><div className="label">Outstanding</div><div className="value">{fmtINR(results.financialFacts.outstanding)}</div></div>
                <div className="metric-box"><div className="label">Utilization</div><div className="value">{fmtPct(results.financialFacts.utilizationPct)}</div></div>
                <div className="metric-box"><div className="label">Available Credit</div><div className="value">{fmtINR(results.financialFacts.availableCredit)}</div></div>
                <div className="metric-box"><div className="label">Collateral</div><div className="value">{fmtINR(results.financialFacts.collateralValue)}</div></div>
                <div className="metric-box"><div className="label">Coverage</div><div className="value">{fmtX(results.financialFacts.collateralCoverage)}</div></div>
                <div className="metric-box"><div className="label">Annual Income</div><div className="value">{fmtINR(results.financialFacts.annualIncome)}</div></div>
                <div className="metric-box"><div className="label">Existing Exposure</div><div className="value">{fmtINR(results.financialFacts.existingLoanExposure)}</div></div>
              </div>
            </div>
            
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div className="card-title" style={{ marginBottom: '8px' }}>Why? (Deterministic Factors)</div>
                <div className="factor-list">
                  {results.decision.factors && results.decision.factors.map((f, i) => (
                    <div className="factor-row" key={i}>
                      <span className="fname">{f.factor}: {f.value}</span>
                      <b style={{ 
                        color: f.impact === 'POSITIVE' ? '#2e7d32' : f.impact === 'CAUTION' ? '#f57c00' : '#c62828',
                        fontSize: '0.85em'
                      }}>→ {f.impact}</b>
                      <div style={{ width: '100%', fontSize: '0.9em', color: '#666', marginTop: '4px' }}>{f.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '24px' }}>
            <div className="card-title">AI Explanation</div>
            {results.aiErrorMsg ? (
              <div style={{ color: '#d32f2f', padding: '12px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
                {results.aiErrorMsg}
              </div>
            ) : results.aiExplanation ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {results.aiExplanation.summary && (
                  <p style={{ margin: 0, lineHeight: 1.5, fontSize: '1.05em' }}>{results.aiExplanation.summary}</p>
                )}
                
                {results.aiExplanation.reasoning && results.aiExplanation.reasoning.length > 0 && (
                  <div>
                    <strong style={{ display: 'block', color: '#1a237e', marginBottom: '8px' }}>Reasoning</strong>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {results.aiExplanation.reasoning.map((item, i) => <li key={i} style={{marginBottom: '4px'}}>{item}</li>)}
                    </ul>
                  </div>
                )}

                {results.aiExplanation.conditions && results.aiExplanation.conditions.length > 0 && (
                  <div>
                    <strong style={{ display: 'block', color: '#f57c00', marginBottom: '8px' }}>Conditions</strong>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {results.aiExplanation.conditions.map((item, i) => <li key={i} style={{marginBottom: '4px'}}>{item}</li>)}
                    </ul>
                  </div>
                )}

                {results.aiExplanation.openQuestions && results.aiExplanation.openQuestions.length > 0 && (
                  <div>
                    <strong style={{ display: 'block', color: '#0277bd', marginBottom: '8px' }}>Open Questions</strong>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {results.aiExplanation.openQuestions.map((item, i) => <li key={i} style={{marginBottom: '4px'}}>{item}</li>)}
                    </ul>
                  </div>
                )}

                {results.aiExplanation.recommendedNextSteps && results.aiExplanation.recommendedNextSteps.length > 0 && (
                  <div>
                    <strong style={{ display: 'block', color: '#2e7d32', marginBottom: '8px' }}>Recommended Next Steps</strong>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {results.aiExplanation.recommendedNextSteps.map((item, i) => <li key={i} style={{marginBottom: '4px'}}>{item}</li>)}
                    </ul>
                  </div>
                )}

                <div style={{ marginTop: '16px', fontSize: '0.85em', color: '#757575', fontStyle: 'italic', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                  Note: This is a decision-support result. The final lending decision remains with the authorized banking process/personnel.
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
