import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import UsersAdminPanel from '../components/UsersAdminPanel';
import { request } from '../api/http';
import { useAuth } from '../contexts/AuthContext';
import { hasFeatureAccess } from '../utils/permissions';

const TYPE_LABEL = { visitor: 'Visita', client: 'Cliente', provider: 'Proveedor' };

export default function AdminUsersPage() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [visitTypes, setVisitTypes] = useState({});
  const [typeSaved, setTypeSaved] = useState(false);
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
    try {
      const data = await request('/visit-types', { token });
      setVisitTypes(data || {});
    } catch (e) {
      setError(e.message);
    }
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

  const handleSaveTypes = async (e) => {
    e.preventDefault();
    await request('/visit-types', { method: 'PUT', body: visitTypes, token });
    await loadVisitTypes();
    setTypeSaved(true);
    setTimeout(() => setTypeSaved(false), 2500);
  };

  return (
    <AppShell title="Administración">
      {error && <p className="error-msg">{error}</p>}

      <section className="grid-panels">
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
          }}
          onUpdateAccess={async (id, access) => {
            await request(`/users/${id}`, { method: 'PUT', body: access, token });
            await loadUsers();
          }}
        />

        <section className="panel">
          <h2>Tipos de visita</h2>
          <p>Configura la etiqueta y el color de cada categoría de visita.</p>

          <form onSubmit={handleSaveTypes}>
            <div className="visit-type-configs">
              {Object.keys(visitTypes).map((key) => (
                <div key={key} className="visit-type-row">
                  <span className="visit-type-key">{TYPE_LABEL[key] || key}</span>
                  <input
                    placeholder="Etiqueta"
                    value={visitTypes[key]?.label || ''}
                    onChange={(e) =>
                      setVisitTypes((prev) => ({ ...prev, [key]: { ...prev[key], label: e.target.value, key } }))
                    }
                  />
                  <input
                    type="color"
                    value={visitTypes[key]?.color || '#3b82f6'}
                    onChange={(e) =>
                      setVisitTypes((prev) => ({ ...prev, [key]: { ...prev[key], color: e.target.value, key } }))
                    }
                  />
                  <div className="color-preview" style={{ background: visitTypes[key]?.color || '#3b82f6' }} />
                </div>
              ))}
            </div>
            <div className="form-footer">
              <button type="submit">{typeSaved ? '✓ Guardado' : 'Guardar tipos'}</button>
            </div>
          </form>
        </section>
      </section>
    </AppShell>
  );
}
