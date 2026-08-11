/**
 * Analyzes financial records (Limits, Loans, Collaterals) to produce deterministic metrics.
 */
function analyzeFinancials(customer, limits, loans, collaterals) {
  // Aggregate limits
  const creditLimit = limits.reduce((acc, curr) => acc + (curr.approved_limit || 0), 0);
  const outstanding = limits.reduce((acc, curr) => acc + (curr.utilized || 0), 0);
  
  // Aggregate collaterals
  const collateralValue = collaterals.reduce((acc, curr) => acc + (curr.collateral_value || 0), 0);
  
  // Aggregate existing loans
  const existingLoanExposure = loans.reduce((acc, curr) => acc + (curr.outstanding || 0), 0);

  // Calculate metrics safely
  const utilizationPct = creditLimit > 0 ? (outstanding / creditLimit) * 100 : 0;
  const availableCredit = creditLimit - outstanding;
  const collateralCoverage = outstanding > 0 ? (collateralValue / outstanding) : (collateralValue > 0 ? 99 : 0);

  const annualIncome = (customer.monthly_income || 0) * 12;

  // Repayment / DPD indicators
  const hasDPD = loans.some(l => l.days_past_due > 0);
  const maxDPD = loans.length > 0 ? Math.max(...loans.map(l => l.days_past_due || 0)) : 0;

  return {
    creditLimit,
    outstanding,
    utilizationPct,
    availableCredit,
    collateralValue,
    collateralCoverage,
    annualIncome,
    existingLoanExposure,
    repaymentIndicator: hasDPD ? `Max DPD: ${maxDPD} days` : 'No delays'
  };
}

module.exports = {
  analyzeFinancials
};
