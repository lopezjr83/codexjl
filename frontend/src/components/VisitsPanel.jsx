import { useState } from 'react';

const emptyVisit = { client: '', visitorName: '', visitorDocument: '', purpose: '', scheduledAt: '' };

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
              <strong>{visit.visitorName}</strong>
              <p>{visit.client?.companyName} • {new Date(visit.scheduledAt).toLocaleString()}</p>
            </div>
            <button className="danger" onClick={() => onDelete(visit._id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
