import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { request } from '../api/http';
import ClientsPanel from '../components/ClientsPanel';
import VisitsPanel from '../components/VisitsPanel';

export default function DashboardPage() {
  const { token, user, logout } = useAuth();
  const [clients, setClients] = useState([]);
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState('');

  const loadAll = async () => {
    try {
      const [clientsData, visitsData] = await Promise.all([
        request('/clients', { token }),
        request('/visits', { token })
      ]);
      setClients(clientsData);
      setVisits(visitsData);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <main className="dashboard-layout">
      <header>
        <div>
          <h1>Control de Visitas</h1>
          <p>Sesión: {user?.name}</p>
        </div>
        <button onClick={logout}>Cerrar sesión</button>
      </header>

      {error && <p className="error-msg">{error}</p>}

      <div className="grid-panels">
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
      </div>
    </main>
  );
}
