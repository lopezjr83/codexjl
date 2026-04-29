import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hasFeatureAccess } from '../utils/permissions';

export default function AppShell({ title, children }) {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(localStorage.getItem('sidebar-width')) || 260);

  useEffect(() => {
    localStorage.setItem('sidebar-width', String(sidebarWidth));
  }, [sidebarWidth]);

  const startResize = (event) => {
    event.preventDefault();

    const onMouseMove = (moveEvent) => {
      const next = Math.min(420, Math.max(220, moveEvent.clientX));
      setSidebarWidth(next);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <main className="dashboard-shell" style={{ '--sidebar-width': `${sidebarWidth}px` }}>
      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <h2>Control de Visitas</h2>
          <p>{user?.name}</p>
        </div>

        <nav>
          {hasFeatureAccess(user, 'dashboard') && <NavLink to="/dashboard" onClick={() => setIsSidebarOpen(false)}>Dashboard</NavLink>}
          {hasFeatureAccess(user, 'operations') && <NavLink to="/operations" onClick={() => setIsSidebarOpen(false)}>Operación</NavLink>}
          {hasFeatureAccess(user, 'profile') && <NavLink to="/profile" onClick={() => setIsSidebarOpen(false)}>Mi perfil</NavLink>}
          {hasFeatureAccess(user, 'usersAdmin') && <NavLink to="/admin" onClick={() => setIsSidebarOpen(false)}>Administración</NavLink>}
        </nav>

        <button onClick={logout}>Cerrar sesión</button>
        <button className="sidebar-resize-handle" onMouseDown={startResize} aria-label="Ajustar ancho de sidebar" />
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
