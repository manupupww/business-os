const API = import.meta.env.VITE_API_URL || 'https://business-os-fukg.onrender.com/api';

export async function fetchSummary() {
  const res = await fetch(`${API}/dashboard/summary`);
  return res.json();
}

export async function fetchRevenueChart(days = 30) {
  const res = await fetch(`${API}/dashboard/revenue-chart?days=${days}`);
  return res.json();
}

export async function fetchFunnel() {
  const res = await fetch(`${API}/dashboard/funnel`);
  return res.json();
}

export async function fetchCourses() {
  const res = await fetch(`${API}/dashboard/courses`);
  return res.json();
}

export async function fetchMarketing() {
  const res = await fetch(`${API}/dashboard/marketing`);
  return res.json();
}

export async function fetchActions() {
  const res = await fetch(`${API}/dashboard/actions`);
  return res.json();
}

export async function fetchTrends() {
  const res = await fetch(`${API}/dashboard/trends`);
  return res.json();
}

export async function fetchTraffic() {
  const res = await fetch(`${API}/dashboard/traffic`);
  return res.json();
}

export async function generateActions() {
  const res = await fetch(`${API}/actions`, { method: 'POST' });
  return res.json();
}

export async function updateActionStatus(id, status) {
  const res = await fetch(`${API}/actions/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return res.json();
}

export async function recalculateKpis() {
  const res = await fetch(`${API}/recalculate-kpis`, { method: 'POST' });
  return res.json();
}

export async function postData(endpoint, data) {
  const res = await fetch(`${API}/sync/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}
