import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We would fetch global history here. For now, empty array.
    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="card" style={{padding: '6px 8px'}}>
      {history.length ? (
        <table>
          <thead><tr><th>Date</th><th>Customer</th><th>Module</th><th>Result</th></tr></thead>
          <tbody>
            {history.map((h, i) => (
              <tr key={i}>
                <td className="mono">{h.date}</td>
                <td>{h.customerId}</td>
                <td>{h.module}</td>
                <td>{h.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state"><div className="glyph">◌</div>No analyses recorded yet across the book.</div>
      )}
    </div>
  );
}
