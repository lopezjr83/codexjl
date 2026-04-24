import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import ClientsPanel from '../components/ClientsPanel';
import VisitsPanel from '../components/VisitsPanel';
import { request } from '../api/http';
import { useAuth } from '../contexts/AuthContext';

export default function OperationsPage() {
  const { token } = useAuth();
  const [clients, setClients] = useState([]);
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState('');

  const loadAll = async () => {
    try {
      const [clientsData, visitsData] = await Promise.all([
        request('/clients', { token }),
        request('/visits', { token })
      ]);
      setClients(clientsData || []);
      setVisits(visitsData || []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { loadAll(); }, []);

  return (
    <AppShell title="Operación">
      <section className="panel">
        <h2>Clientes y visitas</h2>
        <p>Programa y gestiona visitas por tipo: visita, cliente o proveedor.</p>
      </section>

      {error && <p className="error-msg">{error}</p>}

      <section className="grid-panels two-cols">
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
          onCheckIn={async (id) => {
            await request(`/visits/${id}/check-in`, { method: 'PUT', token });
            await loadAll();
          }}
          onCheckOut={async (id) => {
            await request(`/visits/${id}/check-out`, { method: 'PUT', token });
            await loadAll();
          }}
          onDelete={async (id) => {
            await request(`/visits/${id}`, { method: 'DELETE', token });
            await loadAll();
          }}
        />
      </section>
    </AppShell>
  );
}
