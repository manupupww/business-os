const express = require('express');
const { queryAll, queryOne, runSql, saveDb } = require('../db');

const router = express.Router();

// ====== POST /api/sync/manual-traffic ======
router.post('/manual-traffic', (req, res) => {
  try {
    const { date, total_visitors, sales_page_views, checkout_page_views, source_organic, source_paid, source_social, source_direct } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    runSql(
      'INSERT INTO traffic (date, total_visitors, sales_page_views, checkout_page_views, source_organic, source_paid, source_social, source_direct) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [date, total_visitors || 0, sales_page_views || 0, checkout_page_views || 0, source_organic || 0, source_paid || 0, source_social || 0, source_direct || 0]
    );
    saveDb();
    res.json({ success: true, message: 'Traffic data logged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====== POST /api/sync/manual-enrollment ======
router.post('/manual-enrollment', (req, res) => {
  try {
    const { date, student_email, course_name, course_level, completion_percent, revenue } = req.body;
    if (!date || !course_name) return res.status(400).json({ error: 'Date and course_name are required' });

    runSql(
      'INSERT INTO enrollments (date, student_email, course_name, course_level, completion_percent, revenue) VALUES (?, ?, ?, ?, ?, ?)',
      [date, student_email || '', course_name, course_level || '', completion_percent || 0, revenue || 0]
    );
    saveDb();
    res.json({ success: true, message: 'Enrollment logged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====== POST /api/sync/manual-ad-spend ======
router.post('/manual-ad-spend', (req, res) => {
  try {
    const { date, platform, campaign_name, spend, impressions, clicks, conversions } = req.body;
    if (!date || !platform) return res.status(400).json({ error: 'Date and platform are required' });

    runSql(
      'INSERT INTO ad_spend (date, platform, campaign_name, spend, impressions, clicks, conversions) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [date, platform, campaign_name || '', spend || 0, impressions || 0, clicks || 0, conversions || 0]
    );
    saveDb();
    res.json({ success: true, message: 'Ad spend logged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====== POST /api/sync/manual-transaction ======
router.post('/manual-transaction', (req, res) => {
  try {
    const { date, amount, product_id, product_name, customer_email, payment_type, is_refund } = req.body;
    if (!date || !amount) return res.status(400).json({ error: 'Date and amount are required' });

    runSql(
      'INSERT INTO transactions (date, amount, product_id, product_name, customer_email, payment_type, is_refund) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [date, amount, product_id || '', product_name || '', customer_email || '', payment_type || 'one-time', is_refund ? 1 : 0]
    );
    saveDb();
    res.json({ success: true, message: 'Transaction logged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
