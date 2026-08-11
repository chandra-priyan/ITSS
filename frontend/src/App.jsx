import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard';
import CustomersList from './components/CustomersList';
import Customer360 from './components/Customer360';
import G1 from './components/G1';
import G2 from './components/G2';
import G3 from './components/G3';
import G4 from './components/G4';
import History from './components/History';
import Settings from './components/Settings';
import Login from './components/Login';
import { CustomersProvider } from './context/CustomersContext';

function AppLayout({ onLogout }) {
  return (
    <div id="appShell" className="active">
      <Sidebar onLogout={onLogout} />
      <div className="main-col">
        <Topbar />
        <main id="viewRoot">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<CustomersList />} />
            <Route path="/customer-360/:id" element={<Customer360 />} />
            <Route path="/g1" element={<G1 />} />
            <Route path="/g2" element={<G2 />} />
            <Route path="/g3" element={<G3 />} />
            <Route path="/g4" element={<G4 />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <CustomersProvider>
      <Router>
        <AppLayout onLogout={() => setIsAuthenticated(false)} />
      </Router>
    </CustomersProvider>
  );
}

export default App;
