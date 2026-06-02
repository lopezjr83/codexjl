import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../contexts/AuthContext';

const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'dev';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async ({ name, email, password }) => {
    await register({ name, email, password });
    navigate('/dashboard');
  };

  return (
    <main className="auth-layout">
      <AuthForm title="Crear cuenta" buttonLabel="Registrarme" onSubmit={handleRegister} includeName />
      <p>
        ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
      </p>
      <small>Versión: {APP_VERSION}</small>
    </main>
  );
}
