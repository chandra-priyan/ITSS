const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Limit = require('../models/Limit');
const Loan = require('../models/Loan');
const Collateral = require('../models/Collateral');

router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find({});
    const limits = await Limit.find({});
    const loans = await Loan.find({});
    const collaterals = await Collateral.find({});

    const result = customers.map(c => {
      const cLimits = limits.filter(l => l.customer_id === c.customer_id);
      const cLoans = loans.filter(l => l.customer_id === c.customer_id);
      const cCollaterals = collaterals.filter(l => l.customer_id === c.customer_id);

      const creditLimit = cLimits.reduce((acc, curr) => acc + (curr.approved_limit || 0), 0);
      const outstanding = cLimits.reduce((acc, curr) => acc + (curr.utilized || 0), 0);
      const collateral = cCollaterals.reduce((acc, curr) => acc + (curr.collateral_value || 0), 0);
      const existingLoan = cLoans.reduce((acc, curr) => acc + (curr.outstanding || 0), 0);

      return {
        id: c.customer_id,
        name: c.name_1,
        status: c.customer_status === '1' ? 'Active' : 'Dormant',
        income: c.monthly_income || 0,
        creditLimit,
        outstanding,
        collateral,
        existingLoan
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
