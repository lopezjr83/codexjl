import { useState } from 'react';

const emptyUser = { name: '', email: '', password: '', phone: '', role: 'staff' };

export default function UsersAdminPanel({ users, onCreate, onToggleActive, onResetPassword }) {
  const [form, setForm] = useState(emptyUser);

  return (
    <section className="panel">
      <h2>Administración de usuarios</h2>
      <form className="grid-form" onSubmit={(e) => { e.preventDefault(); onCreate(form); setForm(emptyUser); }}>
        <input placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Correo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="Contraseña" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <input placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Crear usuario</button>
      </form>

      <ul className="list">
        {users.map((user) => (
          <li key={user.id}>
            <div>
              <strong>{user.name}</strong>
              <p>{user.email} · {user.role} · {user.isActive ? 'Activo' : 'Inactivo'}</p>
            </div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button onClick={() => onToggleActive(user)}>{user.isActive ? 'Desactivar' : 'Activar'}</button>
              <button className="danger" onClick={() => onResetPassword(user.id)}>Reset pass</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
