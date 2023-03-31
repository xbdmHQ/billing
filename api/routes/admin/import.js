const express = require('express');
const router = express.Router();

const stripe = require('stripe')(process.env.STRIPE_API_KEY);

/**
 * @route /admin/import/stripe
 * @method POST
 * @description This will connect to the Stripe API and import all customersinto the database.
 * @access Private
 */
router.post('/stripe', async (req, res) => {
  let allCustomers = [];
  let startingAfter = null;
  try {
    let customers = await stripe.customers.list({
      limit: 2
    });
    while (customers.data.length > 0) {
      allCustomers = allCustomers.concat(customers.data);
      startingAfter = customers.data[customers.data.length - 1].id;
      // eslint-disable-next-line no-await-in-loop
      customers = await stripe.customers.list({
        limit: 2,
        starting_after: startingAfter
      });
    }
    res.json(allCustomers);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      code: 'SERVER_ERROR',
      error: 'Internal Server Error.'
    });
  }
});

module.exports = router;
