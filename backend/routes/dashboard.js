const express = require('express');
const { getDb, queryAll, queryOne, runSql } = require('../db');

const router = express.Router();

// ====== GET /api/dashboard/summary ======
router.get('/summary', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayDate = new Date();
    const weekAgo = new Date(todayDate); weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(todayDate); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const monthAgo = new Date(todayDate); monthAgo.setDate(monthAgo.getDate() - 30);
    const twoMonthsAgo = new Date(todayDate); twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];
    const monthAgoStr = monthAgo.toISOString().split('T')[0];
    const twoMonthsAgoStr = twoMonthsAgo.toISOString().split('T')[0];

    const todayKpi = queryOne('SELECT * FROM daily_kpis WHERE date = ?', [today]) || {};

    const thisWeekRev = queryOne('SELECT COALESCE(SUM(total_revenue),0) as total FROM daily_kpis WHERE date >= ?', [weekAgoStr]);
    const prevWeekRev = queryOne('SELECT COALESCE(SUM(total_revenue),0) as total FROM daily_kpis WHERE date >= ? AND date < ?', [twoWeeksAgoStr, weekAgoStr]);

    const thisMonthRev = queryOne('SELECT COALESCE(SUM(total_revenue),0) as total FROM daily_kpis WHERE date >= ?', [monthAgoStr]);
    const prevMonthRev = queryOne('SELECT COALESCE(SUM(total_revenue),0) as total FROM daily_kpis WHERE date >= ? AND date < ?', [twoMonthsAgoStr, monthAgoStr]);

    const thisWeekCustomers = queryOne('SELECT COALESCE(SUM(new_customers),0) as total FROM daily_kpis WHERE date >= ?', [weekAgoStr]);
    const prevWeekCustomers = queryOne('SELECT COALESCE(SUM(new_customers),0) as total FROM daily_kpis WHERE date >= ? AND date < ?', [twoWeeksAgoStr, weekAgoStr]);

    const weekAvg = queryOne(`
      SELECT 
        COALESCE(AVG(conversion_rate),0) as avg_conversion,
        COALESCE(AVG(aov),0) as avg_aov,
        COALESCE(AVG(cpa),0) as avg_cpa,
        COALESCE(AVG(roas),0) as avg_roas,
        COALESCE(AVG(refund_rate),0) as avg_refund,
        COALESCE(AVG(checkout_abandonment),0) as avg_abandonment,
        COALESCE(SUM(mrr),0) as total_mrr
      FROM daily_kpis WHERE date >= ?
    `, [weekAgoStr]);

    const prevWeekAvg = queryOne(`
      SELECT 
        COALESCE(AVG(conversion_rate),0) as avg_conversion,
        COALESCE(AVG(aov),0) as avg_aov,
        COALESCE(AVG(cpa),0) as avg_cpa,
        COALESCE(AVG(roas),0) as avg_roas,
        COALESCE(AVG(refund_rate),0) as avg_refund,
        COALESCE(AVG(checkout_abandonment),0) as avg_abandonment
      FROM daily_kpis WHERE date >= ? AND date < ?
    `, [twoWeeksAgoStr, weekAgoStr]);

    const todayEnrollments = queryOne('SELECT COUNT(*) as count FROM enrollments WHERE date = ?', [today]);
    const weekEnrollments = queryOne('SELECT COUNT(*) as count FROM enrollments WHERE date >= ?', [weekAgoStr]);
    const totalStudents = queryOne('SELECT COUNT(DISTINCT student_email) as count FROM enrollments');
    const totalRevenue = queryOne('SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE is_refund = 0');

    function pctChange(current, previous) {
      if (!previous || previous === 0) return 0;
      return Math.round(((current - previous) / previous) * 10000) / 100;
    }

    res.json({
      today: {
        revenue: todayKpi.total_revenue || 0,
        customers: todayKpi.new_customers || 0,
        conversion_rate: todayKpi.conversion_rate || 0,
        aov: todayKpi.aov || 0,
        cpa: todayKpi.cpa || 0,
        roas: todayKpi.roas || 0,
        refund_rate: todayKpi.refund_rate || 0,
        enrollments: todayEnrollments?.count || 0,
      },
      week: {
        revenue: thisWeekRev?.total || 0,
        revenue_change: pctChange(thisWeekRev?.total, prevWeekRev?.total),
        customers: thisWeekCustomers?.total || 0,
        customers_change: pctChange(thisWeekCustomers?.total, prevWeekCustomers?.total),
        conversion_rate: Math.round((weekAvg?.avg_conversion || 0) * 100) / 100,
        conversion_change: pctChange(weekAvg?.avg_conversion, prevWeekAvg?.avg_conversion),
        aov: Math.round((weekAvg?.avg_aov || 0) * 100) / 100,
        aov_change: pctChange(weekAvg?.avg_aov, prevWeekAvg?.avg_aov),
        cpa: Math.round((weekAvg?.avg_cpa || 0) * 100) / 100,
        cpa_change: pctChange(weekAvg?.avg_cpa, prevWeekAvg?.avg_cpa),
        roas: Math.round((weekAvg?.avg_roas || 0) * 100) / 100,
        roas_change: pctChange(weekAvg?.avg_roas, prevWeekAvg?.avg_roas),
        refund_rate: Math.round((weekAvg?.avg_refund || 0) * 100) / 100,
        refund_change: pctChange(weekAvg?.avg_refund, prevWeekAvg?.avg_refund),
        checkout_abandonment: Math.round((weekAvg?.avg_abandonment || 0) * 100) / 100,
        enrollments: weekEnrollments?.count || 0,
        mrr: Math.round((weekAvg?.total_mrr || 0) * 100) / 100,
      },
      month: {
        revenue: thisMonthRev?.total || 0,
        revenue_change: pctChange(thisMonthRev?.total, prevMonthRev?.total),
      },
      totals: {
        all_time_revenue: totalRevenue?.total || 0,
        total_students: totalStudents?.count || 0,
      }
    });
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ====== GET /api/dashboard/revenue-chart ======
router.get('/revenue-chart', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const data = queryAll('SELECT date, total_revenue as revenue FROM daily_kpis WHERE date >= ? ORDER BY date ASC', [startDate.toISOString().split('T')[0]]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====== GET /api/dashboard/funnel ======
router.get('/funnel', (req, res) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const trafficData = queryOne(`
      SELECT COALESCE(SUM(total_visitors),0) as visitors, COALESCE(SUM(sales_page_views),0) as sales_page, COALESCE(SUM(checkout_page_views),0) as checkout
      FROM traffic WHERE date >= ?
    `, [weekAgoStr]);

    const purchases = queryOne('SELECT COUNT(*) as count FROM transactions WHERE date >= ? AND is_refund = 0', [weekAgoStr]);

    const visitors = trafficData?.visitors || 0;
    const salesPage = trafficData?.sales_page || 0;
    const checkout = trafficData?.checkout || 0;
    const purchased = purchases?.count || 0;

    res.json({
      steps: [
        { name: 'Visitors', count: visitors, rate: 100 },
        { name: 'Sales Page', count: salesPage, rate: visitors > 0 ? Math.round((salesPage / visitors) * 10000) / 100 : 0 },
        { name: 'Checkout', count: checkout, rate: salesPage > 0 ? Math.round((checkout / salesPage) * 10000) / 100 : 0 },
        { name: 'Purchase', count: purchased, rate: checkout > 0 ? Math.round((purchased / checkout) * 10000) / 100 : 0 },
      ],
      overall_conversion: visitors > 0 ? Math.round((purchased / visitors) * 10000) / 100 : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====== GET /api/dashboard/courses ======
router.get('/courses', (req, res) => {
  try {
    const data = queryAll(`
      SELECT course_name, course_level, COUNT(*) as enrollments, COALESCE(SUM(revenue),0) as total_revenue,
      ROUND(AVG(completion_percent),1) as avg_completion,
      ROUND(COALESCE(SUM(revenue),0) * 1.0 / COUNT(*), 2) as revenue_per_student
      FROM enrollments GROUP BY course_name, course_level ORDER BY total_revenue DESC
    `);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====== GET /api/dashboard/marketing ======
router.get('/marketing', (req, res) => {
  try {
    const platforms = queryAll(`
      SELECT platform, ROUND(SUM(spend),2) as total_spend, SUM(impressions) as total_impressions,
      SUM(clicks) as total_clicks, SUM(conversions) as total_conversions,
      CASE WHEN SUM(conversions) > 0 THEN ROUND(SUM(spend) / SUM(conversions), 2) ELSE 0 END as cpa,
      CASE WHEN SUM(clicks) > 0 THEN ROUND(SUM(clicks) * 100.0 / SUM(impressions), 2) ELSE 0 END as ctr,
      CASE WHEN SUM(clicks) > 0 THEN ROUND(SUM(spend) / SUM(clicks), 2) ELSE 0 END as cpc
      FROM ad_spend GROUP BY platform ORDER BY total_spend DESC
    `);

    const totalRevenue = queryOne('SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE is_refund = 0');
    const totalSpend = queryOne('SELECT COALESCE(SUM(spend),0) as total FROM ad_spend');
    
    const dailySpend = queryAll(`
      SELECT date, SUM(spend) as spend, SUM(clicks) as clicks, SUM(conversions) as conversions
      FROM ad_spend WHERE date >= date('now', '-30 days') GROUP BY date ORDER BY date ASC
    `);

    const trafficSplit = queryOne(`
      SELECT SUM(source_organic) as organic, SUM(source_paid) as paid, SUM(source_social) as social, SUM(source_direct) as direct
      FROM traffic WHERE date >= date('now', '-30 days')
    `);

    res.json({
      platforms: platforms.map(p => ({
        ...p,
        roas: (totalSpend?.total || 0) > 0 ? Math.round(((totalRevenue?.total || 0) / totalSpend.total) * (p.total_spend / totalSpend.total) * 100) / 100 : 0,
      })),
      overall_roas: (totalSpend?.total || 0) > 0 ? Math.round(((totalRevenue?.total || 0) / totalSpend.total) * 100) / 100 : 0,
      daily_spend: dailySpend,
      traffic_split: trafficSplit,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====== GET /api/dashboard/actions ======
router.get('/actions', (req, res) => {
  try {
    const latest = queryAll('SELECT * FROM daily_actions ORDER BY date DESC LIMIT 7');
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====== GET /api/dashboard/trends ======
router.get('/trends', (req, res) => {
  try {
    const data = queryAll(`
      SELECT date, total_revenue, new_customers, conversion_rate, aov, cpa, roas, refund_rate, checkout_abandonment
      FROM daily_kpis WHERE date >= date('now', '-60 days') ORDER BY date ASC
    `);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====== GET /api/dashboard/traffic ======
router.get('/traffic', (req, res) => {
  try {
    const data = queryAll("SELECT * FROM traffic WHERE date >= date('now', '-30 days') ORDER BY date ASC");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
