const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'business_os.db');

let db = null;
let dbReady = null;

// Save database to disk periodically
function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Initialize database
async function initDb() {
  if (db) return db;
  
  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('  📂 Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('  📦 Created new database');
  }
  
  db.run('PRAGMA foreign_keys = ON');
  initializeTables();
  return db;
}

function getDbReady() {
  if (!dbReady) {
    dbReady = initDb();
  }
  return dbReady;
}

function getDb() {
  return db;
}

function initializeTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'EUR',
      product_id TEXT,
      product_name TEXT,
      customer_email TEXT,
      payment_type TEXT,
      is_refund INTEGER DEFAULT 0,
      stripe_charge_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS traffic (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      total_visitors INTEGER DEFAULT 0,
      sales_page_views INTEGER DEFAULT 0,
      checkout_page_views INTEGER DEFAULT 0,
      source_organic INTEGER DEFAULT 0,
      source_paid INTEGER DEFAULT 0,
      source_social INTEGER DEFAULT 0,
      source_direct INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      student_email TEXT,
      course_name TEXT NOT NULL,
      course_level TEXT,
      completion_percent REAL DEFAULT 0,
      revenue REAL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ad_spend (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      platform TEXT,
      campaign_name TEXT,
      spend REAL DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS daily_kpis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      total_revenue REAL DEFAULT 0,
      new_customers INTEGER DEFAULT 0,
      conversion_rate REAL DEFAULT 0,
      aov REAL DEFAULT 0,
      cpa REAL DEFAULT 0,
      roas REAL DEFAULT 0,
      refund_rate REAL DEFAULT 0,
      checkout_abandonment REAL DEFAULT 0,
      mrr REAL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS daily_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      urgent_action TEXT,
      optimize_action TEXT,
      growth_action TEXT,
      status TEXT DEFAULT 'new',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
}

// ====== HELPER: query helpers for sql.js ======
// sql.js returns arrays of arrays, these helpers convert to objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

function runSql(sql, params = []) {
  if (params.length) {
    const stmt = db.prepare(sql);
    stmt.run(params);
    stmt.free();
  } else {
    db.run(sql);
  }
}

// ====== SEED DATA GENERATION ======
function seedDatabase() {
  const check = queryOne('SELECT COUNT(*) as count FROM transactions');
  if (check && check.count > 0) {
    console.log('  Database already has data, skipping seed.');
    return;
  }

  console.log('  🌱 Seeding database with 60 days of realistic data...');

  const courses = [
    { id: 'course_a1', name: 'Anglų k. Pradedantiesiems A1', level: 'A1', price: 49 },
    { id: 'course_a2', name: 'Anglų k. Pagrindai A2', level: 'A2', price: 69 },
    { id: 'course_b1', name: 'Anglų k. Vidutiniokams B1', level: 'B1', price: 89 },
    { id: 'course_b2', name: 'Anglų k. Pažengusiems B2', level: 'B2', price: 109 },
  ];

  const now = new Date();
  
  for (let dayOffset = 60; dayOffset >= 0; dayOffset--) {
    const d = new Date(now);
    d.setDate(d.getDate() - dayOffset);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const growthFactor = 0.7 + (60 - dayOffset) * 0.01;
    const weekendFactor = isWeekend ? 0.55 : 1.0;
    
    // ---- TRAFFIC ----
    const baseVisitors = Math.floor((800 + Math.random() * 400) * growthFactor * weekendFactor);
    const salesPageViews = Math.floor(baseVisitors * (0.25 + Math.random() * 0.1));
    const checkoutPageViews = Math.floor(salesPageViews * (0.15 + Math.random() * 0.08));
    const organic = Math.floor(baseVisitors * (0.35 + Math.random() * 0.1));
    const paid = Math.floor(baseVisitors * (0.30 + Math.random() * 0.1));
    const social = Math.floor(baseVisitors * (0.15 + Math.random() * 0.05));
    const direct = Math.max(0, baseVisitors - organic - paid - social);

    runSql(
      'INSERT INTO traffic (date, total_visitors, sales_page_views, checkout_page_views, source_organic, source_paid, source_social, source_direct) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [dateStr, baseVisitors, salesPageViews, checkoutPageViews, organic, paid, social, direct]
    );

    // ---- TRANSACTIONS ----
    const numSales = Math.floor((3 + Math.random() * 5) * growthFactor * weekendFactor);
    let dayRevenue = 0;
    let dayCustomers = 0;
    
    for (let s = 0; s < numSales; s++) {
      const course = courses[Math.floor(Math.random() * courses.length)];
      const isRefund = Math.random() < 0.04;
      const amount = isRefund ? -course.price : course.price;
      const email = `student${Math.floor(Math.random() * 9000) + 1000}@gmail.com`;
      
      runSql(
        'INSERT INTO transactions (date, amount, product_id, product_name, customer_email, payment_type, is_refund) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [dateStr, amount, course.id, course.name, email, 'one-time', isRefund ? 1 : 0]
      );
      
      if (!isRefund) {
        dayRevenue += course.price;
        dayCustomers++;
        
        const completion = Math.min(100, Math.floor(Math.random() * (60 - dayOffset) * 2));
        runSql(
          'INSERT INTO enrollments (date, student_email, course_name, course_level, completion_percent, revenue) VALUES (?, ?, ?, ?, ?, ?)',
          [dateStr, email, course.name, course.level, completion, course.price]
        );
      }
    }

    // ---- AD SPEND ----
    const metaSpend = Math.round((30 + Math.random() * 40) * growthFactor * 100) / 100;
    const metaImpressions = Math.floor(metaSpend * (80 + Math.random() * 40));
    const metaClicks = Math.floor(metaImpressions * (0.015 + Math.random() * 0.01));
    const metaConversions = Math.floor(metaClicks * (0.03 + Math.random() * 0.02));

    runSql(
      'INSERT INTO ad_spend (date, platform, campaign_name, spend, impressions, clicks, conversions) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [dateStr, 'Meta', 'Anglų k. Kursas - Platus', metaSpend, metaImpressions, metaClicks, metaConversions]
    );

    const googleSpend = Math.round((20 + Math.random() * 30) * growthFactor * 100) / 100;
    const googleImpressions = Math.floor(googleSpend * (60 + Math.random() * 30));
    const googleClicks = Math.floor(googleImpressions * (0.025 + Math.random() * 0.015));
    const googleConversions = Math.floor(googleClicks * (0.04 + Math.random() * 0.02));

    runSql(
      'INSERT INTO ad_spend (date, platform, campaign_name, spend, impressions, clicks, conversions) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [dateStr, 'Google', 'Anglų k. Raktažodžiai', googleSpend, googleImpressions, googleClicks, googleConversions]
    );

    // ---- DAILY KPIs ----
    const totalAdSpend = metaSpend + googleSpend;
    const conversionRate = checkoutPageViews > 0 ? Math.round((numSales / checkoutPageViews) * 10000) / 100 : 0;
    const aov = dayCustomers > 0 ? Math.round((dayRevenue / dayCustomers) * 100) / 100 : 0;
    const cpa = dayCustomers > 0 ? Math.round((totalAdSpend / dayCustomers) * 100) / 100 : 0;
    const roas = totalAdSpend > 0 ? Math.round((dayRevenue / totalAdSpend) * 100) / 100 : 0;
    const refundRate = numSales > 0 ? Math.round(((numSales - dayCustomers) / numSales) * 10000) / 100 : 0;
    const checkoutAbandonment = checkoutPageViews > 0 ? Math.round(((checkoutPageViews - numSales) / checkoutPageViews) * 10000) / 100 : 0;
    const mrr = dayRevenue * 0.15;

    runSql(
      'INSERT INTO daily_kpis (date, total_revenue, new_customers, conversion_rate, aov, cpa, roas, refund_rate, checkout_abandonment, mrr) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [dateStr, dayRevenue, dayCustomers, conversionRate, aov, cpa, roas, Math.max(0, refundRate), Math.max(0, checkoutAbandonment), mrr]
    );
  }

  // ---- SEED ACTIONS for last 7 days ----
  const urgentActions = [
    '⚠️ Grąžinimų dalis siekia 5.2% šią savaitę — peržiūrėk "Anglų k. Pradedantiesiems A1" kurso kokybę.',
    '✅ Nėra jokių skubių problemų. Verslo rodikliai puikūs.',
    '⚠️ Pirkimų procentas nukrito 18% lyginant su praėjusia savaite — patikrink atsiskaitymo puslapį.',
    '✅ Visos sistemos veikia puikiai. Pajamos ir konversijos stabilios.',
    '⚠️ Meta Ads reklamos grąža nukrito iki 0.9 — apsvarstyk galimybę išjungti neefektyvias reklamas.',
    '✅ Nėra jokių skubių problemų. Visi reklamos kanalai veikia efektyviai.',
    '⚠️ Atsiskaitymo nutraukimas išaugo iki 72% — patikrink atsiskaitymo procesą ir mokėjimų sistemą.'
  ];
  const optimizeActions = [
    'Atsiskaitymo nutraukimas yra 58% — supaprastink atsiskaitymą, pridėk saugumo ženklus.',
    '"Anglų k. Pradedantiesiems A1" atneša 45% pajamų — agresyviau reklamuok B1 ir B2 kursus.',
    'Vidutinė krepšelio vertė yra €67 — išbandyk A1+A2 kursų paketą su nuolaida.',
    'Kliento kaina padidėjo 12% per 3 savaites — atnaujink reklamos vizualus.',
    'Išbandyk iššokantį langą prieš atsiskaitymą (exit-intent) — tai gali išgelbėti 8-12% krepšelių.',
    'B2 kurso užbaigimas tik 34% — suskaidyk turinį į trumpesnius modulius.',
    'El. laiškų atidarymo procentas mažėja — A/B testuok temų pavadinimus ir siuntimo laikus.'
  ];
  const growthActions = [
    '"Anglų k. Vidutiniokams B1" užbaigiamas net 78%, bet turi mažai studentų — kelk jį į pagrindinį puslapį.',
    'Organinis srautas paaugo 15% — šią savaitę padvigubink pastangas SEO turiniui.',
    'Google Ads turi 40% pigesnį kliento įsigijimą nei Meta — padidink biudžetą 25%.',
    'Tik 12% pajamų yra pasikartojančios — paleisk €19/mėn. "Anglų k. Praktikos Klubas" prenumeratą.',
    'Paleisk rekomendacijų (referral) programą — aukštas užbaigimo procentas rodo laimingus studentus.',
    'YouTube gali atnešti nemokamo srauto — sukurk 3-5 trumpas pamokas.',
    'Išbandyk "pirma pamoka nemokamai" piltuvėlį — tai gali stipriai padidinti pardavimus.'
  ];

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const d = new Date(now);
    d.setDate(d.getDate() - dayOffset);
    const dateStr = d.toISOString().split('T')[0];
    runSql(
      'INSERT INTO daily_actions (date, urgent_action, optimize_action, growth_action, status) VALUES (?, ?, ?, ?, ?)',
      [dateStr, urgentActions[dayOffset % 7], optimizeActions[dayOffset % 7], growthActions[dayOffset % 7], dayOffset > 3 ? 'done' : dayOffset > 1 ? 'in_progress' : 'new']
    );
  }

  saveDb();
  console.log('  ✅ Database seeded successfully!');
}

module.exports = { getDbReady, getDb, seedDatabase, queryAll, queryOne, runSql, saveDb };
