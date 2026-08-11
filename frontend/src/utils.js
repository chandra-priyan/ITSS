
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
