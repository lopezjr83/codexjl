import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { request } from '../api/http';
import AppShell from '../components/AppShell';

const STATUS_LABEL = {
  scheduled: 'Programada',
  checked_in: 'Activa',
  completed: 'Finalizada',
  cancelled: 'Cancelada',
};

const STATUS_BADGE = {
  scheduled: 'badge-blue',
  checked_in: 'badge-green',
  completed: 'badge-gray',
  cancelled: 'badge-red',
};

const hoursInSite = (visit) => {
  const start = visit.checkedInAt ? new Date(visit.checkedInAt).getTime() : null;
  const end = visit.checkedOutAt ? new Date(visit.checkedOutAt).getTime() : Date.now();
  if (!start) return 0;
  return Math.max(0, Math.round((end - start) / 1000 / 60));
};

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState('');

  const loadAll = async () => {
    try {
      const requests = [request('/visits', { token })];
      if (user?.role === 'admin') requests.push(request('/audit-logs?limit=10', { token }));
      const [visitsData, auditData] = await Promise.all(requests);
      setVisits(visitsData || []);
      setAuditLogs(auditData || []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const kpis = useMemo(() => {
    const active = visits.filter((v) => v.status === 'checked_in');
    const completedToday = visits.filter((v) => v.checkedOutAt && new Date(v.checkedOutAt).toDateString() === new Date().toDateString());
    const providerInside = active.filter((v) => v.category === 'provider').length;
    const avgMinutes = active.length ? Math.round(active.reduce((acc, v) => acc + hoursInSite(v), 0) / active.length) : 0;
    const alerts = active.filter((v) => hoursInSite(v) >= 120).length;
    return { activeCount: active.length, completedTodayCount: completedToday.length, providerInside, avgMinutes, alerts };
  }, [visits]);

  const kpiItems = useMemo(() => [
    { label: 'Activos en sitio', value: kpis.activeCount, accent: '#22c55e' },
    { label: 'Salidas hoy', value: kpis.completedTodayCount, accent: '#60a5fa' },
    { label: 'Proveedores dentro', value: kpis.providerInside, accent: '#f59e0b' },
    { label: 'Promedio min dentro', value: kpis.avgMinutes, sub: 'minutos', accent: '#a78bfa' },
    { label: 'Alertas +120 min', value: kpis.alerts, accent: kpis.alerts > 0 ? '#f87171' : '#94a3b8' },
  ], [kpis]);

  const lastVisits = useMemo(() => visits.slice(0, 8), [visits]);

  return (
    <AppShell title="Dashboard">
      <section className="kpi-grid">
        {kpiItems.map((kpi) => (
          <article key={kpi.label} className="kpi-card" style={{ '--kpi-accent': kpi.accent }}>
            <h3>{kpi.label}</h3>
            <strong>{kpi.value}</strong>
            {kpi.sub && <p className="kpi-card-sub">{kpi.sub}</p>}
          </article>
        ))}
      </section>

      <section className="grid-panels">
        <section className="panel">
          <h2>Resumen operativo</h2>
          <p>Administra clientes y visitas desde la sección Operación.</p>
          <Link to="/operations" className="link-btn">Ir a Operación →</Link>
        </section>

        <section className="panel">
          <h2>Últimas visitas</h2>
          {lastVisits.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">📋</span>
              Sin visitas registradas
            </div>
          ) : (
            <ul className="list">
              {lastVisits.map((visit) => (
                <li key={visit._id}>
                  <div>
                    <strong>{visit.visitorName || '—'}</strong>
                    <p>{visit.client?.companyName || 'Sin cliente'}</p>
                  </div>
                  <span className={`badge ${STATUS_BADGE[visit.status] || 'badge-gray'}`}>
                    {STATUS_LABEL[visit.status] || visit.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {user?.role === 'admin' && (
          <section className="panel">
            <h2>Actividad reciente</h2>
            {auditLogs.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">📊</span>
                Sin actividad registrada
              </div>
            ) : (
              <ul className="list">
                {auditLogs.map((log) => (
                  <li key={log._id}>
                    <div>
                      <strong>{log.action}</strong>
                      <p>{log.user?.email || 'sistema'} · {new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </section>

      {error && <p className="error-msg">{error}</p>}
    </AppShell>
  );
}
