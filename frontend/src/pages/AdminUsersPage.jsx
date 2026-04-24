import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import UsersAdminPanel from '../components/UsersAdminPanel';
import { request } from '../api/http';
import { useAuth } from '../contexts/AuthContext';
import { hasFeatureAccess } from '../utils/permissions';

export default function AdminUsersPage() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      const usersData = await request('/users', { token });
      setUsers(usersData || []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    if (hasFeatureAccess(user, 'usersAdmin')) loadUsers();
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
    </AppShell>
  );
}
