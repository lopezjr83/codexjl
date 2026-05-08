import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import OperationsPage from './pages/OperationsPage';
import ProfilePage from './pages/ProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';
import ReportsPage from './pages/ReportsPage';
import { hasFeatureAccess } from './utils/permissions';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const FeatureRoute = ({ feature, children }) => {
  const { user } = useAuth();
  return hasFeatureAccess(user, feature) ? children : <Navigate to="/dashboard" replace />;
};

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <FeatureRoute feature="dashboard">
              <DashboardPage />
            </FeatureRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/operations"
        element={
          <PrivateRoute>
            <FeatureRoute feature="operations">
              <OperationsPage />
            </FeatureRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <FeatureRoute feature="profile">
              <ProfilePage />
            </FeatureRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <PrivateRoute>
            <FeatureRoute feature="usersAdmin">
              <AdminUsersPage />
            </FeatureRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <PrivateRoute>
            <FeatureRoute feature="reports">
              <ReportsPage />
            </FeatureRoute>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
