import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { path: '/', icon: '📊', label: 'Apžvalga' },
  { path: '/revenue', icon: '💰', label: 'Pajamos' },
  { path: '/funnel', icon: '🔄', label: 'Pardavimų Piltuvėlis' },
  { path: '/courses', icon: '🎓', label: 'Kursai' },
  { path: '/marketing', icon: '📢', label: 'Rinkodara' },
  { path: '/actions', icon: '🤖', label: 'AI Veiksmai' },
];

export default function Layout() {
  const today = new Date().toLocaleDateString('lt-LT', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ padding: '4px 12px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="38" height="38" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="edukusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <path d="M50 5C25.1 5 5 25.1 5 50C5 74.9 25.1 95 50 95C71.3 95 89.2 80.3 93.9 60H78.3C74.1 72.1 63 80 50 80C33.4 80 20 66.6 20 50C20 33.4 33.4 20 50 20C63 20 74.1 27.9 78.3 40H93.9C89.2 19.7 71.3 5 50 5Z" fill="url(#edukusGrad)"/>
            <path d="M35 70L65 50L35 30V70Z" fill="url(#edukusGrad)"/>
          </svg>
          <span style={{ fontSize: '24px', fontWeight: 800, background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.5px' }}>edukus</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">Pagrindinis</div>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div className="sidebar-section" style={{ marginTop: 16 }}>Įrankiai</div>
          <NavLink
            to="/data-entry"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">➕</span>
            Duomenų Įvedimas
          </NavLink>
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 12px' }}>
            Solo Verslininkui
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 12px', opacity: 0.6 }}>
            v1.0 • Anglų Kalbos Kursai
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="top-bar">
          <h2 id="page-title"></h2>
          <div className="date-display">📅 {today}</div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
