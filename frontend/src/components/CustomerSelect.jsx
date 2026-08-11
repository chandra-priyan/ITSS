import React from 'react';
import { useCustomers } from '../context/CustomersContext';

export default function CustomerSelect({ value, onChange }) {
  const { customers } = useCustomers();
  
  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      {customers.map(c => (
        <option key={c.id} value={c.id}>{c.name} — {c.id}</option>
      ))}
    </select>
  );
}
