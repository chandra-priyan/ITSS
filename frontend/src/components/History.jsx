import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);
  
  const [typeFilter, setTypeFilter] = useState('All');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.getHistory({ analysisType: typeFilter });
      setHistory(response.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [typeFilter]);

  const fetchDetail = async (id) => {
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedDetail(null);
      return;
    }
    
    setSelectedId(id);
    setLoadingDetail(true);
    setSelectedDetail(null);
    try {
      const response = await api.getHistoryDetail(id);
      setSelectedDetail(response.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load analysis detail.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatType = (type) => {
    const map = {
      'G1_CREDIT_EXPOSURE': 'Credit Exposure',
      'G2_LOAN_COUNSELLING': 'Counselling',
      'G3_DOCUMENT_SUMMARY': 'Document Summary',
      'G4_LIMIT_INCREASE': 'Limit Increase'
    };
    return map[type] || type;
  };

  if (loading && history.length === 0) return <div>Loading history...</div>;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Filters */}
      <div className="card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <strong style={{ color: '#546e7a' }}>Filter by Type:</strong>
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="All">All</option>
          <option value="G1_CREDIT_EXPOSURE">G1 Credit Exposure</option>
          <option value="G2_LOAN_COUNSELLING">G2 Counselling</option>
          <option value="G3_DOCUMENT_SUMMARY">G3 Document Summary</option>
          <option value="G4_LIMIT_INCREASE">G4 Limit Increase</option>
        </select>
      </div>

      {error && <div style={{ color: '#d32f2f', padding: '12px', backgroundColor: '#ffebee', borderRadius: '4px' }}>{error}</div>}

      <div className="card" style={{padding: '6px 8px'}}>
        {history.length ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '12px' }}>Date</th>
                <th style={{ padding: '12px' }}>Type</th>
                <th style={{ padding: '12px' }}>Customer</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <React.Fragment key={h._id}>
                  <tr style={{ borderBottom: '1px solid #eee', backgroundColor: selectedId === h._id ? '#f5f5f5' : 'transparent' }}>
                    <td className="mono" style={{ padding: '12px', fontSize: '0.9em' }}>{formatDate(h.createdAt)}</td>
                    <td style={{ padding: '12px', fontWeight: 500 }}>{formatType(h.analysisType)}</td>
                    <td style={{ padding: '12px' }}>
                      {h.customerName} <span style={{ fontSize: '0.85em', color: '#888' }}>({h.customerId})</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        fontSize: '0.85em',
                        backgroundColor: h.status === 'COMPLETED' ? '#e8f5e9' : '#ffebee',
                        color: h.status === 'COMPLETED' ? '#2e7d32' : '#c62828'
                      }}>
                        {h.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button 
                        onClick={() => fetchDetail(h._id)}
                        style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#eceff1', border: 'none', borderRadius: '4px' }}
                      >
                        {selectedId === h._id ? 'Close' : 'View'}
                      </button>
                    </td>
                  </tr>
                  
                  {selectedId === h._id && (
                    <tr>
                      <td colSpan="5" style={{ padding: 0 }}>
                        <div style={{ backgroundColor: '#fafafa', padding: '24px', borderBottom: '2px solid #ccc' }}>
                          {loadingDetail ? (
                            <div>Loading detail snapshot...</div>
                          ) : selectedDetail ? (
                            <div>
                              <h3 style={{ marginTop: 0, color: '#1a237e' }}>Analysis Snapshot</h3>
                              <p style={{ color: '#546e7a', fontStyle: 'italic', marginBottom: '20px' }}>
                                {selectedDetail.summary}
                              </p>
                              
                              <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e0e0e0', overflowX: 'auto' }}>
                                <pre style={{ margin: 0, fontSize: '0.85em', whiteSpace: 'pre-wrap' }}>
                                  {JSON.stringify(selectedDetail.result, null, 2)}
                                </pre>
                              </div>
                              <div style={{ marginTop: '12px', fontSize: '0.8em', color: '#999' }}>
                                Note: This is an immutable historical snapshot. It does not reflect current Customer 360 data.
                              </div>
                            </div>
                          ) : (
                            <div>Detail unavailable.</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <div className="glyph" style={{ fontSize: '2em', marginBottom: '10px' }}>◌</div>
            <div>No analyses recorded yet. Run G1-G4 to populate history.</div>
          </div>
        )}
      </div>
    </div>
  );
}
