import { useState, useEffect } from 'react';
import { fetchFunnel, fetchTraffic } from '../api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#8b5cf6', '#d946ef', '#10b981', '#f59e0b'];

export default function Funnel() {
  const [funnel, setFunnel] = useState(null);
  const [traffic, setTraffic] = useState([]);

  useEffect(() => {
    document.getElementById('page-title').textContent = '🔄 Pardavimų Piltuvėlis';
    fetchFunnel().then(setFunnel);
    fetchTraffic().then(setTraffic);
  }, []);

  if (!funnel) return <div className="loading-screen">Kraunami piltuvėlio duomenys...</div>;

  const maxCount = Math.max(...funnel.steps.map(s => s.count), 1);

  const totalTraffic = traffic.reduce((s, d) => ({
    organic: s.organic + (d.source_organic || 0),
    paid: s.paid + (d.source_paid || 0),
    social: s.social + (d.source_social || 0),
    direct: s.direct + (d.source_direct || 0),
  }), { organic: 0, paid: 0, social: 0, direct: 0 });

  const pieData = [
    { name: 'Organinis', value: totalTraffic.organic },
    { name: 'Mokamas', value: totalTraffic.paid },
    { name: 'Socialinis', value: totalTraffic.social },
    { name: 'Tiesioginis', value: totalTraffic.direct },
  ];
  const totalVisitors = Object.values(totalTraffic).reduce((a, b) => a + b, 0);

  const stepLabels = { 'Visitors': 'Lankytojai', 'Sales Page': 'Pardavimų Puslapis', 'Checkout': 'Atsiskaitymas', 'Purchase': 'Pirkimas' };

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {funnel.steps.map((step, i) => (
          <div key={step.name} className={`kpi-card ${['blue', 'purple', 'yellow', 'green'][i]}`}>
            <div className="kpi-label" style={{ marginBottom: 8 }}>{stepLabels[step.name] || step.name}</div>
            <div className="kpi-value" style={{ fontSize: 22 }}>{step.count.toLocaleString()}</div>
            {i > 0 && <span className="kpi-change neutral">{step.rate.toFixed(1)}% perėjo toliau</span>}
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="chart-card">
          <div className="chart-title" style={{ marginBottom: 4 }}>Pardavimų Piltuvėlis</div>
          <div className="chart-subtitle" style={{ marginBottom: 24, color: 'var(--text-muted)', fontSize: 13 }}>
            Bendras pirkimų procentas: <strong style={{ color: 'var(--accent-green)' }}>{funnel.overall_conversion.toFixed(2)}%</strong>
          </div>
          <div className="funnel-container">
            {funnel.steps.map((step, i) => {
              const width = Math.max(20, (step.count / maxCount) * 100);
              const colors = ['#8b5cf6', '#d946ef', '#f59e0b', '#10b981'];
              return (
                <div key={step.name}>
                  <div className="funnel-step">
                    <div className="funnel-step-label">{stepLabels[step.name] || step.name}</div>
                    <div className="funnel-bar-wrap">
                      <div className="funnel-bar" style={{
                        width: `${width}%`,
                        background: `linear-gradient(90deg, ${colors[i]}40, ${colors[i]}20)`,
                        border: `1px solid ${colors[i]}50`,
                        color: colors[i],
                      }}>
                        {step.count.toLocaleString()}
                      </div>
                    </div>
                    <div className="funnel-step-value">
                      <div className="rate">{i > 0 ? `${step.rate.toFixed(1)}% perėjo` : '100%'}</div>
                    </div>
                  </div>
                  {i < funnel.steps.length - 1 && <div className="funnel-connector" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title" style={{ marginBottom: 4 }}>Srauto Šaltiniai</div>
          <div className="chart-subtitle" style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 13 }}>
            Paskutinės 30 d. • {totalVisitors.toLocaleString()} viso lankytojų
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#121214', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="legend">
            {pieData.map((item, i) => (
              <div key={item.name} className="legend-item">
                <span className="legend-dot" style={{ background: COLORS[i] }} />
                {item.name}: {totalVisitors > 0 ? ((item.value / totalVisitors) * 100).toFixed(0) : 0}%
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title" style={{ marginBottom: 16 }}>Kasdienių Lankytojų Tendencija</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={traffic}>
            <defs>
              <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickFormatter={d => d.slice(5)} stroke="#27272a" tick={{ fill: '#52525b', fontSize: 11 }} />
            <YAxis stroke="#27272a" tick={{ fill: '#52525b', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#121214', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa' }} />
            <Area type="monotone" dataKey="total_visitors" stroke="#10b981" strokeWidth={2} fill="url(#trafficGrad)" name="Lankytojai" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
