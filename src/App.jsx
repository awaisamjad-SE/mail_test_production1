import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function AppContent() {
  const [page, setPage] = useState('home'); // 'home' | 'login' | 'dashboard'
  const { isLoggedIn } = useAuth();

  const handleEnter = () => {
    if (isLoggedIn) {
      setPage('dashboard');
    } else {
      setPage('login');
    }
  };

  const handleBackToHome = () => {
    setPage('home');
  };

  // If logged in and page is 'login', show dashboard instead
  if (isLoggedIn && page === 'login') {
    setPage('dashboard');
  }

  // If logged out and page is 'dashboard', show login instead
  if (!isLoggedIn && page === 'dashboard') {
    setPage('login');
  }

  return (
    <>
      {page === 'home' && (
        <Home onEnter={handleEnter} />
      )}
      
      {page === 'login' && (
        <Login
          onLoginSuccess={() => setPage('dashboard')}
          onBackToHome={handleBackToHome}
        />
      )}
      
      {page === 'dashboard' && (
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      )}
    </>
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
