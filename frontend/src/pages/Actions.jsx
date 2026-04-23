import { useState, useEffect } from 'react';
import { fetchActions, generateActions, updateActionStatus } from '../api';

const STATUS_ORDER = ['new', 'in_progress', 'done', 'skipped'];
const STATUS_LABELS = { new: '🆕 Naujas', in_progress: '⏳ Vykdomas', done: '✅ Atlikta', skipped: '⏭️ Praleista' };

export default function Actions() {
  const [actions, setActions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    document.getElementById('page-title').textContent = '🤖 AI Dienos Veiksmai';
    fetchActions().then(setActions);
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const result = await generateActions();
      if (result.success) {
        setToast({ type: 'success', msg: 'Veiksmai sėkmingai sugeneruoti!' });
        fetchActions().then(setActions);
      }
    } catch (e) {
      setToast({ type: 'error', msg: 'Nepavyko sugeneruoti veiksmų' });
    }
    setGenerating(false);
    setTimeout(() => setToast(null), 3000);
  }

  async function cycleStatus(id, currentStatus) {
    const nextIdx = (STATUS_ORDER.indexOf(currentStatus) + 1) % STATUS_ORDER.length;
    const newStatus = STATUS_ORDER[nextIdx];
    await updateActionStatus(id, newStatus);
    setActions(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            AI analizuoja tavo rezultatų duomenis ir generuoja 3 dienos rekomendacijas
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? '⏳ Generuojama...' : '🤖 Generuoti Šiandienos Veiksmus'}
        </button>
      </div>

      {actions.map((action, i) => (
        <div key={action.id} style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📅 {action.date}</span>
            <button
              className={`action-status ${action.status}`}
              onClick={() => cycleStatus(action.id, action.status)}
            >
              {STATUS_LABELS[action.status] || action.status}
            </button>
          </div>

          <div className="action-card urgent">
            <div className="action-type">🔴 Skubu — Veik Šiandien</div>
            <div className="action-text">{action.urgent_action}</div>
          </div>

          <div className="action-card optimize">
            <div className="action-type">🟡 Optimizuoti — Šią Savaitę</div>
            <div className="action-text">{action.optimize_action}</div>
          </div>

          <div className="action-card growth">
            <div className="action-type">🟢 Augimas — Galimybė</div>
            <div className="action-text">{action.growth_action}</div>
          </div>
        </div>
      ))}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
