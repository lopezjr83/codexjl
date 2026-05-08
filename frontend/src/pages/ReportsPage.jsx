import { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell';
import { request } from '../api/http';
import { useAuth } from '../contexts/AuthContext';

const CAT_LABEL  = { visitor: 'Visita', client: 'Cliente', provider: 'Proveedor' };
const CAT_BADGE  = { visitor: 'badge-blue', client: 'badge-amber', provider: 'badge-green' };
const STAT_LABEL = { scheduled: 'Programada', checked_in: 'Activa', completed: 'Finalizada', cancelled: 'Cancelada' };

const dur = (v) => {
  if (!v.checkedInAt || !v.checkedOutAt) return null;
  return Math.max(0, Math.floor((new Date(v.checkedOutAt) - new Date(v.checkedInAt)) / 60000));
};
const fmtDur = (mins) => {
  if (mins === null || mins === undefined) return '—';
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
};

export default function ReportsPage() {
  const { token } = useAuth();
  const [visits, setVisits]     = useState([]);
  const [visitTypes, setVisitTypes] = useState({});
  const [loading, setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters]   = useState({
    search: '', category: 'all', status: 'all',
    dateFrom: '', dateTo: ''
  });
  const [sortKey, setSortKey]   = useState('checkedInAt');
  const [sortDir, setSortDir]   = useState('desc');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [v, t] = await Promise.all([
          request('/visits', { token }),
          request('/visit-types', { token })
        ]);
        setVisits(v || []);
        setVisitTypes(t || {});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const typeLabel = (cat) => visitTypes[cat]?.label || CAT_LABEL[cat] || cat;

  /* ── filtered & sorted list ──────────────────────────────── */
  const filtered = useMemo(() => {
    let list = visits.filter((v) => {
      const text = `${v.visitorName} ${v.hostPerson || ''} ${v.purpose} ${v.visitorDocument || ''} ${v.company || ''}`.toLowerCase();
      const matchSearch   = !filters.search   || text.includes(filters.search.toLowerCase());
      const matchCategory = filters.category === 'all' || v.category === filters.category;
      const matchStatus   = filters.status   === 'all' || v.status   === filters.status;
      const entry = new Date(v.checkedInAt || v.scheduledAt);
      const matchFrom = !filters.dateFrom || entry >= new Date(`${filters.dateFrom}T00:00:00`);
      const matchTo   = !filters.dateTo   || entry <= new Date(`${filters.dateTo}T23:59:59`);
      return matchSearch && matchCategory && matchStatus && matchFrom && matchTo;
    });

    list = [...list].sort((a, b) => {
      let va, vb;
      if (sortKey === 'duration') {
        va = dur(a) ?? -1;
        vb = dur(b) ?? -1;
      } else if (sortKey === 'visitorName') {
        va = a.visitorName?.toLowerCase() || '';
        vb = b.visitorName?.toLowerCase() || '';
      } else {
        va = new Date(a[sortKey] || 0).getTime();
        vb = new Date(b[sortKey] || 0).getTime();
      }
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

    return list;
  }, [visits, filters, sortKey, sortDir]);

  /* ── KPIs from filtered set ──────────────────────────────── */
  const stats = useMemo(() => {
    const completed = filtered.filter((v) => v.status === 'completed');
    const durations = completed.map(dur).filter((d) => d !== null);
    const avgMin = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;
    const maxMin = durations.length ? Math.max(...durations) : null;
    const byCategory = {
      visitor:  filtered.filter((v) => v.category === 'visitor').length,
      client:   filtered.filter((v) => v.category === 'client').length,
      provider: filtered.filter((v) => v.category === 'provider').length,
    };
    return { total: filtered.length, completed: completed.length, avgMin, maxMin, byCategory };
  }, [filtered]);

  /* ── sort toggle ─────────────────────────────────────────── */
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };
  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span className="sort-icon sort-icon-inactive">↕</span>;
    return <span className="sort-icon">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  /* ── CSV export ──────────────────────────────────────────── */
  const exportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/reports/visits.csv`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `visitas-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const setF = (patch) => setFilters((prev) => ({ ...prev, ...patch }));
  const clearFilters = () => setFilters({ search: '', category: 'all', status: 'all', dateFrom: '', dateTo: '' });
  const hasFilters = filters.search || filters.category !== 'all' || filters.status !== 'all' || filters.dateFrom || filters.dateTo;

  return (
    <AppShell title="Reportes">

      {/* ── KPI strip ──────────────────────────────────────── */}
      <section className="rpt-kpi-strip">
        <div className="rpt-kpi">
          <span>{stats.total}</span>
          <p>Registros{hasFilters ? ' (filtrados)' : ''}</p>
        </div>
        <div className="rpt-kpi">
          <span>{stats.completed}</span>
          <p>Completadas</p>
        </div>
        <div className="rpt-kpi" style={{ '--rk': visitTypes.visitor?.color || '#1d4ed8' }}>
          <span>{stats.byCategory.visitor}</span>
          <p>{typeLabel('visitor')}</p>
        </div>
        <div className="rpt-kpi" style={{ '--rk': visitTypes.client?.color || '#b45309' }}>
          <span>{stats.byCategory.client}</span>
          <p>{typeLabel('client')}</p>
        </div>
        <div className="rpt-kpi" style={{ '--rk': visitTypes.provider?.color || '#15803d' }}>
          <span>{stats.byCategory.provider}</span>
          <p>{typeLabel('provider')}</p>
        </div>
        <div className="rpt-kpi">
          <span>{fmtDur(stats.avgMin)}</span>
          <p>Promedio estadía</p>
        </div>
        <div className="rpt-kpi">
          <span>{fmtDur(stats.maxMin)}</span>
          <p>Estadía más larga</p>
        </div>
      </section>

      {/* ── Filters ────────────────────────────────────────── */}
      <section className="panel">
        <div className="panel-head-inline" style={{ marginBottom: '.75rem' }}>
          <h2>Historial completo de visitas</h2>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            {hasFilters && (
              <button className="ghost" onClick={clearFilters} style={{ fontSize: '.83rem', padding: '.38rem .7rem' }}>
                Limpiar filtros
              </button>
            )}
            <button onClick={exportCSV} disabled={exporting}>
              {exporting ? 'Exportando…' : '↓ Exportar CSV'}
            </button>
          </div>
        </div>

        <div className="rpt-filters">
          <input
            placeholder="Buscar nombre, DPI, motivo, empresa…"
            value={filters.search}
            onChange={(e) => setF({ search: e.target.value })}
          />
          <select value={filters.category} onChange={(e) => setF({ category: e.target.value })}>
            <option value="all">Todas las categorías</option>
            <option value="visitor">Visita</option>
            <option value="client">Cliente</option>
            <option value="provider">Proveedor</option>
          </select>
          <select value={filters.status} onChange={(e) => setF({ status: e.target.value })}>
            <option value="all">Todos los estados</option>
            <option value="checked_in">Activa</option>
            <option value="completed">Finalizada</option>
            <option value="cancelled">Cancelada</option>
          </select>
          <input type="date" value={filters.dateFrom} onChange={(e) => setF({ dateFrom: e.target.value })} />
          <input type="date" value={filters.dateTo}   onChange={(e) => setF({ dateTo: e.target.value })} />
        </div>

        {loading ? (
          <div className="empty-state">
            <span className="empty-state-icon">⏳</span>Cargando registros…
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📂</span>
            Sin resultados para los filtros aplicados
          </div>
        ) : (
          <div className="table-wrap">
            <table className="history-table rpt-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('visitorName')} className="th-sortable">
                    Nombre <SortIcon col="visitorName" />
                  </th>
                  <th>DPI</th>
                  <th>Tipo</th>
                  <th>A quien visita</th>
                  <th>Motivo</th>
                  <th>Empresa</th>
                  <th onClick={() => toggleSort('checkedInAt')} className="th-sortable">
                    Entrada <SortIcon col="checkedInAt" />
                  </th>
                  <th onClick={() => toggleSort('checkedOutAt')} className="th-sortable">
                    Salida <SortIcon col="checkedOutAt" />
                  </th>
                  <th onClick={() => toggleSort('duration')} className="th-sortable">
                    Duración <SortIcon col="duration" />
                  </th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v._id}>
                    <td><strong style={{ color: 'var(--c-navy)' }}>{v.visitorName}</strong></td>
                    <td style={{ fontSize: '.8rem', color: 'var(--c-muted)' }}>{v.visitorDocument || '—'}</td>
                    <td>
                      <span className={`badge ${CAT_BADGE[v.category] || 'badge-gray'}`}>
                        {typeLabel(v.category)}
                      </span>
                    </td>
                    <td>{v.hostPerson || '—'}</td>
                    <td>{v.purpose}</td>
                    <td style={{ fontSize: '.83rem', color: 'var(--c-muted)' }}>{v.company || '—'}</td>
                    <td style={{ fontSize: '.83rem' }}>
                      {v.checkedInAt
                        ? new Date(v.checkedInAt).toLocaleString()
                        : new Date(v.scheduledAt).toLocaleString()}
                    </td>
                    <td style={{ fontSize: '.83rem' }}>
                      {v.checkedOutAt ? new Date(v.checkedOutAt).toLocaleString() : '—'}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--c-navy)' }}>{fmtDur(dur(v))}</td>
                    <td>
                      <span className={`badge ${v.status === 'completed' ? 'badge-green' : v.status === 'checked_in' ? 'badge-blue' : 'badge-gray'}`}>
                        {STAT_LABEL[v.status] || v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="rpt-count">
          Mostrando <strong>{filtered.length}</strong> de <strong>{visits.length}</strong> registros
        </p>
      </section>

    </AppShell>
  );
}
