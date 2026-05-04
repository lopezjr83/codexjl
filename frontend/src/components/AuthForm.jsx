import { useState } from 'react';

export default function AuthForm({ title, onSubmit, buttonLabel, includeName = false }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await onSubmit(form);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="auth-card">
      <h1>{title}</h1>
      <form onSubmit={handleSubmit}>
        {includeName && (
          <input name="name" placeholder="Nombre" value={form.name} onChange={handleChange} required />
        )}
        <input name="email" type="email" placeholder="Correo" value={form.email} onChange={handleChange} required />
        <input
          name="password"
          type="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
          required
        />
        {error && <p className="error-msg">{error}</p>}
        <button type="submit">{buttonLabel}</button>
      </form>
    </div>
  );
}
