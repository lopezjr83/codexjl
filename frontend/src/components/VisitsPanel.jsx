import { useState } from 'react';

const emptyVisit = { client: '', category: 'visitor', visitorName: '', visitorDocument: '', purpose: '', scheduledAt: '' };

const minutesInSite = (visit) => {
  if (!visit.checkedInAt) return 0;
  const start = new Date(visit.checkedInAt).getTime();
  const end = visit.checkedOutAt ? new Date(visit.checkedOutAt).getTime() : Date.now();
  return Math.max(0, Math.round((end - start) / 1000 / 60));
};

export default function VisitsPanel({ visits, clients, onCreate, onDelete }) {
  const [form, setForm] = useState(emptyVisit);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onCreate({ ...form, status: 'scheduled' });
    setForm(emptyVisit);
  };

  return (
    <section className="panel">
      <h2>Visitas</h2>
      <form className="grid-form" onSubmit={handleSubmit}>
        <select value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} required>
          <option value="">Selecciona cliente</option>
          {clients.map((client) => (
            <option key={client._id} value={client._id}>{client.companyName}</option>
          ))}
        </select>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="visitor">Visita</option>
          <option value="client">Cliente</option>
          <option value="provider">Proveedor</option>
        </select>
        <input placeholder="Visitante" value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} required />
        <input placeholder="Documento" value={form.visitorDocument} onChange={(e) => setForm({ ...form, visitorDocument: e.target.value })} required />
        <input placeholder="Motivo" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required />
        <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required />
        <button type="submit">Programar visita</button>
      </form>
      <ul className="list">
        {visits.map((visit) => (
          <li key={visit._id}>
            <div>
              <strong>{visit.visitorName} ({visit.category})</strong>
              <p>{visit.client?.companyName} • {new Date(visit.scheduledAt).toLocaleString()}</p>
              <p>Estatus: {visit.status} • Tiempo en sitio: {minutesInSite(visit)} min • Salida: {visit.checkedOutAt ? new Date(visit.checkedOutAt).toLocaleTimeString() : '—'}</p>
            </div>
            <button className="danger" onClick={() => onDelete(visit._id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
