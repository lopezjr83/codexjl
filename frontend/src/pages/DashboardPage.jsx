import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { request } from '../api/http';
import AppShell from '../components/AppShell';

const elapsed = (checkedInAt, now) => {
  if (!checkedInAt) return null;
  const mins = Math.max(0, Math.floor((now - new Date(checkedInAt).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

const CAT_LABEL = { visitor: 'Visita', client: 'Cliente', provider: 'Proveedor' };
const CAT_BADGE = { visitor: 'badge-blue', client: 'badge-amber', provider: 'badge-green' };

export default function DashboardPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [visitTypes, setVisitTypes] = useState({});
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  const loadAll = async () => {
    try {
      const [visitsData, typesData] = await Promise.all([
        request('/visits', { token }),
        request('/visit-types', { token })
      ]);
      setVisits(visitsData || []);
      setVisitTypes(typesData || {});
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    loadAll();
    const refresh = setInterval(loadAll, 60000);
    return () => clearInterval(refresh);
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(tick);
  }, []);

  const typeLabel = (cat) => visitTypes[cat]?.label || CAT_LABEL[cat] || cat;

  const activeVisits = useMemo(() => visits.filter((v) => v.status === 'checked_in'), [visits]);
  const alertVisits  = useMemo(() => activeVisits.filter((v) => {
    if (!v.checkedInAt) return false;
    return (now - new Date(v.checkedInAt).getTime()) >= 120 * 60000;
  }), [activeVisits, now]);

  const todayVisits = useMemo(() => {
    const today = new Date().toDateString();
    return visits.filter((v) => {
      const d = v.checkedInAt || v.scheduledAt;
      return d && new Date(d).toDateString() === today;
    });
  }, [visits]);

  const completedToday = useMemo(() => todayVisits.filter((v) => v.status === 'completed'), [todayVisits]);

  const todayByCategory = useMemo(() => ({
    visitor:  todayVisits.filter((v) => v.category === 'visitor').length,
    client:   todayVisits.filter((v) => v.category === 'client').length,
    provider: todayVisits.filter((v) => v.category === 'provider').length,
  }), [todayVisits]);

  const avgMinutes = useMemo(() => {
    if (!activeVisits.length) return 0;
    const total = activeVisits.reduce((acc, v) => {
      if (!v.checkedInAt) return acc;
      return acc + Math.floor((now - new Date(v.checkedInAt).getTime()) / 60000);
    }, 0);
    return Math.round(total / activeVisits.length);
  }, [activeVisits, now]);

  const checkOut = async (id) => {
    await request(`/visits/${id}/check-out`, { method: 'PUT', token });
    await loadAll();
  };

  const kpiItems = [
    {
      label: 'En sitio ahora',
      value: activeVisits.length,
      accent: activeVisits.length > 0 ? '#22c55e' : '#94a3b8',
      live: true
    },
    {
      label: 'Salidas hoy',
      value: completedToday.length,
      accent: '#60a5fa'
    },
    {
      label: 'Ingresos hoy',
      value: todayVisits.length,
      accent: '#a78bfa'
    },
    {
      label: alertVisits.length > 0 ? `${alertVisits.length} alerta${alertVisits.length > 1 ? 's' : ''}` : 'Sin alertas',
      value: alertVisits.length > 0 ? '+120 min' : '✓',
      accent: alertVisits.length > 0 ? '#f87171' : '#94a3b8'
    },
  ];

  return (
    <AppShell title="Dashboard">
      {error && <p className="error-msg">{error}</p>}

      {/* ── KPI strip ──────────────────────────────────────────── */}
      <section className="kpi-grid">
        {kpiItems.map((kpi) => (
          <article key={kpi.label} className="kpi-card" style={{ '--kpi-accent': kpi.accent }}>
            <h3>
              {kpi.live && activeVisits.length > 0 && <span className="live-dot" />}
              {kpi.label}
            </h3>
            <strong>{kpi.value}</strong>
          </article>
        ))}
      </section>

      {/* ── En sitio ahora ─────────────────────────────────────── */}
      <section className="panel">
        <div className="panel-head-inline">
          <div>
            <h2>En sitio ahora</h2>
            <p style={{ margin: 0, color: 'var(--c-muted)', fontSize: '.87rem' }}>
              {activeVisits.length === 0
                ? 'No hay nadie en las instalaciones'
                : `${activeVisits.length} persona${activeVisits.length > 1 ? 's' : ''} dentro · se actualiza cada minuto`}
            </p>
          </div>
          <button onClick={() => navigate('/operations')}>+ Nuevo ingreso</button>
        </div>

        {activeVisits.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🏢</span>
            Las instalaciones están vacías
          </div>
        ) : (
          <div className="active-monitor-table">
            <div className="monitor-header">
              <span>Nombre</span>
              <span>Tipo</span>
              <span>A quien visita</span>
              <span>Tiempo dentro</span>
              <span></span>
            </div>
            {activeVisits.map((visit) => {
              const mins = visit.checkedInAt
                ? Math.floor((now - new Date(visit.checkedInAt).getTime()) / 60000)
                : 0;
              const isAlert = mins >= 120;
              return (
                <div key={visit._id} className={`monitor-row${isAlert ? ' monitor-alert' : ''}`}>
                  <span className="monitor-name">
                    {isAlert && <span className="alert-dot" title="Más de 2 horas en sitio" />}
                    <strong>{visit.visitorName}</strong>
                    {visit.visitorDocument && <small>{visit.visitorDocument}</small>}
                  </span>
                  <span>
                    <span className={`badge ${CAT_BADGE[visit.category] || 'badge-gray'}`}>
                      {typeLabel(visit.category)}
                    </span>
                  </span>
                  <span className="monitor-host">{visit.hostPerson || '—'}</span>
                  <span className={`monitor-time${isAlert ? ' monitor-time-alert' : ''}`}>
                    {elapsed(visit.checkedInAt, now) || '—'}
                  </span>
                  <span>
                    <button className="checkout-btn-sm" onClick={() => checkOut(visit._id)}>
                      Dar salida
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Bottom panels ──────────────────────────────────────── */}
      <section className="grid-panels">

        {/* Resumen del día */}
        <section className="panel">
          <h2>Resumen del día</h2>
          <p style={{ margin: '0 0 1rem', color: 'var(--c-muted)', fontSize: '.87rem' }}>
            {new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          <div className="day-summary-grid">
            {[
              { key: 'visitor', color: visitTypes.visitor?.color || '#1d4ed8' },
              { key: 'client',  color: visitTypes.client?.color  || '#b45309' },
              { key: 'provider',color: visitTypes.provider?.color|| '#15803d' },
            ].map(({ key, color }) => (
              <div key={key} className="day-summary-item" style={{ '--ds-color': color }}>
                <span className="ds-count">{todayByCategory[key]}</span>
                <span className="ds-label">{typeLabel(key)}</span>
              </div>
            ))}
          </div>

          <div className="day-summary-stats">
            <div className="ds-stat">
              <span>Total ingresos</span>
              <strong>{todayVisits.length}</strong>
            </div>
            <div className="ds-stat">
              <span>Completadas</span>
              <strong>{completedToday.length}</strong>
            </div>
            <div className="ds-stat">
              <span>Tiempo promedio</span>
              <strong>{avgMinutes > 0 ? `${avgMinutes} min` : '—'}</strong>
            </div>
          </div>
        </section>

        {/* Últimas salidas */}
        <section className="panel">
          <h2>Últimas salidas</h2>
          {completedToday.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem 1rem' }}>
              <span className="empty-state-icon">📋</span>
              Sin salidas registradas hoy
            </div>
          ) : (
            <ul className="list">
              {completedToday.slice(-8).reverse().map((visit) => {
                const mins = visit.checkedInAt && visit.checkedOutAt
                  ? Math.max(0, Math.floor((new Date(visit.checkedOutAt) - new Date(visit.checkedInAt)) / 60000))
                  : null;
                return (
                  <li key={visit._id} className="exit-log-item">
                    <div className="exit-log-info">
                      <strong>{visit.visitorName}</strong>
                      <p>
                        <span className={`badge ${CAT_BADGE[visit.category] || 'badge-gray'}`} style={{ fontSize: '.72rem' }}>
                          {typeLabel(visit.category)}
                        </span>
                        {visit.hostPerson && <> · {visit.hostPerson}</>}
                      </p>
                    </div>
                    <div className="exit-log-meta">
                      {mins !== null && <span className="exit-duration">{mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`}</span>}
                      <span className="exit-time">
                        {visit.checkedOutAt ? new Date(visit.checkedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

      </section>
    </AppShell>
  );
}
