import React, { useState } from 'react';
import { api } from '../services/api';
import { calcMetrics, riskEngine } from '../utils';
import { useCustomers } from '../context/CustomersContext';

export default function G2() {
  const { customers, loading } = useCustomers();
  const [customerId, setCustomerId] = useState('');
  const [loanType, setLoanType] = useState('Home Loan');
  const [amount, setAmount] = useState(2500000);
  
  const [results, setResults] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  React.useEffect(() => {
    if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
    }
  }, [customers, customerId]);

  const filteredCustomers = customers.filter(c => {
    const r = riskEngine(calcMetrics(c));
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || String(c.id).includes(searchTerm);
    const matchesRisk = riskFilter === 'ALL' || r.level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  React.useEffect(() => {
    if (filteredCustomers.length > 0 && !filteredCustomers.find(c => String(c.id) === String(customerId))) {
      setCustomerId(filteredCustomers[0].id);
    } else if (filteredCustomers.length === 0) {
      setCustomerId('');
    }
  }, [filteredCustomers, customerId]);

  const handleRun = async () => {
    if (!customerId) return;
    
    setResults(null);
    setAiError(null);
    setIsGeneratingAI(true);
    
    try {
      const response = await api.runG2(customerId, {
        productType: loanType,
        requestedAmount: amount
      });
      
      if (response.data.success) {
        setResults(response.data.data);
      } else {
        setAiError(response.data.message || 'Unable to connect to counselling AI service.');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setAiError(err.response.data.message);
      } else {
        setAiError('Unable to connect to counselling AI service. Please try again.');
      }
    } finally {
      setIsGeneratingAI(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field-row" style={{ margin: 0, flex: 1.5, minWidth: '180px' }}>
            <label>Search Name or ID</label>
            <input 
              type="text" 
              placeholder="e.g. Rajesh or 100100" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="field-row" style={{ margin: 0, flex: 1, minWidth: '130px' }}>
            <label>Risk Level</label>
            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
              <option value="ALL">All Risks</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>
          <div className="field-row" style={{ margin: 0, flex: 2, minWidth: '220px' }}>
            <label>Select Customer</label>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)}>
              {filteredCustomers.length === 0 && <option value="">No matches found</option>}
              {filteredCustomers.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.id}</option>
              ))}
            </select>
          </div>
          
          <div className="field-row" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
            <label>Loan type</label>
            <select value={loanType} onChange={e => setLoanType(e.target.value)}>
              <option>Home Loan</option><option>Personal Loan</option><option>Education Loan</option>
            </select>
          </div>
          <div className="field-row" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
            <label>Amount (₹)</label>
            <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} step="10000" />
          </div>
          
          <div style={{ margin: 0, width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
             <button className="btn btn-primary" style={{ padding: '10px 24px', width: 'auto' }} onClick={handleRun} disabled={isGeneratingAI || !customerId}>
               {isGeneratingAI ? 'Preparing...' : 'Prepare Counselling'}
             </button>
          </div>
        </div>
      </div>

      {isGeneratingAI && (
        <div className="ai-panel">
          <div className="loading-line">
            <span className="spinner"></span> Preparing Counselling Brief...
          </div>
        </div>
      )}

      {aiError && (
        <div className="card" style={{borderColor: 'var(--risk-high)', marginBottom: '16px'}}>
          <div style={{color: 'var(--risk-high)', fontWeight: 'bold'}}>Error</div>
          <div>{aiError}</div>
        </div>
      )}

      {results && (
        <div id="g2Results">
          <div className="grid cols-2" style={{alignItems: 'start', marginBottom: '16px'}}>
            <div className="card">
              <div className="card-title">Customer Snapshot</div>
              <ul className="checklist">
                {results.customerSnapshot.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
            <div className="card">
              <div className="card-title">Product Considerations <span className="badge badge-neutral">RAG context</span></div>
              <ul className="checklist">
                {results.productConsiderations.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>
          
          <div className="grid cols-2" style={{alignItems: 'start', marginBottom: '16px'}}>
            <div className="card">
              <div className="card-title">Talking Points</div>
              <ul className="findings-list">
                {results.talkingPoints.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
            <div className="card">
              <div className="card-title">Questions to Ask</div>
              <ul className="qa-list">
                {results.questionsToAsk.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>
          
          <div className="grid cols-2" style={{alignItems: 'start'}}>
            <div className="card">
              <div className="card-title">Document Checklist</div>
              <ul className="checklist">
                {results.documentChecklist.map((item, i) => (
                  <li key={i}><span className="check-yes">✓</span>{item}</li>
                ))}
              </ul>
            </div>
            <div className="card">
              <div className="card-title">Potential Concerns</div>
              <ul className="findings-list">
                {results.potentialConcerns.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
