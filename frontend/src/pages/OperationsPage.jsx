import { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell';
import { request } from '../api/http';
import { useAuth } from '../contexts/AuthContext';

const initialForm = {
  category: 'visitor',
  firstName: '',
  lastName: '',
  phone: '',
  company: '',
  hostPerson: '',
  visitorDocument: '',
  purpose: '',
  badgeNumber: ''
};

export default function OperationsPage() {
  const { token } = useAuth();
  const [visits, setVisits] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [localNow, setLocalNow] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({ search: '', category: 'all', dateFrom: '', dateTo: '' });
  const [activeLimit, setActiveLimit] = useState(4);
  const [expandedActive, setExpandedActive] = useState({});
  const [visitTypes, setVisitTypes] = useState({});

  const loadVisits = async () => {
    try {
      const visitsData = await request('/visits', { token });
      setVisits(visitsData || []);
      const typesData = await request('/visit-types', { token });
      setVisitTypes(typesData || {});
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { loadVisits(); }, []);
  useEffect(() => {
    const timer = setInterval(() => setLocalNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const typeLabel = useMemo(() => ({
    visitor: visitTypes.visitor?.label || 'Visita',
    client: visitTypes.client?.label || 'Cliente',
    provider: visitTypes.provider?.label || 'Proveedor'
  }), [visitTypes]);
  const activeVisits = useMemo(() => visits.filter((visit) => visit.status !== 'completed'), [visits]);
  const visibleActiveVisits = useMemo(() => activeVisits.slice(0, activeLimit), [activeVisits, activeLimit]);
  const historyVisits = useMemo(() => visits.filter((visit) => visit.status === 'completed'), [visits]);
  const filteredHistoryVisits = useMemo(() => {
    return historyVisits.filter((visit) => {
      const text = `${visit.visitorName} ${visit.hostPerson || ''} ${visit.purpose}`.toLowerCase();
      const matchesSearch = !historyFilters.search || text.includes(historyFilters.search.toLowerCase());
      const matchesCategory = historyFilters.category === 'all' || visit.category === historyFilters.category;
      const entryDate = new Date(visit.checkedInAt || visit.scheduledAt);
      const matchesFrom = !historyFilters.dateFrom || entryDate >= new Date(`${historyFilters.dateFrom}T00:00:00`);
      const matchesTo = !historyFilters.dateTo || entryDate <= new Date(`${historyFilters.dateTo}T23:59:59`);
      return matchesSearch && matchesCategory && matchesFrom && matchesTo;
    });
  }, [historyVisits, historyFilters]);

  const formatDuration = (visit) => {
    if (!visit.checkedOutAt || !visit.checkedInAt) return '—';
    const minutes = Math.max(0, Math.round((new Date(visit.checkedOutAt).getTime() - new Date(visit.checkedInAt).getTime()) / 60000));
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return hours ? `${hours}h ${rem}m` : `${rem}m`;
  };

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      visitorName: `${form.firstName} ${form.lastName}`.trim(),
      badgeNumber: form.category === 'visitor' ? undefined : Number(form.badgeNumber),
      phone: form.category === 'client' ? form.phone : undefined,
      company: form.category === 'provider' ? form.company : undefined,
      scheduledAt: localNow.toISOString()
    };

    await request('/visits', { method: 'POST', body: payload, token });
    setForm(initialForm);
    setShowForm(false);
    await loadVisits();
  };

  return (
    <AppShell title="Operación">
      <section className="panel">
        <div className="panel-head-inline">
          <div>
            <h2>Registro unificado</h2>
            <p>Visitas activas arriba, histórico de salidas abajo.</p>
          </div>
          <button onClick={() => setShowForm((prev) => !prev)}>{showForm ? 'Cerrar registro' : 'Nuevo registro'}</button>
        </div>
      </section>

      {error && <p className="error-msg">{error}</p>}

      {showForm && (
        <section className="grid-panels one-col">
          <section className="panel">
            <h3>Nuevo ingreso</h3>
            <form className="grid-form" onSubmit={submit}>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="visitor">Visita</option>
                <option value="client">Cliente</option>
                <option value="provider">Proveedor</option>
              </select>
              <input placeholder="Nombre" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              <input placeholder="Apellido" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              <input placeholder="DPI" value={form.visitorDocument} onChange={(e) => setForm({ ...form, visitorDocument: e.target.value })} required />
              <input placeholder="Motivo" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required />
              <input placeholder="Persona a quien visita" value={form.hostPerson} onChange={(e) => setForm({ ...form, hostPerson: e.target.value })} required />
              <input value={localNow.toLocaleString()} readOnly />

              {form.category === 'client' && (
                <>
                  <input placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                  <input type="number" min="1" max="15" placeholder="Tarjeta cliente (1-15)" value={form.badgeNumber} onChange={(e) => setForm({ ...form, badgeNumber: e.target.value })} required />
                </>
              )}

              {form.category === 'provider' && (
                <>
                  <input placeholder="Empresa" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
                  <input type="number" min="1" max="15" placeholder="Tarjeta proveedor (1-15)" value={form.badgeNumber} onChange={(e) => setForm({ ...form, badgeNumber: e.target.value })} required />
                </>
              )}

              <button type="submit">Registrar entrada</button>
            </form>
          </section>
        </section>
      )}

      <section className="panel">
        <div className="panel-head-inline">
          <h3>Visitas activas</h3>
          <label>
            Tarjetas visibles
            <select value={activeLimit} onChange={(e) => setActiveLimit(Number(e.target.value))}>
              {[2, 4, 6, 8, 10, 12].map((num) => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </label>
        </div>
        <ul className="list active-cards-grid" style={{ '--active-cols': String(Math.min(activeLimit, 4)) }}>
          {visibleActiveVisits.map((visit) => (
            <li key={visit._id} className="active-visit-card">
              <div className="active-visit-body" style={{ borderLeft: `8px solid ${visitTypes[visit.category]?.color || '#1f2937'}` }}>
                <strong>{visit.visitorName}</strong>
                <p><span>Tipo:</span> {typeLabel[visit.category] || visit.category}</p>
                <p><span>A quien visita:</span> {visit.hostPerson || '—'}</p>
                <p><span>Motivo:</span> {visit.purpose}</p>
                {visit.badgeNumber && <p><span>Tarjeta:</span> {visit.badgeNumber}</p>}
                {expandedActive[visit._id] && (
                  <p><span>Detalle:</span> DPI {visit.visitorDocument} · Entrada {new Date(visit.checkedInAt || visit.scheduledAt).toLocaleString()}</p>
                )}
              </div>
              <div className="user-card-actions active-actions">
                <button onClick={() => setExpandedActive((prev) => ({ ...prev, [visit._id]: !prev[visit._id] }))}>
                  {expandedActive[visit._id] ? 'Ocultar detalles' : 'Ver detalles'}
                </button>
                <button
                  onClick={async () => {
                    await request(`/visits/${visit._id}/check-out`, { method: 'PUT', token });
                    await loadVisits();
                  }}
                  disabled={visit.status === 'completed'}
                >
                  Dar salida
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h3>Histórico de salidas</h3>
        <div className="history-filters">
          <input
            placeholder="Buscar por nombre, motivo o a quien visita"
            value={historyFilters.search}
            onChange={(e) => setHistoryFilters({ ...historyFilters, search: e.target.value })}
          />
          <select value={historyFilters.category} onChange={(e) => setHistoryFilters({ ...historyFilters, category: e.target.value })}>
            <option value="all">Todas las categorías</option>
            <option value="visitor">Visita</option>
            <option value="client">Cliente</option>
            <option value="provider">Proveedor</option>
          </select>
          <input type="date" value={historyFilters.dateFrom} onChange={(e) => setHistoryFilters({ ...historyFilters, dateFrom: e.target.value })} />
          <input type="date" value={historyFilters.dateTo} onChange={(e) => setHistoryFilters({ ...historyFilters, dateTo: e.target.value })} />
        </div>
        <div className="table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>A quien visita</th>
                <th>Motivo</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Tiempo activo</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistoryVisits.map((visit) => (
                <tr key={visit._id}>
                  <td>{visit.visitorName}</td>
                  <td>{typeLabel[visit.category] || visit.category}</td>
                  <td>{visit.hostPerson || '—'}</td>
                  <td>{visit.purpose}</td>
                  <td>{new Date(visit.checkedInAt || visit.scheduledAt).toLocaleString()}</td>
                  <td>{visit.checkedOutAt ? new Date(visit.checkedOutAt).toLocaleString() : '—'}</td>
                  <td>{formatDuration(visit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
