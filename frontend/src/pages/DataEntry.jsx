import { useState, useEffect } from 'react';
import { postData, recalculateKpis, generateActions } from '../api';

const COURSES = [
  { name: 'Anglų k. Pradedantiesiems A1', level: 'A1', price: 49 },
  { name: 'Anglų k. Pagrindai A2', level: 'A2', price: 69 },
  { name: 'Anglų k. Vidutiniokams B1', level: 'B1', price: 89 },
  { name: 'Anglų k. Pažengusiems B2', level: 'B2', price: 109 },
];

export default function DataEntry() {
  const [tab, setTab] = useState('traffic');
  const [toast, setToast] = useState(null);
  const today = new Date().toISOString().split('T')[0];

  const [traffic, setTraffic] = useState({ date: today, total_visitors: '', sales_page_views: '', checkout_page_views: '', source_organic: '', source_paid: '', source_social: '', source_direct: '' });
  const [enrollment, setEnrollment] = useState({ date: today, student_email: '', course_idx: 0, completion_percent: 0 });
  const [adSpend, setAdSpend] = useState({ date: today, platform: 'Meta', campaign_name: '', spend: '', impressions: '', clicks: '', conversions: '' });

  useEffect(() => {
    document.getElementById('page-title').textContent = '➕ Duomenų Įvedimas';
  }, []);

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function submitTraffic(e) {
    e.preventDefault();
    try {
      const res = await postData('manual-traffic', { ...traffic, total_visitors: +traffic.total_visitors, sales_page_views: +traffic.sales_page_views, checkout_page_views: +traffic.checkout_page_views, source_organic: +traffic.source_organic, source_paid: +traffic.source_paid, source_social: +traffic.source_social, source_direct: +traffic.source_direct });
      if (res.success) { showToast('success', 'Srautas įrašytas!'); setTraffic({ ...traffic, total_visitors: '', sales_page_views: '', checkout_page_views: '', source_organic: '', source_paid: '', source_social: '', source_direct: '' }); }
    } catch { showToast('error', 'Nepavyko įrašyti srauto'); }
  }

  async function submitEnrollment(e) {
    e.preventDefault();
    const course = COURSES[enrollment.course_idx];
    try {
      const res = await postData('manual-enrollment', { date: enrollment.date, student_email: enrollment.student_email, course_name: course.name, course_level: course.level, completion_percent: +enrollment.completion_percent, revenue: course.price });
      if (res.success) { showToast('success', 'Registracija įrašyta!'); setEnrollment({ ...enrollment, student_email: '', completion_percent: 0 }); }
    } catch { showToast('error', 'Nepavyko įrašyti registracijos'); }
  }

  async function submitAdSpend(e) {
    e.preventDefault();
    try {
      const res = await postData('manual-ad-spend', { ...adSpend, spend: +adSpend.spend, impressions: +adSpend.impressions, clicks: +adSpend.clicks, conversions: +adSpend.conversions });
      if (res.success) { showToast('success', 'Reklamos išlaidos įrašytos!'); setAdSpend({ ...adSpend, campaign_name: '', spend: '', impressions: '', clicks: '', conversions: '' }); }
    } catch { showToast('error', 'Nepavyko įrašyti reklamos išlaidų'); }
  }

  return (
    <>
      <div className="tabs">
        {['traffic', 'enrollment', 'adspend', 'tools'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'traffic' ? '🌐 Srautas' : t === 'enrollment' ? '🎓 Registracija' : t === 'adspend' ? '💰 Reklamos Išlaidos' : '⚙️ Įrankiai'}
          </button>
        ))}
      </div>

      <div className="chart-card">
        {tab === 'traffic' && (
          <form onSubmit={submitTraffic}>
            <div className="chart-title" style={{ marginBottom: 20 }}>Įvesti Srauto Duomenis</div>
            <div className="form-group">
              <label>Data</label>
              <input type="date" className="form-input" value={traffic.date} onChange={e => setTraffic({ ...traffic, date: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group"><label>Viso Lankytojų</label><input type="number" className="form-input" placeholder="pvz. 1200" value={traffic.total_visitors} onChange={e => setTraffic({ ...traffic, total_visitors: e.target.value })} required /></div>
              <div className="form-group"><label>Pardavimų Puslapio Peržiūros</label><input type="number" className="form-input" placeholder="pvz. 300" value={traffic.sales_page_views} onChange={e => setTraffic({ ...traffic, sales_page_views: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Atsiskaitymo Peržiūros</label><input type="number" className="form-input" placeholder="pvz. 50" value={traffic.checkout_page_views} onChange={e => setTraffic({ ...traffic, checkout_page_views: e.target.value })} /></div>
              <div className="form-group"><label>Organinis</label><input type="number" className="form-input" value={traffic.source_organic} onChange={e => setTraffic({ ...traffic, source_organic: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Mokamas</label><input type="number" className="form-input" value={traffic.source_paid} onChange={e => setTraffic({ ...traffic, source_paid: e.target.value })} /></div>
              <div className="form-group"><label>Socialinis</label><input type="number" className="form-input" value={traffic.source_social} onChange={e => setTraffic({ ...traffic, source_social: e.target.value })} /></div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>📊 Įrašyti Srautą</button>
          </form>
        )}

        {tab === 'enrollment' && (
          <form onSubmit={submitEnrollment}>
            <div className="chart-title" style={{ marginBottom: 20 }}>Įvesti Naują Registraciją</div>
            <div className="form-row">
              <div className="form-group"><label>Data</label><input type="date" className="form-input" value={enrollment.date} onChange={e => setEnrollment({ ...enrollment, date: e.target.value })} /></div>
              <div className="form-group"><label>Studento El. Paštas</label><input type="email" className="form-input" placeholder="studentas@email.com" value={enrollment.student_email} onChange={e => setEnrollment({ ...enrollment, student_email: e.target.value })} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Kursas</label>
                <select className="form-select" value={enrollment.course_idx} onChange={e => setEnrollment({ ...enrollment, course_idx: +e.target.value })}>
                  {COURSES.map((c, i) => <option key={i} value={i}>{c.name} — €{c.price}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Užbaigimo %</label><input type="range" min="0" max="100" value={enrollment.completion_percent} onChange={e => setEnrollment({ ...enrollment, completion_percent: e.target.value })} style={{ width: '100%', marginTop: 8 }} /><span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{enrollment.completion_percent}%</span></div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>🎓 Įrašyti Registraciją</button>
          </form>
        )}

        {tab === 'adspend' && (
          <form onSubmit={submitAdSpend}>
            <div className="chart-title" style={{ marginBottom: 20 }}>Įvesti Reklamos Išlaidas</div>
            <div className="form-row">
              <div className="form-group"><label>Data</label><input type="date" className="form-input" value={adSpend.date} onChange={e => setAdSpend({ ...adSpend, date: e.target.value })} /></div>
              <div className="form-group"><label>Platforma</label>
                <select className="form-select" value={adSpend.platform} onChange={e => setAdSpend({ ...adSpend, platform: e.target.value })}>
                  <option value="Meta">Meta</option><option value="Google">Google</option><option value="Other">Kita</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label>Kampanijos Pavadinimas</label><input type="text" className="form-input" placeholder="pvz. Anglų Kursas - Platus" value={adSpend.campaign_name} onChange={e => setAdSpend({ ...adSpend, campaign_name: e.target.value })} /></div>
            <div className="form-row">
              <div className="form-group"><label>Išlaidos €</label><input type="number" step="0.01" className="form-input" placeholder="50.00" value={adSpend.spend} onChange={e => setAdSpend({ ...adSpend, spend: e.target.value })} required /></div>
              <div className="form-group"><label>Parodymai</label><input type="number" className="form-input" value={adSpend.impressions} onChange={e => setAdSpend({ ...adSpend, impressions: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Paspaudimai</label><input type="number" className="form-input" value={adSpend.clicks} onChange={e => setAdSpend({ ...adSpend, clicks: e.target.value })} /></div>
              <div className="form-group"><label>Pirkimai</label><input type="number" className="form-input" value={adSpend.conversions} onChange={e => setAdSpend({ ...adSpend, conversions: e.target.value })} /></div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>💰 Įrašyti Reklamos Išlaidas</button>
          </form>
        )}

        {tab === 'tools' && (
          <div>
            <div className="chart-title" style={{ marginBottom: 20 }}>Sistemos Įrankiai</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={async () => { const r = await recalculateKpis(); showToast(r.success ? 'success' : 'error', r.success ? 'Rodikliai perskaičiuoti!' : 'Nepavyko'); }}>
                📊 Perskaičiuoti Rodiklius
              </button>
              <button className="btn btn-success" onClick={async () => { const r = await generateActions(); showToast(r.success ? 'success' : 'error', r.success ? 'Veiksmai sugeneruoti!' : 'Nepavyko'); }}>
                🤖 Generuoti AI Veiksmus
              </button>
            </div>
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                <strong style={{ color: 'var(--text-primary)' }}>ℹ️ Kaip tai veikia:</strong><br />
                1. Kasdien įvesk srauto, registracijų ir reklamos duomenis<br />
                2. Spausk "Perskaičiuoti Rodiklius" kad atnaujintum šiandienos rezultatus<br />
                3. Spausk "Generuoti AI Veiksmus" protingoms rekomendacijoms<br />
                4. Tikrink Apžvalgos ir Veiksmų puslapius įžvalgoms
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
