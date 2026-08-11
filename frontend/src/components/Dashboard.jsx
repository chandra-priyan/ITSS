import React from 'react';
import { useNavigate } from 'react-router-dom';
import { calcMetrics, riskEngine, badgeClass } from '../utils';
import { useCustomers } from '../context/CustomersContext';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Users, Activity, AlertTriangle, Cpu } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { customers, loading } = useCustomers();
  const history = []; // TODO: fetch history if needed globally
  
  if (loading) return <div>Loading...</div>;
  
  const totalCustomers = customers.length;
  const totalAnalyses = history.length;
  
  const riskCounts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  const statusCounts = { Active: 0, Dormant: 0 };
  
  customers.forEach(c => {
    const r = riskEngine(calcMetrics(c));
    riskCounts[r.level] = (riskCounts[r.level] || 0) + 1;
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  });

  const highRisk = riskCounts.HIGH;
  const recentCustomers = customers.slice(0, 5);

  const riskData = [
    { name: 'Low Risk', value: riskCounts.LOW, fill: 'var(--risk-low)' },
    { name: 'Medium Risk', value: riskCounts.MEDIUM, fill: 'var(--risk-medium)' },
    { name: 'High Risk', value: riskCounts.HIGH, fill: 'var(--risk-high)' }
  ];

  const trendData = [
    { month: 'Mar', exposure: 1200000 },
    { month: 'Apr', exposure: 1400000 },
    { month: 'May', exposure: 1350000 },
    { month: 'Jun', exposure: 1800000 },
    { month: 'Jul', exposure: 2100000 },
    { month: 'Aug', exposure: 2400000 }
  ];

  return (
    <>
      <div className="grid cols-4" style={{marginBottom: '22px'}}>
        <div className="card stat-card">
          <div className="stat-card-header">
            <div className="stat-label">Customers in book</div>
            <div className="stat-icon"><Users size={16} /></div>
          </div>
          <div className="stat-value">{totalCustomers}</div>
          <div className="stat-trend trend-up">↑ 12% this month</div>
        </div>

        <div className="card stat-card">
          <div className="stat-card-header">
            <div className="stat-label">Analyses run</div>
            <div className="stat-icon"><Activity size={16} /></div>
          </div>
          <div className="stat-value">{totalAnalyses}</div>
          <div className="stat-trend trend-up">↑ 5% this week</div>
        </div>

        <div className="card stat-card">
          <div className="stat-card-header">
            <div className="stat-label">High risk accounts</div>
            <div className="stat-icon" style={{color: 'var(--risk-high)'}}><AlertTriangle size={16} /></div>
          </div>
          <div className="stat-value" style={{color: 'var(--risk-high)'}}>{highRisk}</div>
          <div className="stat-trend trend-down">↓ 2% from avg</div>
        </div>

        <div className="card stat-card">
          <div className="stat-card-header">
            <div className="stat-label">Active modules</div>
            <div className="stat-icon"><Cpu size={16} /></div>
          </div>
          <div className="stat-value">4</div>
          <div className="stat-trend trend-neutral">Running smoothly</div>
        </div>
      </div>

      <div className="section-title">Portfolio Overview</div>
      <div className="grid cols-2" style={{marginBottom: '24px', gap: '20px'}}>
        <div className="card" style={{padding: '20px', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <h3 style={{margin: '0 0 16px 0', fontSize: '1.1em'}}>Risk Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={riskData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label>
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="card" style={{padding: '20px', height: '300px', display: 'flex', flexDirection: 'column'}}>
          <h3 style={{margin: '0 0 16px 0', fontSize: '1.1em'}}>Total Exposure Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
              <defs>
                <linearGradient id="colorExposure" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--blue-500)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--blue-500)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'var(--text-400)', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-400)', fontSize: 12}} tickFormatter={(value) => `${value/100000}L`} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow)' }}
                formatter={(value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
              />
              <Area type="monotone" dataKey="exposure" stroke="var(--blue-600)" strokeWidth={3} fillOpacity={1} fill="url(#colorExposure)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="section-title">Recent Customer Activity</div>
      <div className="card" style={{padding: '6px 8px'}}>
        <table>
          <thead>
            <tr><th>Customer</th><th>ID</th><th>Risk</th><th>Status</th></tr>
          </thead>
          <tbody>
            {recentCustomers.map(c => {
              const r = riskEngine(calcMetrics(c));
              return (
                <tr key={c.id} className="row-link" onClick={() => navigate(`/customer-360/${c.id}`)}>
                  <td>{c.name}</td>
                  <td className="mono">{c.id}</td>
                  <td><span className={`badge ${badgeClass(r.level)}`}>{r.level}</span></td>
                  <td><span className={`status-dot ${c.status === 'Active' ? 'status-active' : 'status-dormant'}`}></span>{c.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
