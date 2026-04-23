import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { fetchSummary, fetchRevenueChart, fetchTrends } from '../api';

function fmt(n) { return '€' + (n || 0).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

export default function Revenue() {
  const [summary, setSummary] = useState(null);
  const [chart30, setChart30] = useState([]);
  const [chart60, setChart60] = useState([]);
  const [trends, setTrends] = useState([]);
  const [range, setRange] = useState(30);

  useEffect(() => {
    document.getElementById('page-title').textContent = '💰 Pajamų Centras';
    Promise.all([fetchSummary(), fetchRevenueChart(30), fetchRevenueChart(60), fetchTrends()])
      .then(([s, c30, c60, t]) => { setSummary(s); setChart30(c30); setChart60(c60); setTrends(t); });
  }, []);

  if (!summary) return <div className="loading-screen">Kraunami pajamų duomenys...</div>;

  const chartData = range === 30 ? chart30 : chart60;
  const { week, month, totals } = summary;

  const avgDaily = chartData.length > 0 ? chartData.reduce((s, d) => s + d.revenue, 0) / chartData.length : 0;
  const bestDay = chartData.length > 0 ? chartData.reduce((b, d) => d.revenue > b.revenue ? d : b, chartData[0]) : {};

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Šiandien</div>
          <div className="kpi-value">{fmt(summary.today.revenue)}</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Ši Savaitė</div>
          <div className="kpi-value">{fmt(week.revenue)}</div>
          <span className={`kpi-change ${week.revenue_change >= 0 ? 'positive' : 'negative'}`}>
            {week.revenue_change >= 0 ? '↑' : '↓'} {Math.abs(week.revenue_change).toFixed(1)}% lyg. su praėj. sav.
          </span>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Šis Mėnuo</div>
          <div className="kpi-value">{fmt(month.revenue)}</div>
          <span className={`kpi-change ${month.revenue_change >= 0 ? 'positive' : 'negative'}`}>
            {month.revenue_change >= 0 ? '↑' : '↓'} {Math.abs(month.revenue_change).toFixed(1)}%
          </span>
        </div>
        <div className="kpi-card yellow">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Viso Laikų</div>
          <div className="kpi-value">{fmt(totals.all_time_revenue)}</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">Pajamos Per Laikotarpį</div>
            <div className="chart-subtitle">Dienos vidurkis: {fmt(avgDaily)} • Geriausia diena: {bestDay.date?.slice(5)} ({fmt(bestDay.revenue)})</div>
          </div>
          <div className="tabs">
            <button className={`tab ${range === 30 ? 'active' : ''}`} onClick={() => setRange(30)}>30 Dienų</button>
            <button className={`tab ${range === 60 ? 'active' : ''}`} onClick={() => setRange(60)}>60 Dienų</button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1f" />
            <XAxis dataKey="date" tickFormatter={d => d.slice(5)} stroke="#27272a" tick={{ fill: '#52525b', fontSize: 11 }} />
            <YAxis stroke="#27272a" tick={{ fill: '#52525b', fontSize: 11 }} tickFormatter={v => '€' + v} />
            <Tooltip contentStyle={{ background: '#121214', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa' }}
              formatter={v => ['€' + v.toFixed(0), 'Pajamos']} />
            <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#revGrad2)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid-2">
        <div className="chart-card">
          <div className="chart-title" style={{ marginBottom: 16 }}>Dienos Pajamos (Stulpeliai)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chart30.slice(-14)}>
              <XAxis dataKey="date" tickFormatter={d => d.slice(8)} stroke="#27272a" tick={{ fill: '#52525b', fontSize: 11 }} />
              <YAxis stroke="#27272a" tick={{ fill: '#52525b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#121214', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa' }}
                formatter={v => ['€' + v.toFixed(0), 'Pajamos']} />
              <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title" style={{ marginBottom: 16 }}>Krepšelio ir Kliento Kainos Tendencija</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trends.slice(-30)}>
              <XAxis dataKey="date" tickFormatter={d => d.slice(5)} stroke="#27272a" tick={{ fill: '#52525b', fontSize: 11 }} />
              <YAxis stroke="#27272a" tick={{ fill: '#52525b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#121214', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa' }} />
              <Area type="monotone" dataKey="aov" stroke="#10b981" fill="none" strokeWidth={2} name="Krepšelio vertė €" />
              <Area type="monotone" dataKey="cpa" stroke="#f59e0b" fill="none" strokeWidth={2} name="Kliento kaina €" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-card green">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Vid. Krepšelio Vertė</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{fmt(week.aov)}</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Planuojamos Pajamos</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{fmt(week.mrr)}</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Grąžinimų Dalis</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{(week.refund_rate || 0).toFixed(1)}%</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Savaitės Registracijos</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{week.enrollments}</div>
        </div>
      </div>
    </>
  );
}
