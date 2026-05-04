import AppShell from '../components/AppShell';
import ProfilePanel from '../components/ProfilePanel';
import { request } from '../api/http';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { token, user, refreshMe } = useAuth();

  return (
    <AppShell title="Mi perfil">
      <div className="grid-panels">
        <ProfilePanel
          user={user}
          onUpdateProfile={async (payload) => {
            await request('/auth/me', { method: 'PUT', body: payload, token });
            await refreshMe();
          }}
          onChangePassword={async (payload) => {
            await request('/auth/me/password', { method: 'PUT', body: payload, token });
          }}
        />
      </div>
    </AppShell>
  );
}
