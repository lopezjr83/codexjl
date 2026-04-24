import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import UsersAdminPanel from '../components/UsersAdminPanel';
import { request } from '../api/http';
import { useAuth } from '../contexts/AuthContext';
import { hasFeatureAccess } from '../utils/permissions';

export default function AdminUsersPage() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [visitTypes, setVisitTypes] = useState({});
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      const usersData = await request('/users', { token });
      setUsers(usersData || []);
    } catch (e) {
      setError(e.message);
    }
  };

  const loadVisitTypes = async () => {
    const data = await request('/visit-types', { token });
    setVisitTypes(data || {});
  };

  useEffect(() => {
    if (hasFeatureAccess(user, 'usersAdmin')) {
      loadUsers();
      loadVisitTypes();
    }
  }, [user]);

  if (!hasFeatureAccess(user, 'usersAdmin')) {
    return (
      <AppShell title="Administración de usuarios">
        <section className="panel"><p>No tienes permisos para ver esta sección.</p></section>
      </AppShell>
    );
  }

  return (
    <AppShell title="Administración de usuarios">
      {error && <p className="error-msg">{error}</p>}
      <UsersAdminPanel
        users={users}
        onCreate={async (payload) => {
          await request('/users', { method: 'POST', body: payload, token });
          await loadUsers();
        }}
        onToggleActive={async (selectedUser) => {
          await request(`/users/${selectedUser.id}`, { method: 'PUT', body: { isActive: !selectedUser.isActive }, token });
          await loadUsers();
        }}
        onResetPassword={async (id) => {
          await request(`/users/${id}/reset-password`, { method: 'PUT', body: { newPassword: 'Temp12345!' }, token });
          await loadUsers();
        }}
        onUpdateAccess={async (id, access) => {
          await request(`/users/${id}`, { method: 'PUT', body: access, token });
          await loadUsers();
        }}
      />
      <section className="panel">
        <h2>Configuración de tipos de visita</h2>
        <form className="grid-form" onSubmit={async (e) => {
          e.preventDefault();
          await request('/visit-types', { method: 'PUT', body: visitTypes, token });
          await loadVisitTypes();
        }}>
          {Object.keys(visitTypes).map((key) => (
            <div key={key} className="panel">
              <strong>{key}</strong>
              <input
                placeholder="Etiqueta"
                value={visitTypes[key]?.label || ''}
                onChange={(e) => setVisitTypes((prev) => ({ ...prev, [key]: { ...prev[key], label: e.target.value, key } }))}
              />
              <input
                type="color"
                value={visitTypes[key]?.color || '#3b82f6'}
                onChange={(e) => setVisitTypes((prev) => ({ ...prev, [key]: { ...prev[key], color: e.target.value, key } }))}
              />
            </div>
          ))}
          <button type="submit">Guardar tipos</button>
        </form>
      </section>
    </AppShell>
  );
}
