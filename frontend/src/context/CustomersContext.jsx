import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const CustomersContext = createContext();

export const useCustomers = () => useContext(CustomersContext);

export const CustomersProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.getCustomers();
        setCustomers(res.data);
      } catch (err) {
        console.error('Failed to fetch customers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  return (
    <CustomersContext.Provider value={{ customers, loading }}>
      {children}
    </CustomersContext.Provider>
  );
};
