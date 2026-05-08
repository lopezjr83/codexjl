import { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell';
import DpiCapture from '../components/DpiCapture';
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
  badgeNumber: '',
  dpiPhoto: ''
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
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);

  const loadVisits = async () => {
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

  const activeVisits = useMemo(() => visits.filter((v) => v.status !== 'completed'), [visits]);
  const visibleActiveVisits = useMemo(() => activeVisits.slice(0, activeLimit), [activeVisits, activeLimit]);
  const historyVisits = useMemo(() => visits.filter((v) => v.status === 'completed'), [visits]);

  const filteredHistoryVisits = useMemo(() => historyVisits.filter((visit) => {
    const text = `${visit.visitorName} ${visit.hostPerson || ''} ${visit.purpose}`.toLowerCase();
    const matchesSearch = !historyFilters.search || text.includes(historyFilters.search.toLowerCase());
    const matchesCategory = historyFilters.category === 'all' || visit.category === historyFilters.category;
    const entryDate = new Date(visit.checkedInAt || visit.scheduledAt);
    const matchesFrom = !historyFilters.dateFrom || entryDate >= new Date(`${historyFilters.dateFrom}T00:00:00`);
    const matchesTo = !historyFilters.dateTo || entryDate <= new Date(`${historyFilters.dateTo}T23:59:59`);
    return matchesSearch && matchesCategory && matchesFrom && matchesTo;
  }), [historyVisits, historyFilters]);

  const formatDuration = (visit) => {
    if (!visit.checkedOutAt || !visit.checkedInAt) return '—';
    const minutes = Math.max(0, Math.round((new Date(visit.checkedOutAt) - new Date(visit.checkedInAt)) / 60000));
    const hours = Math.floor(minutes / 60);
    return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
  };

  const setCategory = (cat) => setForm({ ...initialForm, category: cat });

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        visitorName: `${form.firstName} ${form.lastName}`.trim(),
        badgeNumber: form.category === 'visitor' ? undefined : Number(form.badgeNumber),
        phone: form.category === 'provider' ? form.phone : undefined,
        company: form.category === 'provider' ? form.company : undefined,
        scheduledAt: localNow.toISOString()
      };
      await request('/visits', { method: 'POST', body: payload, token });
      setForm(initialForm);
      setShowForm(false);
      await loadVisits();
    } finally {
      setSubmitting(false);
    }
  };

  const CATEGORIES = [
    { value: 'visitor', label: typeLabel.visitor },
    { value: 'client', label: typeLabel.client },
    { value: 'provider', label: typeLabel.provider }
  ];

  return (
    <AppShell title="Operación">

      {/* ── Header bar ─────────────────────────────────────────── */}
      <section className="panel ops-header-panel">
        <div className="panel-head-inline">
          <div>
            <h2>Registro de visitas</h2>
            <p>
              {activeVisits.length > 0
                ? `${activeVisits.length} visita${activeVisits.length !== 1 ? 's' : ''} activa${activeVisits.length !== 1 ? 's' : ''} en sitio`
                : 'Sin visitas activas en este momento'}
            </p>
          </div>
          <button
            className={showForm ? 'ghost' : ''}
            onClick={() => { setShowForm((prev) => !prev); if (!showForm) setForm(initialForm); }}
          >
            {showForm ? '✕ Cerrar formulario' : '+ Nuevo ingreso'}
          </button>
        </div>
      </section>

      {error && <p className="error-msg">{error}</p>}

      {/* ── Registration form ──────────────────────────────────── */}
      {showForm && (
        <section className="panel reg-form-panel">
          <div className="reg-form-layout">

            {/* Left: form fields */}
            <form className="reg-form" onSubmit={submit}>

              {/* Category selector */}
              <div className="form-field-group">
                <span className="form-group-label">Tipo de visita</span>
                <div className="category-tabs">
                  {CATEGORIES.map(({ value, label }) => (
                    <button
                      type="button"
                      key={value}
                      className={`category-tab${form.category === value ? ' active' : ''}`}
                      style={form.category === value ? {
                        background: visitTypes[value]?.color || 'var(--c-primary)',
                        borderColor: visitTypes[value]?.color || 'var(--c-primary)',
                        color: '#fff'
                      } : {}}
                      onClick={() => setCategory(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal info */}
              <div className="form-field-group">
                <span className="form-group-label">Datos personales</span>
                <div className="form-row">
                  <input
                    placeholder="Nombre"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    autoFocus
                    required
                  />
                  <input
                    placeholder="Apellido"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                  />
                </div>
                <input
                  placeholder="Número de DPI"
                  value={form.visitorDocument}
                  onChange={(e) => setForm({ ...form, visitorDocument: e.target.value })}
                  required
                />
              </div>

              {/* Visit details */}
              <div className="form-field-group">
                <span className="form-group-label">Detalles de la visita</span>
                <input
                  placeholder="Motivo de visita"
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  required
                />
                <input
                  placeholder="Persona a quien visita"
                  value={form.hostPerson}
                  onChange={(e) => setForm({ ...form, hostPerson: e.target.value })}
                  required
                />
              </div>

              {/* Category-specific fields */}
              {form.category === 'client' && (
                <div className="form-field-group">
                  <span className="form-group-label">Datos de cliente</span>
                  <input
                    type="number"
                    min="1" max="15"
                    placeholder="Número de tarjeta (1–15)"
                    value={form.badgeNumber}
                    onChange={(e) => setForm({ ...form, badgeNumber: e.target.value })}
                    required
                  />
                </div>
              )}
              {form.category === 'provider' && (
                <div className="form-field-group">
                  <span className="form-group-label">Datos de proveedor</span>
                  <div className="form-row">
                    <input
                      placeholder="Empresa"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      required
                    />
                    <input
                      placeholder="Teléfono (opcional)"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <input
                    type="number"
                    min="1" max="15"
                    placeholder="Número de tarjeta (1–15)"
                    value={form.badgeNumber}
                    onChange={(e) => setForm({ ...form, badgeNumber: e.target.value })}
                    required
                  />
                </div>
              )}

              <button type="submit" className="reg-submit-btn" disabled={submitting}>
                {submitting ? 'Registrando…' : 'Registrar entrada'}
              </button>
            </form>

            {/* Right: clock + photo */}
            <div className="reg-form-aside">
              <div className="form-clock">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <div>
                  <span className="form-clock-time">
                    {localNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="form-clock-date">
                    {localNow.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="form-field-group">
                <span className="form-group-label">Foto del DPI</span>
                <DpiCapture
                  value={form.dpiPhoto}
                  onChange={(photo) => setForm({ ...form, dpiPhoto: photo })}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Active visits ──────────────────────────────────────── */}
      <section className="panel">
        <div className="panel-head-inline">
          <h3>Visitas activas</h3>
          <label>
            Tarjetas visibles
            <select value={activeLimit} onChange={(e) => setActiveLimit(Number(e.target.value))}>
              {[2, 4, 6, 8, 10, 12].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>

        {visibleActiveVisits.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">✅</span>
            No hay visitas activas en este momento
          </div>
        )}

        <ul className="list active-cards-grid" style={{ '--active-cols': String(Math.min(activeLimit, 4)) }}>
          {visibleActiveVisits.map((visit) => {
            const cardColor = visitTypes[visit.category]?.color || '#1f2937';
            return (
              <li key={visit._id} className="active-visit-card" style={{ backgroundColor: cardColor }}>
                <div className="active-visit-body">
                  <div className="visit-head">
                    <span className="visit-badge-number">{String(visit.badgeNumber || 0).padStart(2, '0')}</span>
                    <div style={{ flex: 1 }}>
                      <strong>{visit.visitorName}</strong>
                      <span className="visit-type-label">{typeLabel[visit.category] || visit.category}</span>
                    </div>
                    {visit.dpiPhoto && (
                      <img
                        src={visit.dpiPhoto}
                        alt="DPI"
                        className="dpi-thumb-card"
                        onClick={() => setPhotoPreview(visit.dpiPhoto)}
                      />
                    )}
                  </div>
                  <p><span>A quien visita:</span> {visit.hostPerson || '—'}</p>
                  <p><span>Motivo:</span> {visit.purpose}</p>
                  {expandedActive[visit._id] && (
                    <p><span>DPI:</span> {visit.visitorDocument} · Entrada: {new Date(visit.checkedInAt || visit.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  )}
                </div>
                <div className="active-card-actions">
                  <button
                    className="details-btn"
                    onClick={() => setExpandedActive((prev) => ({ ...prev, [visit._id]: !prev[visit._id] }))}
                  >
                    {expandedActive[visit._id] ? 'Ocultar' : 'Ver más'}
                  </button>
                  <button
                    className="checkout-btn"
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
            );
          })}
        </ul>
      </section>

      {/* ── History ────────────────────────────────────────────── */}
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

        {filteredHistoryVisits.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📂</span>
            Sin registros de salida
          </div>
        ) : (
          <div className="table-wrap">
            <table className="history-table history-table-clickable">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>A quien visita</th>
                  <th>Motivo</th>
                  <th>Entrada</th>
                  <th>Salida</th>
                  <th>Duración</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredHistoryVisits.map((visit) => (
                  <tr key={visit._id} onClick={() => setSelectedVisit(visit)} className="history-row-clickable">
                    <td onClick={(e) => e.stopPropagation()}>
                      {visit.dpiPhoto
                        ? <img src={visit.dpiPhoto} alt="DPI" className="dpi-thumb-table" onClick={() => setPhotoPreview(visit.dpiPhoto)} />
                        : <span className="dpi-no-photo">—</span>
                      }
                    </td>
                    <td><strong>{visit.visitorName}</strong></td>
                    <td>{typeLabel[visit.category] || visit.category}</td>
                    <td>{visit.hostPerson || '—'}</td>
                    <td>{visit.purpose}</td>
                    <td>{new Date(visit.checkedInAt || visit.scheduledAt).toLocaleString()}</td>
                    <td>{visit.checkedOutAt ? new Date(visit.checkedOutAt).toLocaleString() : '—'}</td>
                    <td>{formatDuration(visit)}</td>
                    <td className="row-detail-hint">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Visit detail modal ─────────────────────────────────── */}
      {selectedVisit && (
        <div className="modal-backdrop" onClick={() => setSelectedVisit(null)}>
          <div className="visit-detail-modal" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="vd-header" style={{ borderColor: visitTypes[selectedVisit.category]?.color || 'var(--c-primary)' }}>
              <div className="vd-header-info">
                {selectedVisit.badgeNumber > 0 && (
                  <span className="vd-badge-num" style={{ background: visitTypes[selectedVisit.category]?.color || 'var(--c-primary)' }}>
                    #{String(selectedVisit.badgeNumber).padStart(2, '0')}
                  </span>
                )}
                <div>
                  <h2 className="vd-name">{selectedVisit.visitorName}</h2>
                  <span className="vd-category" style={{ background: visitTypes[selectedVisit.category]?.color || 'var(--c-primary)' }}>
                    {typeLabel[selectedVisit.category] || selectedVisit.category}
                  </span>
                </div>
              </div>
              <button className="vd-close" onClick={() => setSelectedVisit(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="vd-body">

              {/* Photo */}
              {selectedVisit.dpiPhoto && (
                <div className="vd-photo-wrap">
                  <img
                    src={selectedVisit.dpiPhoto}
                    alt="Foto DPI"
                    className="vd-photo"
                    onClick={() => setPhotoPreview(selectedVisit.dpiPhoto)}
                    title="Clic para ampliar"
                  />
                  <span className="vd-photo-label">Foto del DPI</span>
                </div>
              )}

              {/* Fields grid */}
              <div className="vd-fields">

                <div className="vd-section-label">Identificación</div>
                <div className="vd-field-row">
                  <div className="vd-field">
                    <span className="vd-fl">No. DPI</span>
                    <span className="vd-fv">{selectedVisit.visitorDocument || '—'}</span>
                  </div>
                  {selectedVisit.company && (
                    <div className="vd-field">
                      <span className="vd-fl">Empresa</span>
                      <span className="vd-fv">{selectedVisit.company}</span>
                    </div>
                  )}
                  {selectedVisit.phone && (
                    <div className="vd-field">
                      <span className="vd-fl">Teléfono</span>
                      <span className="vd-fv">{selectedVisit.phone}</span>
                    </div>
                  )}
                </div>

                <div className="vd-section-label">Detalles de la visita</div>
                <div className="vd-field-row">
                  <div className="vd-field">
                    <span className="vd-fl">A quien visita</span>
                    <span className="vd-fv">{selectedVisit.hostPerson || '—'}</span>
                  </div>
                  <div className="vd-field">
                    <span className="vd-fl">Motivo</span>
                    <span className="vd-fv">{selectedVisit.purpose}</span>
                  </div>
                </div>

                <div className="vd-section-label">Tiempos</div>
                <div className="vd-field-row">
                  <div className="vd-field">
                    <span className="vd-fl">Entrada</span>
                    <span className="vd-fv">
                      {selectedVisit.checkedInAt
                        ? new Date(selectedVisit.checkedInAt).toLocaleString()
                        : new Date(selectedVisit.scheduledAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="vd-field">
                    <span className="vd-fl">Salida</span>
                    <span className="vd-fv">
                      {selectedVisit.checkedOutAt
                        ? new Date(selectedVisit.checkedOutAt).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                  <div className="vd-field">
                    <span className="vd-fl">Duración</span>
                    <span className="vd-fv vd-fv-highlight">{formatDuration(selectedVisit)}</span>
                  </div>
                </div>

              </div>
            </div>

            <div className="vd-footer">
              <button className="ghost" onClick={() => setSelectedVisit(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {photoPreview && (
        <div className="modal-backdrop" onClick={() => setPhotoPreview('')}>
          <div className="dpi-photo-modal" onClick={(e) => e.stopPropagation()}>
            <img src={photoPreview} alt="Foto DPI" />
            <button className="danger" onClick={() => setPhotoPreview('')}>Cerrar</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
