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
    { name: 'High', value: riskCounts.HIGH, fill: 'var(--risk-high)' },
    { name: 'Medium', value: riskCounts.MEDIUM, fill: 'var(--risk-medium)' },
    { name: 'Low', value: riskCounts.LOW, fill: 'var(--risk-low)' }
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
        <div className="card stat-card" style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)', borderColor: '#E0E7FF', boxShadow: '0 10px 30px -10px rgba(79, 70, 229, 0.15)' }}>
          <div className="stat-card-header">
            <div className="stat-label" style={{ color: '#4F46E5', fontWeight: '700' }}>Customers in book</div>
            <div className="stat-icon" style={{ backgroundColor: '#FFFFFF', color: '#4F46E5', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.12)' }}><Users size={16} /></div>
          </div>
          <div className="stat-value" style={{ color: '#312E81' }}>{totalCustomers}</div>
          <div className="stat-trend trend-up" style={{ backgroundColor: 'rgba(79,70,229,0.1)', color: '#4338CA' }}>↑ 12% this month</div>
        </div>

        <div className="card stat-card" style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #F3E8FF 100%)', borderColor: '#E9D5FF', boxShadow: '0 10px 30px -10px rgba(147, 51, 234, 0.15)' }}>
          <div className="stat-card-header">
            <div className="stat-label" style={{ color: '#9333EA', fontWeight: '700' }}>Analyses run</div>
            <div className="stat-icon" style={{ backgroundColor: '#FFFFFF', color: '#9333EA', boxShadow: '0 4px 10px rgba(147, 51, 234, 0.12)' }}><Activity size={16} /></div>
          </div>
          <div className="stat-value" style={{ color: '#581C87' }}>{totalAnalyses}</div>
          <div className="stat-trend trend-up" style={{ backgroundColor: 'rgba(147,51,234,0.1)', color: '#7E22CE' }}>↑ 5% this week</div>
        </div>

        <div className="card stat-card" style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #FFE4E6 100%)', borderColor: '#FECDD3', boxShadow: '0 10px 30px -10px rgba(225, 29, 72, 0.15)' }}>
          <div className="stat-card-header">
            <div className="stat-label" style={{ color: '#E11D48', fontWeight: '700' }}>High risk accounts</div>
            <div className="stat-icon" style={{ backgroundColor: '#FFFFFF', color: '#E11D48', boxShadow: '0 4px 10px rgba(225, 29, 72, 0.12)' }}><AlertTriangle size={16} /></div>
          </div>
          <div className="stat-value" style={{ color: '#881337' }}>{highRisk}</div>
          <div className="stat-trend trend-down" style={{ backgroundColor: 'rgba(225,29,72,0.1)', color: '#BE123C' }}>↓ 2% from avg</div>
        </div>

        <div className="card stat-card" style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #DCFCE7 100%)', borderColor: '#BBF7D0', boxShadow: '0 10px 30px -10px rgba(22, 163, 74, 0.15)' }}>
          <div className="stat-card-header">
            <div className="stat-label" style={{ color: '#16A34A', fontWeight: '700' }}>Active modules</div>
            <div className="stat-icon" style={{ backgroundColor: '#FFFFFF', color: '#16A34A', boxShadow: '0 4px 10px rgba(22, 163, 74, 0.12)' }}><Cpu size={16} /></div>
          </div>
          <div className="stat-value" style={{ color: '#14532D' }}>4</div>
          <div className="stat-trend trend-neutral" style={{ backgroundColor: 'rgba(22,163,74,0.1)', color: '#15803D' }}>Running smoothly</div>
        </div>
      </div>

      <div className="section-title">Portfolio Overview</div>
      <div className="grid cols-2" style={{marginBottom: '24px', gap: '20px'}}>
        <div className="card" style={{padding: '24px', height: '300px', display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at top right, rgba(91, 95, 239, 0.12), transparent 250px), linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)', borderColor: '#E0E7FF', boxShadow: '0 10px 30px -10px rgba(79, 70, 229, 0.15)'}}>
          <h3 style={{margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: 'var(--navy-900)'}}>Risk Distribution</h3>
          <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
            <div style={{ flex: 1, height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={riskData} 
                    cx="50%" cy="50%" 
                    innerRadius={65} 
                    outerRadius={95} 
                    paddingAngle={0} 
                    dataKey="value"
                    stroke="none"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '130px', paddingRight: '20px' }}>
              {riskData.map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: item.fill }}></div>
                    <span style={{ fontSize: '14px', color: 'var(--text-600)' }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-900)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="card" style={{padding: '24px', height: '300px', display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at top right, rgba(91, 95, 239, 0.12), transparent 250px), linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)', borderColor: '#E0E7FF', boxShadow: '0 10px 30px -10px rgba(79, 70, 229, 0.15)'}}>
          <h3 style={{margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: 'var(--navy-900)'}}>Total Exposure Trend</h3>
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
