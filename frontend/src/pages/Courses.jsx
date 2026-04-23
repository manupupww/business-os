import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { fetchCourses } from '../api';

const LEVEL_COLORS = { A1: '#8b5cf6', A2: '#d946ef', B1: '#10b981', B2: '#f59e0b' };

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [sortBy, setSortBy] = useState('total_revenue');
  const [sortDir, setSortDir] = useState(-1);

  useEffect(() => {
    document.getElementById('page-title').textContent = '🎓 Kursų Rezultatai';
    fetchCourses().then(setCourses);
  }, []);

  if (!courses.length) return <div className="loading-screen">Kraunami kursų duomenys...</div>;

  const sorted = [...courses].sort((a, b) => (a[sortBy] - b[sortBy]) * sortDir);
  const totalRevenue = courses.reduce((s, c) => s + c.total_revenue, 0);
  const totalStudents = courses.reduce((s, c) => s + c.enrollments, 0);

  function handleSort(col) {
    if (sortBy === col) setSortDir(d => d * -1);
    else { setSortBy(col); setSortDir(-1); }
  }

  function completionBadge(pct) {
    if (pct >= 60) return <span className="badge badge-green">{pct.toFixed(0)}%</span>;
    if (pct >= 30) return <span className="badge badge-yellow">{pct.toFixed(0)}%</span>;
    return <span className="badge badge-red">{pct.toFixed(0)}%</span>;
  }

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-card blue">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Bendros Kursų Pajamos</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>€{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Viso Registracijų</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{totalStudents}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Aktyvūs Kursai</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{courses.length}</div>
        </div>
        <div className="kpi-card yellow">
          <div className="kpi-label" style={{ marginBottom: 8 }}>Vid. Pajamos/Studentas</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>€{totalStudents > 0 ? (totalRevenue / totalStudents).toFixed(0) : 0}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="chart-card">
          <div className="chart-title" style={{ marginBottom: 16 }}>Pajamos Pagal Kursą</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={courses} layout="vertical">
              <XAxis type="number" stroke="#27272a" tick={{ fill: '#52525b', fontSize: 11 }} tickFormatter={v => '€' + v} />
              <YAxis type="category" dataKey="course_level" stroke="#27272a" tick={{ fill: '#52525b', fontSize: 12 }} width={40} />
              <Tooltip contentStyle={{ background: '#121214', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa' }}
                itemStyle={{ color: '#fafafa' }} cursor={{ fill: 'transparent' }}
                formatter={v => ['€' + v.toLocaleString(), 'Pajamos']} />
              <Bar dataKey="total_revenue" radius={[0, 6, 6, 0]} activeBar={{ stroke: '#ffffff', strokeWidth: 2, strokeOpacity: 0.9 }}>
                {courses.map(c => <Cell key={c.course_level} fill={LEVEL_COLORS[c.course_level] || '#8b5cf6'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title" style={{ marginBottom: 16 }}>Registracijos Pagal Kursą</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={courses} layout="vertical">
              <XAxis type="number" stroke="#27272a" tick={{ fill: '#52525b', fontSize: 11 }} />
              <YAxis type="category" dataKey="course_level" stroke="#27272a" tick={{ fill: '#52525b', fontSize: 12 }} width={40} />
              <Tooltip contentStyle={{ background: '#121214', border: '1px solid #27272a', borderRadius: 8, color: '#fafafa' }} itemStyle={{ color: '#fafafa' }} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="enrollments" radius={[0, 6, 6, 0]} name="Registracijos" activeBar={{ stroke: '#ffffff', strokeWidth: 2, strokeOpacity: 0.9 }}>
                {courses.map(c => <Cell key={c.course_level} fill={LEVEL_COLORS[c.course_level] || '#8b5cf6'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title" style={{ marginBottom: 16 }}>Kursų Detalės</div>
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('course_name')}>Kursas {sortBy === 'course_name' ? (sortDir > 0 ? '↑' : '↓') : ''}</th>
              <th>Lygis</th>
              <th onClick={() => handleSort('enrollments')}>Studentai {sortBy === 'enrollments' ? (sortDir > 0 ? '↑' : '↓') : ''}</th>
              <th onClick={() => handleSort('total_revenue')}>Pajamos {sortBy === 'total_revenue' ? (sortDir > 0 ? '↑' : '↓') : ''}</th>
              <th onClick={() => handleSort('avg_completion')}>Užbaigimas {sortBy === 'avg_completion' ? (sortDir > 0 ? '↑' : '↓') : ''}</th>
              <th onClick={() => handleSort('revenue_per_student')}>Paj./Studentas {sortBy === 'revenue_per_student' ? (sortDir > 0 ? '↑' : '↓') : ''}</th>
              <th>Dalis</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(c => (
              <tr key={c.course_name}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.course_name}</td>
                <td><span className="badge" style={{ background: LEVEL_COLORS[c.course_level] + '20', color: LEVEL_COLORS[c.course_level] }}>{c.course_level}</span></td>
                <td>{c.enrollments}</td>
                <td style={{ fontWeight: 600 }}>€{c.total_revenue.toLocaleString()}</td>
                <td>{completionBadge(c.avg_completion)}</td>
                <td>€{c.revenue_per_student.toFixed(0)}</td>
                <td>{totalRevenue > 0 ? ((c.total_revenue / totalRevenue) * 100).toFixed(0) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
