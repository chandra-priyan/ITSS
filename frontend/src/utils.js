export const mockState = {
  customers: [
    {id:'C001', name:'Arun Kumar', status:'Active', creditLimit:1000000, outstanding:750000, collateral:1200000, income:800000, existingLoan:500000},
    {id:'C002', name:'Priya Sharma', status:'Active', creditLimit:1500000, outstanding:400000, collateral:2200000, income:1400000, existingLoan:200000},
    {id:'C003', name:'Rajesh Menon', status:'Active', creditLimit:2000000, outstanding:1850000, collateral:2000000, income:900000, existingLoan:1400000},
    {id:'C004', name:'Sneha Iyer', status:'Active', creditLimit:800000, outstanding:300000, collateral:1000000, income:600000, existingLoan:150000},
    {id:'C005', name:'Vikram Nair', status:'Active', creditLimit:1200000, outstanding:1020000, collateral:1300000, income:750000, existingLoan:600000},
    {id:'C006', name:'Kavita Das', status:'Dormant', creditLimit:500000, outstanding:50000, collateral:700000, income:400000, existingLoan:0},
  ],
  history: [],
};

export const POLICY_DOCS = {
  'Home Loan': "Home Loan Policy (v3.2): Eligible for salaried and self-employed applicants. Max tenure 25 years. Required documents: identity proof, income proof (latest 3 months payslips or 2 years ITR), bank statements (6 months), property title documents and valuation report. Loan-to-value capped at 80% of property value. Applicant existing EMI obligations must not exceed 50% of net monthly income.",
  'Personal Loan': "Personal Loan Policy (v2.1): Unsecured facility for salaried applicants with minimum 1 year current employment. Required documents: identity proof, income proof (latest 3 payslips), bank statements (3 months). Maximum tenure 5 years. Pricing is risk-based on bureau score and existing exposure.",
  'Education Loan': "Education Loan Policy (v1.8): Covers tuition, hostel and books for recognised institutions. Required documents: admission letter, fee structure, co-applicant (parent/guardian) income proof, collateral required above ₹40L. Moratorium available until 6 months post course completion.",
};

export function fmtINR(n){
  if(n === null || n === undefined) return '—';
  return '₹' + (n/100000).toLocaleString('en-IN',{maximumFractionDigits:2}) + ' L';
}
export function fmtPct(n){ return n.toFixed(1) + '%'; }
export function fmtX(n){ return n.toFixed(2) + 'x'; }
export function todayStr(){
  return new Date().toLocaleDateString('en-IN',{day:'2-digit', month:'short', year:'numeric'});
}

export function calcMetrics(c){
  const utilization = c.creditLimit ? (c.outstanding / c.creditLimit) * 100 : 0;
  const coverage = c.outstanding > 0 ? (c.collateral / c.outstanding) : (c.collateral > 0 ? 99 : 0);
  const totalExposure = c.outstanding + c.existingLoan;
  const incomeRatio = totalExposure > 0 ? c.income / totalExposure : 99;
  const exposureRatio = c.creditLimit ? c.existingLoan / c.creditLimit : 0;
  return {utilization, coverage, totalExposure, incomeRatio, exposureRatio};
}

export function riskEngine(m){
  const utilScore = Math.min(100, m.utilization);
  const covScore = m.coverage >= 1.5 ? 15 : m.coverage >= 1.0 ? 45 : 80;
  const incScore = m.incomeRatio >= 1.5 ? 15 : m.incomeRatio >= 0.8 ? 45 : 80;
  const expScore = m.exposureRatio >= 0.6 ? 80 : m.exposureRatio >= 0.3 ? 45 : 15;
  const score = Math.round(utilScore*0.35 + covScore*0.25 + incScore*0.2 + expScore*0.2);
  const level = score < 35 ? 'LOW' : score < 65 ? 'MEDIUM' : 'HIGH';
  const factors = {
    utilization: m.utilization > 75 ? 'High' : m.utilization >= 50 ? 'Medium' : 'Low',
    collateral: m.coverage >= 1.5 ? 'Good' : m.coverage >= 1.0 ? 'Moderate' : 'Weak',
    income: m.incomeRatio >= 1.5 ? 'Good' : m.incomeRatio >= 0.8 ? 'Moderate' : 'Weak',
    exposure: m.exposureRatio >= 0.6 ? 'High' : m.exposureRatio >= 0.3 ? 'Medium' : 'Low',
  };
  return {score, level, factors};
}

export function badgeClass(lvl){
  return lvl === 'LOW' ? 'badge-low' : lvl === 'MEDIUM' ? 'badge-medium' : 'badge-high';
}

export function decisionEngine(factors){
  if(factors.collateral === 'Weak' || factors.income === 'Weak') return 'HOLD';
  if(factors.utilization === 'High') return 'CONDITIONS';
  if(factors.collateral === 'Good' && factors.income === 'Good') return 'ASK';
  return 'CONDITIONS';
}

export function decisionLabel(code){
  return code === 'ASK' ? 'ASK' : code === 'CONDITIONS' ? 'ASK WITH CONDITIONS' : 'HOLD OFF';
}

export function decisionIcon(code){
  return code === 'ASK' ? '✓' : code === 'CONDITIONS' ? '⚠' : '✕';
}
