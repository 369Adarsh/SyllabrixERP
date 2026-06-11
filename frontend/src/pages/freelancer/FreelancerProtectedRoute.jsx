import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function FreelancerProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/freelancer/login" replace />;
  return children;
}
