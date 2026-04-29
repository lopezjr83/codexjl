import { useState } from 'react';

export default function ProfilePanel({ user, onUpdateProfile, onChangePassword }) {
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

  return (
    <section className="panel">
      <h2>Mi perfil</h2>
      <form className="grid-form" onSubmit={(e) => { e.preventDefault(); onUpdateProfile(profileForm); }}>
        <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} placeholder="Nombre" required />
        <input value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} placeholder="Correo" required />
        <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="Teléfono" />
        <button type="submit">Guardar perfil</button>
      </form>

      <h3>Cambiar contraseña</h3>
      <form className="grid-form" onSubmit={(e) => { e.preventDefault(); onChangePassword(passwordForm); setPasswordForm({ currentPassword: '', newPassword: '' }); }}>
        <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} placeholder="Contraseña actual" required />
        <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="Nueva contraseña" required />
        <button type="submit">Actualizar contraseña</button>
      </form>
    </section>
  );
}
