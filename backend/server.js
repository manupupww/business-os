const express = require('express');
const cors = require('cors');
const { getDbReady, getDb, seedDatabase, queryAll, queryOne, runSql, saveDb } = require('./db');
const dashboardRoutes = require('./routes/dashboard');
const syncRoutes = require('./routes/sync');
const actionsRoutes = require('./routes/actions');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Start server after DB is ready
async function start() {
  console.log('🗄️  Initializing database...');
  await getDbReady();
  seedDatabase();

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/sync', syncRoutes);
  app.use('/api/actions', actionsRoutes);

  // POST /api/recalculate-kpis
  app.post('/api/recalculate-kpis', (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const transactions = queryOne(`
        SELECT COUNT(*) as count, COALESCE(SUM(CASE WHEN is_refund = 0 THEN amount ELSE 0 END), 0) as revenue,
        COALESCE(SUM(CASE WHEN is_refund = 1 THEN 1 ELSE 0 END), 0) as refunds
        FROM transactions WHERE date = ?
      `, [today]);

      const traffic = queryOne('SELECT COALESCE(SUM(total_visitors),0) as visitors, COALESCE(SUM(checkout_page_views),0) as checkouts FROM traffic WHERE date = ?', [today]);
      const ads = queryOne('SELECT COALESCE(SUM(spend),0) as total_spend FROM ad_spend WHERE date = ?', [today]);

      const revenue = transactions?.revenue || 0;
      const customers = (transactions?.count || 0) - (transactions?.refunds || 0);
      const convRate = (traffic?.checkouts || 0) > 0 ? (customers / traffic.checkouts) * 100 : 0;
      const aov = customers > 0 ? revenue / customers : 0;
      const cpa = customers > 0 ? (ads?.total_spend || 0) / customers : 0;
      const roas = (ads?.total_spend || 0) > 0 ? revenue / ads.total_spend : 0;
      const refundRate = (transactions?.count || 0) > 0 ? ((transactions?.refunds || 0) / transactions.count) * 100 : 0;
      const abandonment = (traffic?.checkouts || 0) > 0 ? ((traffic.checkouts - customers) / traffic.checkouts) * 100 : 0;

      const existing = queryOne('SELECT id FROM daily_kpis WHERE date = ?', [today]);
      if (existing) {
        runSql('UPDATE daily_kpis SET total_revenue=?, new_customers=?, conversion_rate=?, aov=?, cpa=?, roas=?, refund_rate=?, checkout_abandonment=? WHERE date = ?',
          [revenue, customers, convRate, aov, cpa, roas, refundRate, abandonment, today]);
      } else {
        runSql('INSERT INTO daily_kpis (date, total_revenue, new_customers, conversion_rate, aov, cpa, roas, refund_rate, checkout_abandonment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [today, revenue, customers, convRate, aov, cpa, roas, refundRate, abandonment]);
      }
      saveDb();
      res.json({ success: true, message: 'KPIs recalculated' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.listen(PORT, () => {
    console.log(`\n🚀 Business OS Backend running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Dashboard: http://localhost:${PORT}/api/dashboard/summary\n`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
