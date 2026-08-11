const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Loan = require('../models/Loan');
const { retrieveRelevantContext } = require('../services/ragService');
const { generateCounsellingPrep } = require('../services/aiService');

router.post('/:customerId', async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const { productType } = req.body;
    
    if (!productType) {
      return res.status(400).json({ success: false, message: 'Product type is required.' });
    }

    const customer = await Customer.findOne({ customer_id: customerId });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Insufficient customer information for counselling preparation.' });
    }

    const loans = await Loan.find({ customer_id: customerId });
    const existingLoanExposure = loans.reduce((acc, curr) => acc + (curr.outstanding || 0), 0);
    const annualIncome = (customer.monthly_income || 0) * 12;

    const customerFacts = {
      customer: {
        name: customer.name_1
      },
      loan: {
        type: productType,
        amount: req.body.requestedAmount || 2500000 // Using a default/mock amount as requested by prompt logic
      },
      financialFacts: {
        annualIncome,
        existingLoanExposure
      }
    };

    const query = `Prepare counselling information for a ${productType} customer. Identify relevant eligibility considerations, required documents, discussion points and questions.`;
    
    let ragContext;
    try {
      ragContext = await retrieveRelevantContext(query, 3);
    } catch (e) {
      return res.status(503).json({ success: false, message: e.message });
    }

    try {
      const g2Response = await generateCounsellingPrep(customerFacts, ragContext);
      res.json({
        success: true,
        data: g2Response
      });
    } catch (aiError) {
      console.error("G2 AI Error:", aiError);
      return res.status(503).json({
        success: false,
        message: aiError.message
      });
    }

  } catch (error) {
    console.error("G2 Route Error:", error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

module.exports = router;
