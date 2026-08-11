const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Limit = require('../models/Limit');
const Loan = require('../models/Loan');
const Collateral = require('../models/Collateral');
const Analysis = require('../models/Analysis');
const { analyzeFinancials } = require('../services/financialAnalyzer');
const { calculateRisk } = require('../services/riskEngine');
const { generateCreditBrief } = require('../services/aiService');

router.post('/g1/:customerId', async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const customer = await Customer.findOne({ customer_id: customerId });
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Insufficient customer data for AI analysis.' });
    }

    const limits = await Limit.find({ customer_id: customerId });
    const loans = await Loan.find({ customer_id: customerId });
    const collaterals = await Collateral.find({ customer_id: customerId });

    // Deterministic Financial Calculations
    const financialFacts = analyzeFinancials(customer, limits, loans, collaterals);

    // Deterministic Risk Engine
    const risk = calculateRisk(financialFacts);

    // Format for payload
    const customerPayload = {
      id: customer.customer_id,
      name: customer.name_1
    };

    let aiBrief = null;
    try {
      // AI LLM Call
      aiBrief = await generateCreditBrief(
        customerPayload.name,
        financialFacts,
        risk.level,
        risk.score,
        risk.factors
      );
    } catch (aiError) {
      console.error("AI Generation Error:", aiError);
      return res.status(503).json({
        success: false,
        message: 'Unable to connect to AI service. Please try again.',
        details: aiError.message
      });
    }

    // Save Analysis History if it doesn't break things (Phase 11 preview)
    try {
      await Analysis.create({
        customer_id: customerId,
        module: 'G1',
        result: risk.level,
        details: { riskScore: risk.score, financialFacts, aiBrief }
      });
    } catch (e) {
      console.error("Failed to save analysis history", e);
    }

    res.json({
      success: true,
      customer: customerPayload,
      financialFacts,
      risk,
      aiBrief
    });
  } catch (error) {
    console.error("G1 Route Error:", error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

module.exports = router;
