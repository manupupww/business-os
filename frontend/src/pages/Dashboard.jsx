import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchSummary, fetchRevenueChart, fetchActions } from '../api';

function fmt(n) { return '€' + (n || 0).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function fmtDec(n) { return (n || 0).toFixed(2); }
function pct(n) { return (n || 0).toFixed(1) + '%'; }

function ChangeTag({ value }) {
  if (!value || value === 0) return <span className="kpi-change neutral">→ 0%</span>;
  const isPos = value > 0;
  return (
    <span className={`kpi-change ${isPos ? 'positive' : 'negative'}`}>
      {isPos ? '↑' : '↓'} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [chart, setChart] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.getElementById('page-title').textContent = 'Bendra Apžvalga';
    Promise.all([fetchSummary(), fetchRevenueChart(30), fetchActions()])
      .then(([s, c, a]) => { setSummary(s); setChart(c); setActions(a); setLoading(false); })
      .catch(() => setLoading(false));
    const interval = setInterval(() => {
      fetchSummary().then(setSummary).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading-screen">Kraunami duomenys...</div>;
  if (!summary) return <div className="loading-screen">Nepavyko užkrauti duomenų. Ar backend'as veikia ant 3001 porto?</div>;

  const { today, week, month, totals } = summary;
  const latestAction = actions[0] || {};

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-header">
            <span className="kpi-label">Savaitės Pajamos</span>
            <span className="kpi-icon">💰</span>
          </div>
          <div className="kpi-value">{fmt(week.revenue)}</div>
          <ChangeTag value={week.revenue_change} />
        </div>

        <div className="kpi-card green">
          <div className="kpi-header">
            <span className="kpi-label">Pirkimų Procentas</span>
            <span className="kpi-icon">🎯</span>
          </div>
          <div className="kpi-value">{pct(week.conversion_rate)}</div>
          <ChangeTag value={week.conversion_change} />
        </div>

        <div className="kpi-card yellow">
          <div className="kpi-header">
            <span className="kpi-label">Kliento Kaina</span>
            <span className="kpi-icon">💳</span>
          </div>
          <div className="kpi-value">{fmt(week.cpa)}</div>
          <ChangeTag value={-week.cpa_change} />
        </div>

        <div className="kpi-card purple">
          <div className="kpi-header">
            <span className="kpi-label">Reklamos Grąža</span>
            <span className="kpi-icon">📈</span>
          </div>
          <div className="kpi-value">{fmtDec(week.roas)}x</div>
          <ChangeTag value={week.roas_change} />
        </div>

        <div className="kpi-card green">
          <div className="kpi-header">
            <span className="kpi-label">Nauji Studentai</span>
            <span className="kpi-icon">🎓</span>
          </div>
          <div className="kpi-value">{week.customers}</div>
          <ChangeTag value={week.customers_change} />
        </div>

        <div className="kpi-card blue">
          <div className="kpi-header">
            <span className="kpi-label">Mėnesio Pajamos</span>
            <span className="kpi-icon">📊</span>
          </div>
          <div className="kpi-value">{fmt(month.revenue)}</div>
          <ChangeTag value={month.revenue_change} />
        </div>
      </div>

      <div className="grid-60-40">
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Pajamų Tendencija</div>
              <div className="chart-subtitle">Paskutinės 30 dienų • Visi produktai</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{fmt(month.revenue)}</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tickFormatter={d => d.slice(5)} stroke="#27272a" tick={{ fill: '#52525b', fontSize: 11 }} />
              <YAxis stroke="#27272a" tick={{ fill: '#52525b', fontSize: 11 }} tickFormatter={v => '€' + v} />
              <Tooltip contentStyle={{ background: '#121214', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa' }}
                formatter={v => ['€' + v.toFixed(0), 'Pajamos']} labelStyle={{ color: '#a1a1aa' }} />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Šiandienos Veiksmai</div>
              <div className="chart-subtitle">AI rekomendacijos</div>
            </div>
          </div>

          <div className="action-card urgent">
            <div className="action-type">🔴 Skubu</div>
            <div className="action-text">{latestAction.urgent_action || 'Nėra duomenų'}</div>
          </div>

          <div className="action-card optimize">
            <div className="action-type">🟡 Optimizuoti</div>
            <div className="action-text">{latestAction.optimize_action || 'Nėra duomenų'}</div>
          </div>

          <div className="action-card growth">
            <div className="action-type">🟢 Augimas</div>
            <div className="action-text">{latestAction.growth_action || 'Nėra duomenų'}</div>
          </div>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-card blue">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Visos Pajamos</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{fmt(totals.all_time_revenue)}</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Viso Studentų</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{totals.total_students}</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Grąžinimų Dalys</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{pct(week.refund_rate)}</div>
        </div>
        <div className="kpi-card yellow">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Vid. Krepšelio Vertė</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{fmt(week.aov)}</div>
        </div>
      </div>
    </>
  );
}
