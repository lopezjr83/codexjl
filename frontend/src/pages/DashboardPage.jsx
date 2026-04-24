import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { request } from '../api/http';
import ClientsPanel from '../components/ClientsPanel';
import VisitsPanel from '../components/VisitsPanel';
import ProfilePanel from '../components/ProfilePanel';
import UsersAdminPanel from '../components/UsersAdminPanel';

const hoursInSite = (visit) => {
  const start = visit.checkedInAt ? new Date(visit.checkedInAt).getTime() : null;
  const end = visit.checkedOutAt ? new Date(visit.checkedOutAt).getTime() : Date.now();
  if (!start) return 0;
  return Math.max(0, Math.round((end - start) / 1000 / 60));
};

export default function DashboardPage() {
  const { token, user, logout, refreshMe } = useAuth();
  const [clients, setClients] = useState([]);
  const [visits, setVisits] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const loadAll = async () => {
    try {
      const requests = [request('/clients', { token }), request('/visits', { token })];
      if (user?.role === 'admin') requests.push(request('/users', { token }));

      const [clientsData, visitsData, usersData] = await Promise.all(requests);
      setClients(clientsData);
      setVisits(visitsData);
      setUsers(usersData || []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const kpis = useMemo(() => {
    const active = visits.filter((v) => v.status === 'checked_in');
    const completedToday = visits.filter((v) => v.checkedOutAt && new Date(v.checkedOutAt).toDateString() === new Date().toDateString());
    const providerInside = active.filter((v) => v.category === 'provider').length;
    const avgMinutes = active.length ? Math.round(active.reduce((acc, v) => acc + hoursInSite(v), 0) / active.length) : 0;
    return { activeCount: active.length, completedTodayCount: completedToday.length, providerInside, avgMinutes };
  }, [visits]);

  return (
    <main className="dashboard-layout">
      <header>
        <div>
          <h1>Control de Visitas</h1>
          <p>Sesión: {user?.name}</p>
        </div>
        <button onClick={logout}>Cerrar sesión</button>
      </header>

      <section className="kpi-grid">
        <article className="kpi-card"><h3>Activos en sitio</h3><strong>{kpis.activeCount}</strong></article>
        <article className="kpi-card"><h3>Salidas hoy</h3><strong>{kpis.completedTodayCount}</strong></article>
        <article className="kpi-card"><h3>Proveedores dentro</h3><strong>{kpis.providerInside}</strong></article>
        <article className="kpi-card"><h3>Promedio min dentro</h3><strong>{kpis.avgMinutes}</strong></article>
      </section>

      {error && <p className="error-msg">{error}</p>}

      <div className="grid-panels">
        <ProfilePanel
          user={user}
          onUpdateProfile={async (payload) => {
            await request('/auth/me', { method: 'PUT', body: payload, token });
            await refreshMe();
          }}
          onChangePassword={async (payload) => {
            await request('/auth/me/password', { method: 'PUT', body: payload, token });
          }}
        />

        <ClientsPanel
          clients={clients}
          onCreate={async (payload) => {
            await request('/clients', { method: 'POST', body: payload, token });
            await loadAll();
          }}
          onDelete={async (id) => {
            await request(`/clients/${id}`, { method: 'DELETE', token });
            await loadAll();
          }}
        />
        <VisitsPanel
          visits={visits}
          clients={clients}
          onCreate={async (payload) => {
            await request('/visits', { method: 'POST', body: payload, token });
            await loadAll();
          }}
          onDelete={async (id) => {
            await request(`/visits/${id}`, { method: 'DELETE', token });
            await loadAll();
          }}
        />
        {user?.role === 'admin' && (
          <UsersAdminPanel
            users={users}
            onCreate={async (payload) => {
              await request('/users', { method: 'POST', body: payload, token });
              await loadAll();
            }}
            onToggleActive={async (selectedUser) => {
              await request(`/users/${selectedUser.id}`, { method: 'PUT', body: { isActive: !selectedUser.isActive }, token });
              await loadAll();
            }}
            onResetPassword={async (id) => {
              await request(`/users/${id}/reset-password`, { method: 'PUT', body: { newPassword: 'Temp12345!' }, token });
              await loadAll();
            }}
          />
        )}
      </div>
    </main>
  );
}
