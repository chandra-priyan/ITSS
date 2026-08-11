import React, { useState } from 'react';
import axios from 'axios';
import CustomerSelect from './CustomerSelect';
import { useCustomers } from '../context/CustomersContext';

export default function G2() {
  const { customers, loading } = useCustomers();
  const [customerId, setCustomerId] = useState('');
  const [loanType, setLoanType] = useState('Home Loan');
  const [amount, setAmount] = useState(2500000);
  
  const [results, setResults] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState(null);

  React.useEffect(() => {
    if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
    }
  }, [customers, customerId]);

  const handleRun = async () => {
    if (!customerId) return;
    
    setResults(null);
    setAiError(null);
    setIsGeneratingAI(true);
    
    try {
      const response = await axios.post(`http://localhost:3001/api/ai/g2/${customerId}`, {
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
      <div className="customer-select-row">
        <div className="field-row">
          <label>Customer</label>
          <CustomerSelect value={customerId} onChange={setCustomerId} />
        </div>
        <div className="field-row">
          <label>Loan type</label>
          <select value={loanType} onChange={e => setLoanType(e.target.value)}>
            <option>Home Loan</option><option>Personal Loan</option><option>Education Loan</option>
          </select>
        </div>
        <div className="field-row">
          <label>Requested amount (₹)</label>
          <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} step="10000" />
        </div>
        <button className="btn btn-primary" onClick={handleRun} disabled={isGeneratingAI}>
          {isGeneratingAI ? 'Preparing...' : 'Prepare Counselling'}
        </button>
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
