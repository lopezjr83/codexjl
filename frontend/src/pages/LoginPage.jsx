import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async ({ email, password }) => {
    await login(email, password);
    navigate('/dashboard');
  };

  return (
    <main className="auth-layout">
      <AuthForm title="Iniciar sesión" buttonLabel="Entrar" onSubmit={handleLogin} />
      <p>
        ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
      </p>
    </main>
  );
}
