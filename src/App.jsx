import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function AppContent() {
  const { isLoggedIn, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Sync state with browser history navigation (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Perform redirect operations asynchronously to avoid React state-in-render warnings
  useEffect(() => {
    if (loading) return;

    if (isLoggedIn) {
      if (currentPath === '/login' || currentPath === '/') {
        navigate('/dashboard');
      }
    } else {
      if (currentPath === '/dashboard') {
        navigate('/login');
      }
    }
  }, [isLoggedIn, currentPath, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan/20 border-t-cyan rounded-full animate-spin" />
      </div>
    );
  }

  // Render subpage views based on browser url pathnames
  if (currentPath === '/dashboard' || currentPath.startsWith('/campaigns/')) {
    return (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    );
  }

  if (currentPath === '/login') {
    return (
      <Login
        onLoginSuccess={() => navigate('/dashboard')}
        onBackToHome={() => navigate('/')}
      />
    );
  }

  return (
    <Home onEnter={() => navigate(isLoggedIn ? '/dashboard' : '/login')} />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
