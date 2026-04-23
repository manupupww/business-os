const express = require('express');
const { queryAll, queryOne, runSql, saveDb } = require('../db');

const router = express.Router();

// ====== POST /api/actions ======
router.post('/', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const weekKpis = queryAll('SELECT * FROM daily_kpis WHERE date >= date(?, \'-7 days\') ORDER BY date DESC', [today]);
    const prevWeekKpis = queryAll('SELECT * FROM daily_kpis WHERE date >= date(?, \'-14 days\') AND date < date(?, \'-7 days\') ORDER BY date DESC', [today, today]);

    const courseData = queryAll(`
      SELECT course_name, course_level, COUNT(*) as enrollments,
      AVG(completion_percent) as avg_completion, SUM(revenue) as total_revenue
      FROM enrollments GROUP BY course_name
    `);

    const adData = queryAll(`
      SELECT platform, SUM(spend) as total_spend, SUM(conversions) as total_conversions,
      CASE WHEN SUM(conversions) > 0 THEN ROUND(SUM(spend)/SUM(conversions),2) ELSE 0 END as cpa
      FROM ad_spend WHERE date >= date(?, '-7 days') GROUP BY platform
    `, [today]);

    const thisWeekTraffic = queryOne("SELECT SUM(source_organic) as organic FROM traffic WHERE date >= date(?, '-7 days')", [today]);
    const prevWeekTraffic = queryOne("SELECT SUM(source_organic) as organic FROM traffic WHERE date >= date(?, '-14 days') AND date < date(?, '-7 days')", [today, today]);

    // Calculate metrics
    const avgRefundRate = weekKpis.length > 0 ? weekKpis.reduce((s, k) => s + k.refund_rate, 0) / weekKpis.length : 0;
    const avgConversion = weekKpis.length > 0 ? weekKpis.reduce((s, k) => s + k.conversion_rate, 0) / weekKpis.length : 0;
    const prevConversion = prevWeekKpis.length > 0 ? prevWeekKpis.reduce((s, k) => s + k.conversion_rate, 0) / prevWeekKpis.length : 0;
    const avgAbandonment = weekKpis.length > 0 ? weekKpis.reduce((s, k) => s + k.checkout_abandonment, 0) / weekKpis.length : 0;
    const avgAov = weekKpis.length > 0 ? weekKpis.reduce((s, k) => s + k.aov, 0) / weekKpis.length : 0;
    const totalRevenue = weekKpis.reduce((s, k) => s + k.total_revenue, 0);
    const zeroRevenueDays = weekKpis.filter(k => k.total_revenue === 0).length;

    // ===== URGENT =====
    let urgentAction = '✅ Nėra jokių skubių problemų. Verslo rodikliai puikūs.';
    if (zeroRevenueDays >= 2) {
      urgentAction = `🚨 Pajamų nėra jau ${zeroRevenueDays} d. — patikrink, ar veikia atsiskaitymo sistema.`;
    } else if (avgRefundRate > 5) {
      const worst = courseData.length > 0 ? courseData.reduce((w, c) => c.avg_completion < w.avg_completion ? c : w) : { course_name: 'Nežinomas' };
      urgentAction = `⚠️ Grąžinimų dalis siekia ${avgRefundRate.toFixed(1)}% — peržiūrėk kurso "${worst.course_name}" kokybę.`;
    } else {
      const convDrop = prevConversion > 0 ? ((prevConversion - avgConversion) / prevConversion) * 100 : 0;
      if (convDrop > 20) {
        urgentAction = `⚠️ Pirkimų procentas nukrito ${convDrop.toFixed(0)}% lyginti su praėjusia savaite — patikrink atsiskaitymo puslapį.`;
      }
    }

    // ===== OPTIMIZE =====
    let optimizeAction = 'Visi optimizavimo rodikliai šią savaitę puikūs.';
    if (avgAbandonment > 60) {
      optimizeAction = `Krepšelio atsisakymas yra ${avgAbandonment.toFixed(0)}% — supaprastink atsiskaitymą ir pridėk saugumo ženklus.`;
    } else if (courseData.length > 0) {
      const topCourse = courseData.reduce((t, c) => c.total_revenue > t.total_revenue ? c : t);
      const totalCourseRev = courseData.reduce((s, c) => s + c.total_revenue, 0);
      const topShare = totalCourseRev > 0 ? (topCourse.total_revenue / totalCourseRev) * 100 : 0;
      if (topShare > 60) {
        optimizeAction = `"${topCourse.course_name}" atneša ${topShare.toFixed(0)}% pajamų — reklamuok ir kitus kursus.`;
      } else if (avgAov < 50) {
        optimizeAction = `Vidutinė krepšelio vertė tik €${avgAov.toFixed(0)} — sukurk kursų paketus.`;
      }
    }

    // ===== GROWTH =====
    let growthAction = 'Išbandyk naujas antraštes pardavimų puslapyje (A/B testavimas).';
    if (courseData.length > 0) {
      const avgEnr = courseData.reduce((s, c) => s + c.enrollments, 0) / courseData.length;
      const gem = courseData.find(c => c.avg_completion > 70 && c.enrollments < avgEnr);
      if (gem) {
        growthAction = `"${gem.course_name}" užbaigiamas net ${gem.avg_completion.toFixed(0)}%, bet turi mažai studentų — kelk jį į pagrindinį puslapį.`;
      } else {
        const organicGrowth = (prevWeekTraffic?.organic || 0) > 0 ? (((thisWeekTraffic?.organic || 0) - prevWeekTraffic.organic) / prevWeekTraffic.organic) * 100 : 0;
        if (organicGrowth > 10) {
          growthAction = `Organinis srautas paaugo ${organicGrowth.toFixed(0)}% — investuok į SEO ir turinio rinkodarą.`;
        }
      }
    }

    // Save
    const existing = queryOne('SELECT id FROM daily_actions WHERE date = ?', [today]);
    if (existing) {
      runSql("UPDATE daily_actions SET urgent_action = ?, optimize_action = ?, growth_action = ?, status = 'new' WHERE date = ?", [urgentAction, optimizeAction, growthAction, today]);
    } else {
      runSql("INSERT INTO daily_actions (date, urgent_action, optimize_action, growth_action, status) VALUES (?, ?, ?, ?, 'new')", [today, urgentAction, optimizeAction, growthAction]);
    }
    saveDb();

    res.json({ success: true, date: today, actions: { urgent: urgentAction, optimize: optimizeAction, growth: growthAction } });
  } catch (err) {
    console.error('Action generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ====== PATCH /api/actions/:id/status ======
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'in_progress', 'done', 'skipped'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    runSql('UPDATE daily_actions SET status = ? WHERE id = ?', [status, parseInt(req.params.id)]);
    saveDb();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
