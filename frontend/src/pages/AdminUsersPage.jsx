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
  const [activeTab, setActiveTab] = useState('users');

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
      <AppShell title="Administración">
        <section className="panel"><p>No tienes permisos para ver esta sección.</p></section>
      </AppShell>
    );
  }

  return (
    <AppShell title="Administración">
      {error && <p className="error-msg">{error}</p>}
      <section className="panel">
        <div className="admin-tabs" role="tablist" aria-label="Secciones de administración">
          <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')} role="tab" aria-selected={activeTab === 'users'}>
            Usuarios
          </button>
          <button className={activeTab === 'badges' ? 'active' : ''} onClick={() => setActiveTab('badges')} role="tab" aria-selected={activeTab === 'badges'}>
            Tarjetas de visita
          </button>
        </div>
      </section>

      {activeTab === 'users' && (
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
      )}

      {activeTab === 'badges' && (
        <section className="panel">
          <h2>Configuración de tarjetas y tipos de visita</h2>
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
            <button type="submit">Guardar configuración</button>
          </form>
        </section>
      )}
    </AppShell>
  );
}
