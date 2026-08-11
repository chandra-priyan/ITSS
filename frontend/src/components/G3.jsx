import React, { useState, useRef } from 'react';
import axios from 'axios';
import CustomerSelect from './CustomerSelect';
import { useCustomers } from '../context/CustomersContext';

export default function G3() {
  const { customers, loading } = useCustomers();
  const [customerId, setCustomerId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
    }
  }, [customers, customerId]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      setError('Please select a document to upload.');
      return;
    }
    setError(null);
    setIsProcessing(true);
    setResult(null);

    const formData = new FormData();
    formData.append('document', selectedFile);
    if (customerId) {
      formData.append('customerId', customerId);
    }

    try {
      const response = await axios.post('http://localhost:3001/api/ai/g3', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('An unexpected error occurred during extraction.');
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
          <label>Customer (Optional)</label>
          <CustomerSelect value={customerId} onChange={setCustomerId} />
        </div>
        <div className="field-row">
          <label>Document</label>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange} 
            accept=".pdf,.docx,.jpg,.jpeg,.png"
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff', maxWidth: '250px' }}
          />
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleExtract}
          disabled={isProcessing}
        >
          {isProcessing ? 'Analyzing document...' : 'Extract Information'}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '8px', border: '1px solid #ef9a9a' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="ai-results" style={{ marginTop: '24px' }}>
          
          <div className="result-card" style={{ marginBottom: '24px', padding: '24px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ marginTop: 0, color: '#1a237e', marginBottom: '16px' }}>Document Processing Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <strong>File Name:</strong> {result.document?.fileName}
              </div>
              <div>
                <strong>File Type:</strong> {result.document?.fileType}
              </div>
              <div>
                <strong>OCR Used:</strong> {result.document?.ocrUsed ? 'Yes' : 'No'}
              </div>
              {result.customerMatch && (
                <div>
                  <strong>Customer Match:</strong> 
                  <span style={{ 
                    marginLeft: '8px',
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    fontSize: '0.85em',
                    backgroundColor: result.customerMatch.status === 'MATCH' ? '#e8f5e9' : (result.customerMatch.status === 'REVIEW_REQUIRED' ? '#fff3e0' : '#eceff1'),
                    color: result.customerMatch.status === 'MATCH' ? '#2e7d32' : (result.customerMatch.status === 'REVIEW_REQUIRED' ? '#ef6c00' : '#546e7a')
                  }}>
                    {result.customerMatch.status.replace('_', ' ')}
                  </span>
                  <div style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>{result.customerMatch.message}</div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            <div className="result-card" style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <h3 style={{ marginTop: 0, color: '#1a237e', borderBottom: '2px solid #e8eaf6', paddingBottom: '8px' }}>Extracted Facts</h3>
              {result.extractedData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr' }}>
                    <strong style={{ color: '#546e7a' }}>Name:</strong> 
                    <span>{result.extractedData.customerName || <span style={{color: '#999'}}>-</span>}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr' }}>
                    <strong style={{ color: '#546e7a' }}>Customer ID:</strong> 
                    <span>{result.extractedData.customerId || <span style={{color: '#999'}}>-</span>}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr' }}>
                    <strong style={{ color: '#546e7a' }}>Loan Type:</strong> 
                    <span>{result.extractedData.loanType || <span style={{color: '#999'}}>-</span>}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr' }}>
                    <strong style={{ color: '#546e7a' }}>Amount:</strong> 
                    <span>{result.extractedData.loanAmount ? `₹${result.extractedData.loanAmount.toLocaleString('en-IN')}` : <span style={{color: '#999'}}>-</span>}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr' }}>
                    <strong style={{ color: '#546e7a' }}>Annual Income:</strong> 
                    <span>{result.extractedData.annualIncome ? `₹${result.extractedData.annualIncome.toLocaleString('en-IN')}` : <span style={{color: '#999'}}>-</span>}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr' }}>
                    <strong style={{ color: '#546e7a' }}>Employer:</strong> 
                    <span>{result.extractedData.employer || <span style={{color: '#999'}}>-</span>}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr' }}>
                    <strong style={{ color: '#546e7a' }}>Tenure:</strong> 
                    <span>{result.extractedData.loanTenure || <span style={{color: '#999'}}>-</span>}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr' }}>
                    <strong style={{ color: '#546e7a' }}>Interest Rate:</strong> 
                    <span>{result.extractedData.interestRate || <span style={{color: '#999'}}>-</span>}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr' }}>
                    <strong style={{ color: '#546e7a' }}>Collateral:</strong> 
                    <span>{result.extractedData.collateral || <span style={{color: '#999'}}>-</span>}</span>
                  </div>
                  
                  {result.extractedData.existingLiabilities && result.extractedData.existingLiabilities.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <strong style={{ color: '#546e7a' }}>Existing Liabilities:</strong>
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                        {result.extractedData.existingLiabilities.map((lib, i) => (
                          <li key={i}>{lib.type}: ₹{lib.amount?.toLocaleString('en-IN')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: '#666', fontStyle: 'italic' }}>No structured facts could be extracted.</div>
              )}
            </div>

            <div className="result-card" style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <h3 style={{ marginTop: 0, color: '#1a237e', borderBottom: '2px solid #e8eaf6', paddingBottom: '8px' }}>AI Summary</h3>
              {result.summary ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
                  
                  {result.summary.overview && (
                    <div>
                      <strong style={{ display: 'block', color: '#546e7a', marginBottom: '8px' }}>Overview</strong>
                      <p style={{ margin: 0, lineHeight: 1.5 }}>{result.summary.overview}</p>
                    </div>
                  )}
                  
                  {result.summary.keyFacts && result.summary.keyFacts.length > 0 && (
                    <div>
                      <strong style={{ display: 'block', color: '#546e7a', marginBottom: '8px' }}>Key Facts</strong>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {result.summary.keyFacts.map((item, i) => <li key={i} style={{marginBottom: '4px'}}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {result.summary.importantFindings && result.summary.importantFindings.length > 0 && (
                    <div>
                      <strong style={{ display: 'block', color: '#1565c0', marginBottom: '8px' }}>Important Findings</strong>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {result.summary.importantFindings.map((item, i) => <li key={i} style={{marginBottom: '4px'}}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {result.summary.missingInformation && result.summary.missingInformation.length > 0 && (
                    <div>
                      <strong style={{ display: 'block', color: '#e65100', marginBottom: '8px' }}>Missing Information</strong>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {result.summary.missingInformation.map((item, i) => <li key={i} style={{marginBottom: '4px'}}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {result.summary.openQuestions && result.summary.openQuestions.length > 0 && (
                    <div>
                      <strong style={{ display: 'block', color: '#2e7d32', marginBottom: '8px' }}>Open Questions</strong>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {result.summary.openQuestions.map((item, i) => <li key={i} style={{marginBottom: '4px'}}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {result.summary.attentionFlags && result.summary.attentionFlags.length > 0 && (
                    <div>
                      <strong style={{ display: 'block', color: '#c62828', marginBottom: '8px' }}>Attention Flags</strong>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#c62828' }}>
                        {result.summary.attentionFlags.map((item, i) => <li key={i} style={{marginBottom: '4px'}}><strong>{item}</strong></li>)}
                      </ul>
                    </div>
                  )}

                </div>
              ) : (
                <div style={{ color: '#666', fontStyle: 'italic' }}>AI summary generation failed.</div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
