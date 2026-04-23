import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchMarketing } from '../api';

const PLATFORM_COLORS = { Meta: '#8b5cf6', Google: '#10b981', Other: '#f59e0b' };

export default function Marketing() {
  const [data, setData] = useState(null);

  useEffect(() => {
    document.getElementById('page-title').textContent = '📢 Rinkodaros Variklis';
    fetchMarketing().then(setData);
  }, []);

  if (!data) return <div className="loading-screen">Kraunami rinkodaros duomenys...</div>;

  const totalSpend = data.platforms.reduce((s, p) => s + p.total_spend, 0);
  const totalClicks = data.platforms.reduce((s, p) => s + p.total_clicks, 0);
  const totalConversions = data.platforms.reduce((s, p) => s + p.total_conversions, 0);
  const ts = data.traffic_split || {};
  const totalTraffic = (ts.organic || 0) + (ts.paid || 0) + (ts.social || 0) + (ts.direct || 0);

  const pieData = [
    { name: 'Organinis', value: ts.organic || 0 },
    { name: 'Mokamas', value: ts.paid || 0 },
    { name: 'Socialinis', value: ts.social || 0 },
    { name: 'Tiesioginis', value: ts.direct || 0 },
  ];
  const PIE_COLORS = ['#10b981', '#8b5cf6', '#d946ef', '#f59e0b'];

  function roasBadge(roas) {
    if (roas >= 2) return <span className="badge badge-green">{roas.toFixed(2)}x</span>;
    if (roas >= 1) return <span className="badge badge-yellow">{roas.toFixed(2)}x</span>;
    return <span className="badge badge-red">{roas.toFixed(2)}x</span>;
  }

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="kpi-card blue">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Viso Reklamos Išlaidų</div>
          <div className="kpi-value" style={{ fontSize: 20 }}>€{totalSpend.toLocaleString()}</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Viso Paspaudimų</div>
          <div className="kpi-value" style={{ fontSize: 20 }}>{totalClicks.toLocaleString()}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Pirkimai</div>
          <div className="kpi-value" style={{ fontSize: 20 }}>{totalConversions}</div>
        </div>
        <div className="kpi-card yellow">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Reklamos Grąža</div>
          <div className="kpi-value" style={{ fontSize: 20 }}>{data.overall_roas.toFixed(2)}x</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Vid. Kliento Kaina</div>
          <div className="kpi-value" style={{ fontSize: 20 }}>€{totalConversions > 0 ? (totalSpend / totalConversions).toFixed(0) : 0}</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title" style={{ marginBottom: 16 }}>Platformų Rezultatai</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Platforma</th>
              <th>Išlaidos</th>
              <th>Parodymai</th>
              <th>Paspaudimai</th>
              <th>Paspaudimų %</th>
              <th>Paspaudimo Kaina</th>
              <th>Pirkimai</th>
              <th>Kliento Kaina</th>
              <th>Reklamos Grąža</th>
            </tr>
          </thead>
          <tbody>
            {data.platforms.map(p => (
              <tr key={p.platform}>
                <td style={{ fontWeight: 600, color: PLATFORM_COLORS[p.platform] }}>{p.platform === 'Meta' ? '📘 Meta' : p.platform === 'Google' ? '🔍 Google' : '📌 ' + p.platform}</td>
                <td style={{ fontWeight: 600 }}>€{p.total_spend.toLocaleString()}</td>
                <td>{(p.total_impressions || 0).toLocaleString()}</td>
                <td>{(p.total_clicks || 0).toLocaleString()}</td>
                <td>{(p.ctr || 0).toFixed(2)}%</td>
                <td>€{(p.cpc || 0).toFixed(2)}</td>
                <td>{p.total_conversions}</td>
                <td>€{(p.cpa || 0).toFixed(0)}</td>
                <td>{roasBadge(p.roas || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid-2">
        <div className="chart-card">
          <div className="chart-title" style={{ marginBottom: 16 }}>Dienos Reklamos Išlaidos</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.daily_spend || []}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tickFormatter={d => d.slice(5)} stroke="#27272a" tick={{ fill: '#52525b', fontSize: 11 }} />
              <YAxis stroke="#27272a" tick={{ fill: '#52525b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#121214', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa' }}
                formatter={v => ['€' + Number(v).toFixed(0), 'Išlaidos']} />
              <Area type="monotone" dataKey="spend" stroke="#ef4444" strokeWidth={2} fill="url(#spendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title" style={{ marginBottom: 16 }}>Organinis vs Mokamas Srautas</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#121214', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="legend">
            {pieData.map((item, i) => (
              <div key={item.name} className="legend-item">
                <span className="legend-dot" style={{ background: PIE_COLORS[i] }} />
                {item.name}: {totalTraffic > 0 ? ((item.value / totalTraffic) * 100).toFixed(0) : 0}%
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
