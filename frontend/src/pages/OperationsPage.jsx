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

  const loadVisits = async () => {
    try {
      const visitsData = await request('/visits', { token });
      setVisits(visitsData || []);
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
    visitor: 'Visita',
    client: 'Cliente',
    provider: 'Proveedor'
  }), []);

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      visitorName: `${form.firstName} ${form.lastName}`.trim(),
      badgeNumber: form.category === 'visitor' ? undefined : Number(form.badgeNumber),
      phone: form.category === 'client' ? form.phone : undefined,
      company: form.category === 'provider' ? form.company : undefined,
      hostPerson: form.category === 'visitor' ? undefined : form.hostPerson,
      scheduledAt: localNow.toISOString()
    };

    await request('/visits', { method: 'POST', body: payload, token });
    setForm(initialForm);
    await loadVisits();
  };

  return (
    <AppShell title="Operación">
      <section className="panel">
        <h2>Registro unificado</h2>
        <p>Registra Cliente, Proveedor o Visita en un solo formulario con campos dinámicos.</p>
      </section>

      {error && <p className="error-msg">{error}</p>}

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
            <input value={localNow.toLocaleString()} readOnly />

            {form.category === 'client' && (
              <>
                <input placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                <input placeholder="Persona con quien viene" value={form.hostPerson} onChange={(e) => setForm({ ...form, hostPerson: e.target.value })} required />
                <input type="number" min="1" max="15" placeholder="Tarjeta cliente (1-15)" value={form.badgeNumber} onChange={(e) => setForm({ ...form, badgeNumber: e.target.value })} required />
              </>
            )}

            {form.category === 'provider' && (
              <>
                <input placeholder="Empresa" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
                <input placeholder="Persona con quien viene" value={form.hostPerson} onChange={(e) => setForm({ ...form, hostPerson: e.target.value })} required />
                <input type="number" min="1" max="15" placeholder="Tarjeta proveedor (1-15)" value={form.badgeNumber} onChange={(e) => setForm({ ...form, badgeNumber: e.target.value })} required />
              </>
            )}

            <button type="submit">Registrar entrada</button>
          </form>
        </section>

        <section className="panel">
          <h3>Personas dentro / salidas</h3>
          <ul className="list">
            {visits.map((visit) => (
              <li key={visit._id}>
                <div>
                  <strong>{visit.visitorName}</strong>
                  <p>
                    {typeLabel[visit.category] || visit.category} · DPI: {visit.visitorDocument} · Entrada: {new Date(visit.checkedInAt || visit.scheduledAt).toLocaleString()}
                  </p>
                  {(visit.hostPerson || visit.company || visit.phone || visit.badgeNumber) && (
                    <p>
                      {visit.hostPerson ? `Con: ${visit.hostPerson} · ` : ''}
                      {visit.company ? `Empresa: ${visit.company} · ` : ''}
                      {visit.phone ? `Tel: ${visit.phone} · ` : ''}
                      {visit.badgeNumber ? `Tarjeta: ${visit.badgeNumber}` : ''}
                    </p>
                  )}
                </div>
                <div className="user-card-actions">
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
      </section>
    </AppShell>
  );
}
