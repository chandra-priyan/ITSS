import React, { useState } from 'react';
import CustomerSelect from './CustomerSelect';
import { useCustomers } from '../context/CustomersContext';

export default function G3() {
  const { customers, loading } = useCustomers();
  const [customerId, setCustomerId] = useState('');

  React.useEffect(() => {
    if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
    }
  }, [customers, customerId]);

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <div className="customer-select-row">
        <div className="field-row">
          <label>Customer</label>
          <CustomerSelect value={customerId} onChange={setCustomerId} />
        </div>
        <div className="field-row">
          <label>Document</label>
          <select>
            <option>application_form.pdf</option>
            <option>income_proof.pdf</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => {}}>Extract Information</button>
      </div>
    </>
  );
}
