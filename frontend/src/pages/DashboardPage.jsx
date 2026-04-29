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
    const checkedInToday = visits.filter((v) => v.checkedInAt && new Date(v.checkedInAt).toDateString() === new Date().toDateString());
    const completedToday = visits.filter((v) => v.checkedOutAt && new Date(v.checkedOutAt).toDateString() === new Date().toDateString());
    const clientsInside = active.filter((v) => v.category === 'client').length;
    const providerInside = active.filter((v) => v.category === 'provider').length;
    const avgMinutes = active.length ? Math.round(active.reduce((acc, v) => acc + hoursInSite(v), 0) / active.length) : 0;
    const alerts = active.filter((v) => hoursInSite(v) >= 120).length;
    return {
      activeCount: active.length,
      checkedInTodayCount: checkedInToday.length,
      completedTodayCount: completedToday.length,
      clientsInside,
      providerInside,
      avgMinutes,
      alerts
    };
  }, [visits]);

  const lastVisits = useMemo(() => visits.slice(0, 8), [visits]);
  const statusLabel = {
    scheduled: 'Programada',
    checked_in: 'En sitio',
    completed: 'Finalizada',
    cancelled: 'Cancelada'
  };
  const categoryLabel = {
    visitor: 'Visita',
    client: 'Cliente',
    provider: 'Proveedor'
  };
  const actionLabel = {
    'visit.create': 'Ingreso registrado',
    'visit.checkin': 'Ingreso confirmado',
    'visit.checkout': 'Salida registrada',
    'visit.delete': 'Visita eliminada',
    'user.create': 'Usuario creado',
    'user.update': 'Usuario actualizado',
    'user.reset_password': 'Contraseña restablecida',
    'profile.update': 'Perfil actualizado',
    'profile.change_password': 'Contraseña cambiada'
  };
  const operationalSummary = useMemo(() => {
    if (!visits.length) return 'No hay movimientos recientes. Usa Operación para registrar el primer ingreso del día.';
    if (kpis.activeCount === 0) return 'No hay personas en sitio en este momento. Todas las visitas activas ya fueron cerradas.';
    if (kpis.alerts > 0) return `Hay ${kpis.alerts} visita(s) con más de 120 minutos en sitio. Revisa si requieren seguimiento.`;
    return `Actualmente hay ${kpis.activeCount} persona(s) en sitio (${kpis.clientsInside} clientes y ${kpis.providerInside} proveedores).`;
  }, [visits, kpis]);

  return (
    <AppShell title="Dashboard">
      <section className="kpi-grid">
        <article className="kpi-card"><h3>Personas en sitio</h3><strong>{kpis.activeCount}</strong></article>
        <article className="kpi-card"><h3>Ingresos hoy</h3><strong>{kpis.checkedInTodayCount}</strong></article>
        <article className="kpi-card"><h3>Salidas hoy</h3><strong>{kpis.completedTodayCount}</strong></article>
        <article className="kpi-card"><h3>Tiempo promedio (min)</h3><strong>{kpis.avgMinutes}</strong></article>
        <article className="kpi-card"><h3>Seguimiento (+120 min)</h3><strong>{kpis.alerts}</strong></article>
      </section>

      <section className="grid-panels">
        <section className="panel">
          <h2>Resumen operativo</h2>
          <p>{operationalSummary}</p>
          <Link to="/operations" className="link-btn">Ir a Operación</Link>
        </section>

        <section className="panel">
          <h2>Últimas visitas</h2>
          <ul className="list">
            {lastVisits.map((visit) => (
              <li key={visit._id}>
                <div>
                  <strong>{visit.visitorName}</strong>
                  <p>{categoryLabel[visit.category] || visit.category} • {statusLabel[visit.status] || visit.status}</p>
                  <p>{new Date(visit.checkedInAt || visit.scheduledAt).toLocaleString()}</p>
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
                    <strong>{actionLabel[log.action] || log.action}</strong>
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
