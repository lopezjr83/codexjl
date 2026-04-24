import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AppShell({ title, children }) {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <main className="dashboard-shell">
      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <h2>Control de Visitas</h2>
          <p>{user?.name}</p>
        </div>

        <nav>
          <NavLink to="/dashboard" onClick={() => setIsSidebarOpen(false)}>Dashboard</NavLink>
          <NavLink to="/operations" onClick={() => setIsSidebarOpen(false)}>Operación</NavLink>
          <NavLink to="/profile" onClick={() => setIsSidebarOpen(false)}>Mi perfil</NavLink>
          {user?.role === 'admin' && <NavLink to="/admin/users" onClick={() => setIsSidebarOpen(false)}>Usuarios</NavLink>}
        </nav>

        <button onClick={logout}>Cerrar sesión</button>
      </aside>

      <section className="dashboard-layout">
        <header>
          <div>
            <button
              type="button"
              className="menu-toggle"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              aria-label="Abrir menú"
            >
              ☰
            </button>
            <h1>{title}</h1>
            <p>Sesión: {user?.name}</p>
          </div>
        </header>

        {children}
      </section>

      {isSidebarOpen && <button className="sidebar-backdrop" aria-label="Cerrar menú" onClick={() => setIsSidebarOpen(false)} />}
    </main>
  );
}
