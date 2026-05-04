import { useState } from 'react';

export default function ProfilePanel({ user, onUpdateProfile, onChangePassword }) {
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleProfileSave = async (e) => {
    e.preventDefault();
    await onUpdateProfile(profileForm);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    try {
      await onChangePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2500);
    } catch (err) {
      setPasswordError(err.message || 'Error al cambiar contraseña');
    }
  };

  return (
    <>
      <section className="panel">
        <div className="profile-section-head">
          <div className="profile-section-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <h2>Información de perfil</h2>
            <p>Actualiza tu nombre, correo y teléfono de contacto.</p>
          </div>
        </div>
        <form className="grid-form" onSubmit={handleProfileSave}>
          <input
            value={profileForm.name}
            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            placeholder="Nombre completo"
            required
          />
          <input
            value={profileForm.email}
            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
            placeholder="Correo electrónico"
            type="email"
            required
          />
          <input
            value={profileForm.phone}
            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            placeholder="Teléfono (opcional)"
            style={{ gridColumn: '1 / -1' }}
          />
          <div className="form-footer">
            <button type="submit" className={profileSaved ? 'success' : ''}>
              {profileSaved ? '✓ Cambios guardados' : 'Guardar perfil'}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="profile-section-head">
          <div className="profile-section-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <div>
            <h2>Seguridad</h2>
            <p>Actualiza tu contraseña de acceso.</p>
          </div>
        </div>
        <form className="grid-form" onSubmit={handlePasswordChange}>
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            placeholder="Contraseña actual"
            required
          />
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            placeholder="Nueva contraseña"
            required
          />
          {passwordError && <p className="error-msg" style={{ gridColumn: '1/-1' }}>{passwordError}</p>}
          <div className="form-footer">
            <button type="submit" className={passwordSaved ? 'success' : ''}>
              {passwordSaved ? '✓ Contraseña actualizada' : 'Actualizar contraseña'}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
