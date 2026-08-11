const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Limit = require('../models/Limit');
const Loan = require('../models/Loan');
const Collateral = require('../models/Collateral');
const Analysis = require('../models/Analysis');

router.get('/:id', async (req, res) => {
  try {
    const customerId = req.params.id;
    const c = await Customer.findOne({ customer_id: customerId });
    
    if (!c) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const cLimits = await Limit.find({ customer_id: customerId });
    const cLoans = await Loan.find({ customer_id: customerId });
    const cCollaterals = await Collateral.find({ customer_id: customerId });
    const history = await Analysis.find({ customer_id: customerId }).sort({ date: -1 });

    const creditLimit = cLimits.reduce((acc, curr) => acc + (curr.approved_limit || 0), 0);
    const outstanding = cLimits.reduce((acc, curr) => acc + (curr.utilized || 0), 0);
    const collateral = cCollaterals.reduce((acc, curr) => acc + (curr.collateral_value || 0), 0);
    const existingLoan = cLoans.reduce((acc, curr) => acc + (curr.outstanding || 0), 0);

    const result = {
      id: c.customer_id,
      name: c.name_1,
      status: c.customer_status === '1' ? 'Active' : 'Dormant',
      income: c.monthly_income || 0,
      creditLimit,
      outstanding,
      collateral,
      existingLoan,
      history: history.map(h => ({
        date: h.date.toISOString().split('T')[0],
        module: h.module,
        result: h.result
      }))
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
