import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { request } from '../api/http';
import AppShell from '../components/AppShell';

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

  const lastVisits = useMemo(() => visits.slice(0, 8), [visits]);

  return (
    <AppShell title="Dashboard">
      <section className="kpi-grid">
        <article className="kpi-card"><h3>Activos en sitio</h3><strong>{kpis.activeCount}</strong></article>
        <article className="kpi-card"><h3>Salidas hoy</h3><strong>{kpis.completedTodayCount}</strong></article>
        <article className="kpi-card"><h3>Proveedores dentro</h3><strong>{kpis.providerInside}</strong></article>
        <article className="kpi-card"><h3>Promedio min dentro</h3><strong>{kpis.avgMinutes}</strong></article>
        <article className="kpi-card"><h3>Alertas +120 min</h3><strong>{kpis.alerts}</strong></article>
      </section>

      <section className="grid-panels">
        <section className="panel">
          <h2>Resumen operativo</h2>
          <p>Administra clientes y visitas desde la sección Operación.</p>
          <Link to="/operations" className="link-btn">Ir a Operación</Link>
        </section>

        <section className="panel">
          <h2>Últimas visitas</h2>
          <ul className="list">
            {lastVisits.map((visit) => (
              <li key={visit._id}>
                <div>
                  <strong>{visit.visitorName}</strong>
                  <p>{visit.client?.companyName || 'Sin cliente'} • {visit.status}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {user?.role === 'admin' && (
          <section className="panel">
            <h2>Actividad reciente</h2>
            <ul className="list">
              {auditLogs.map((log) => (
                <li key={log._id}>
                  <div>
                    <strong>{log.action}</strong>
                    <p>{log.user?.email || 'sistema'} • {new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>

      {error && <p className="error-msg">{error}</p>}
    </AppShell>
  );
}
