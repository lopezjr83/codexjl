import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../contexts/AuthContext';

const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'dev';

export default function LoginPage() {
  const { login, sessionMsg } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async ({ email, password }) => {
    await login(email, password);
    navigate('/dashboard');
  };

  return (
    <main className="auth-layout">
      {sessionMsg && (
        <div className="session-expired-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {sessionMsg}
        </div>
      )}
      <AuthForm title="Iniciar sesión" buttonLabel="Entrar" onSubmit={handleLogin} />
      <p>
        ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
      </p>
      <small>Versión: {APP_VERSION}</small>
    </main>
  );
}
