/**
 * Deterministic engine to decide limit increase recommendation: ASK, ASK_WITH_CONDITIONS, or HOLD_OFF.
 */
function evaluateLimitIncrease(financialFacts) {
  const {
    utilizationPct,
    collateralCoverage,
    annualIncome,
    outstanding,
    repaymentIndicator
  } = financialFacts;

  const factors = [];
  const conditions = [];
  let score = 100;
  let isHoldOff = false;
  let isAskWithConditions = false;

  // 1. Utilization
  if (utilizationPct > 80) {
    score -= 30;
    isHoldOff = true;
    factors.push({ factor: "Credit utilization", value: `${Math.round(utilizationPct)}%`, impact: "NEGATIVE", reason: "Utilization is very high (>80%)." });
  } else if (utilizationPct > 60) {
    score -= 15;
    isAskWithConditions = true;
    factors.push({ factor: "Credit utilization", value: `${Math.round(utilizationPct)}%`, impact: "CAUTION", reason: "Utilization is relatively high (60%-80%)." });
    conditions.push("Verify current requirements driving high utilization.");
  } else {
    factors.push({ factor: "Credit utilization", value: `${Math.round(utilizationPct)}%`, impact: "POSITIVE", reason: "Utilization is manageable (<60%)." });
  }

  // 2. Collateral Coverage
  if (collateralCoverage < 1.0) {
    score -= 30;
    isHoldOff = true;
    factors.push({ factor: "Collateral coverage", value: `${collateralCoverage.toFixed(2)}x`, impact: "NEGATIVE", reason: "Collateral coverage is weak (<1.0x)." });
  } else if (collateralCoverage < 1.5) {
    score -= 15;
    isAskWithConditions = true;
    factors.push({ factor: "Collateral coverage", value: `${collateralCoverage.toFixed(2)}x`, impact: "CAUTION", reason: "Collateral coverage is marginal (1.0x-1.5x)." });
    conditions.push("Confirm updated collateral valuation.");
  } else {
    factors.push({ factor: "Collateral coverage", value: `${collateralCoverage.toFixed(2)}x`, impact: "POSITIVE", reason: "Collateral coverage is adequate (>=1.5x)." });
  }

  // 3. Income to Outstanding Ratio (proxy for adequate income)
  // Let's say if outstanding > 3x annual income -> Negative
  const exposureRatio = annualIncome > 0 ? (outstanding / annualIncome) : 99;
  if (exposureRatio > 3) {
    score -= 20;
    isHoldOff = true;
    factors.push({ factor: "Income coverage", value: `Exposure is ${exposureRatio.toFixed(1)}x income`, impact: "NEGATIVE", reason: "Exposure significantly exceeds annual income." });
  } else if (exposureRatio > 1.5) {
    score -= 10;
    isAskWithConditions = true;
    factors.push({ factor: "Income coverage", value: `Exposure is ${exposureRatio.toFixed(1)}x income`, impact: "CAUTION", reason: "Exposure to income ratio is notable." });
    conditions.push("Verify latest income documents and sources.");
  } else {
    factors.push({ factor: "Income coverage", value: `Exposure is ${exposureRatio.toFixed(1)}x income`, impact: "POSITIVE", reason: "Income is adequate to support exposure." });
  }

  // 4. Repayment Indicator
  if (repaymentIndicator !== 'No delays') {
    score -= 30;
    isHoldOff = true;
    factors.push({ factor: "Repayment history", value: repaymentIndicator, impact: "NEGATIVE", reason: "Serious repayment issues exist." });
    conditions.push("Review repayment history and resolve DPD.");
  } else {
    factors.push({ factor: "Repayment history", value: repaymentIndicator, impact: "POSITIVE", reason: "No major repayment issues." });
  }

  // Determine final decision
  let result = "ASK";
  if (isHoldOff || score < 50) {
    result = "HOLD_OFF";
  } else if (isAskWithConditions || score < 80) {
    result = "ASK_WITH_CONDITIONS";
  }

  // Generate some conditions for HOLD_OFF as well, acting as "reasons to reject"
  if (result === "HOLD_OFF") {
    if (conditions.length === 0) {
      conditions.push("Exposure and risk factors are too high for immediate limit increase.");
    }
  }

  return {
    result,
    score,
    factors,
    conditions
  };
}

module.exports = {
  evaluateLimitIncrease
};
