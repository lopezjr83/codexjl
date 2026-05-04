import { useState } from 'react';

const emptyClient = { companyName: '', contactName: '', email: '', notes: '' };

export default function ClientsPanel({ clients, onCreate, onDelete }) {
  const [form, setForm] = useState(emptyClient);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onCreate(form);
    setForm(emptyClient);
  };

  return (
    <section className="panel">
      <h2>Clientes</h2>
      <form className="grid-form" onSubmit={handleSubmit}>
        <input placeholder="Empresa" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
        <input placeholder="Contacto" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} required />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <input placeholder="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button type="submit">Crear cliente</button>
      </form>
      <ul className="list">
        {clients.map((client) => (
          <li key={client._id}>
            <div>
              <strong>{client.companyName}</strong>
              <p>{client.contactName}</p>
            </div>
            <button className="danger" onClick={() => onDelete(client._id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
