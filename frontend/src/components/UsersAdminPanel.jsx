import { useMemo, useState } from 'react';
import { getEffectivePermissions } from '../utils/permissions';

const emptyUser = { name: '', email: '', password: '', phone: '' };
const permissionFields = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'operations', label: 'Operación' },
  { key: 'profile', label: 'Perfil' },
  { key: 'reports', label: 'Reportes' },
  { key: 'usersAdmin', label: 'Usuarios' }
];

export default function UsersAdminPanel({ users, onCreate, onToggleActive, onResetPassword, onUpdateAccess }) {
  const [form, setForm] = useState(emptyUser);
  const [drafts, setDrafts] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);

  const mappedUsers = useMemo(
    () => users.map((user) => ({ ...user, effectivePermissions: getEffectivePermissions(user) })),
    [users]
  );

  const getDraft = (user) => drafts[user.id] || {
    role: user.role,
    permissions: { ...user.effectivePermissions }
  };

  const setRole = (user, role) => {
    const nextPermissions = role === 'admin'
      ? { dashboard: true, operations: true, profile: true, reports: true, usersAdmin: true }
      : getDraft(user).permissions;

    setDrafts((prev) => ({
      ...prev,
      [user.id]: {
        role,
        permissions: nextPermissions
      }
    }));
  };

  const togglePermission = (user, key) => {
    const draft = getDraft(user);
    if (draft.role === 'admin') return;

    setDrafts((prev) => ({
      ...prev,
      [user.id]: {
        ...draft,
        permissions: {
          ...draft.permissions,
          [key]: !draft.permissions[key]
        }
      }
    }));
  };

  const selectedUser = mappedUsers.find((user) => user.id === selectedUserId) || null;

  return (
    <section className="panel">
      <h2>Administración de usuarios</h2>
      <form className="grid-form" onSubmit={(e) => { e.preventDefault(); onCreate(form); setForm(emptyUser); }}>
        <input placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Correo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="Contraseña" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <input placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <small>Los usuarios nuevos se crean como <strong>usuario</strong> por defecto.</small>
        <button type="submit">Crear usuario</button>
      </form>

      <ul className="list">
        {mappedUsers.map((user) => (
          <li key={user.id}>
            <div>
              <strong>{user.name}</strong>
              <p>{user.email} · {user.role} · {user.isActive ? 'Activo' : 'Inactivo'}</p>
            </div>

            <div style={{ display: 'grid', gap: '.5rem' }}>
              <button onClick={() => setSelectedUserId(user.id)}>Permisos</button>
              <button onClick={() => onToggleActive(user)}>{user.isActive ? 'Desactivar' : 'Activar'}</button>
              <button className="danger" onClick={() => onResetPassword(user.id)}>Reset pass</button>
            </div>
          </li>
        ))}
      </ul>

      {selectedUser && (
        <section className="modal-backdrop" onClick={() => setSelectedUserId(null)}>
          <article className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Permisos de {selectedUser.name}</h3>
            <p>{selectedUser.email}</p>

            <div className="access-editor">
              <label>
                Rol
                <select value={getDraft(selectedUser).role} onChange={(e) => setRole(selectedUser, e.target.value)}>
                  <option value="staff">Usuario</option>
                  <option value="admin">Administrativo</option>
                </select>
              </label>

              <div className="permission-grid">
                {permissionFields.map((field) => (
                  <label key={field.key}>
                    <input
                      type="checkbox"
                      checked={Boolean(getDraft(selectedUser).permissions[field.key])}
                      disabled={getDraft(selectedUser).role === 'admin'}
                      onChange={() => togglePermission(selectedUser, field.key)}
                    />
                    {field.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={async () => {
                  await onUpdateAccess(selectedUser.id, getDraft(selectedUser));
                  setSelectedUserId(null);
                }}
              >
                Guardar acceso
              </button>
              <button className="danger" onClick={() => setSelectedUserId(null)}>Cerrar</button>
            </div>
          </article>
        </section>
      )}
    </section>
  );
}
