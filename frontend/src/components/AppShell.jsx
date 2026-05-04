import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hasFeatureAccess } from '../utils/permissions';

const IconDashboard = () => (
  <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
);
const IconOps = () => (
  <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </svg>
);
const IconUser = () => (
  <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconUsers = () => (
  <svg className="nav-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconMenu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

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

  const roleLabel = user?.role === 'admin' ? 'Administrador' : 'Staff';
  const todayStr = new Date().toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <main className="dashboard-shell" style={{ '--sidebar-width': `${sidebarWidth}px` }}>
      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🏢</div>
          <h2>Control de Visitas</h2>
          <p>{roleLabel}</p>
        </div>

        <nav>
          {hasFeatureAccess(user, 'dashboard') && (
            <NavLink to="/dashboard" onClick={() => setIsSidebarOpen(false)}>
              <IconDashboard /> Dashboard
            </NavLink>
          )}
          {hasFeatureAccess(user, 'operations') && (
            <NavLink to="/operations" onClick={() => setIsSidebarOpen(false)}>
              <IconOps /> Operación
            </NavLink>
          )}
          {hasFeatureAccess(user, 'profile') && (
            <NavLink to="/profile" onClick={() => setIsSidebarOpen(false)}>
              <IconUser /> Mi perfil
            </NavLink>
          )}
          {hasFeatureAccess(user, 'usersAdmin') && (
            <NavLink to="/admin/users" onClick={() => setIsSidebarOpen(false)}>
              <IconUsers /> Usuarios
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <strong>{user?.name}</strong>
            {user?.email}
          </div>
          <button className="sidebar-logout-btn" onClick={logout}>
            <IconLogout /> Cerrar sesión
          </button>
        </div>

        <button className="sidebar-resize-handle" onMouseDown={startResize} aria-label="Ajustar ancho de sidebar" />
      </aside>

      <section className="dashboard-layout">
        <header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <button
              type="button"
              className="menu-toggle"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              aria-label="Abrir menú"
            >
              <IconMenu />
            </button>
            <h1>{title}</h1>
          </div>
          <span className="header-date">{todayStr}</span>
        </header>

        <div className="dashboard-content">
          {children}
        </div>
      </section>

      {isSidebarOpen && (
        <button className="sidebar-backdrop" aria-label="Cerrar menú" onClick={() => setIsSidebarOpen(false)} />
      )}
    </main>
  );
}
