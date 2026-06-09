import { useAuth } from '../context/AuthContext';
import Login from '../pages/Login';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen app-bg flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
        <p className="t3 text-sm font-semibold animate-pulse">Verifying credentials...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login />;
  }

  return children;
}
