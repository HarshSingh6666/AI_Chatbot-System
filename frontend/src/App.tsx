import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { api } from './lib/api';
import SpaceBackground from './components/SpaceBackground';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ChatDashboard from './pages/ChatDashboard';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import HelpPage from './pages/HelpPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const { token, login, logout, setLoading } = useAuthStore();
  
  // ✅ THEME UPDATE: Theme states nikal rahe hain
  const { theme, setTheme } = useThemeStore();

  // ✅ THEME UPDATE: App load hote hi saved theme ko apply karega
  useEffect(() => {
    setTheme(theme);
  }, []); // Khali array matlab sirf page load hone par ek baar chalega

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const user = await api.auth.me();
        login(token, user);
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [token, login, logout, setLoading]);

  return (
    <BrowserRouter>
      {/* Global Background */}
      <SpaceBackground />
      
      {/* Route Content - must be positioned over the fixed background */}
      <div className="relative z-10 w-full h-full min-h-screen">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={
            <ProtectedRoute>
              <ChatDashboard />
            </ProtectedRoute>
          }>
            <Route path="c/:chatId" element={<ChatDashboard />} />
          </Route>
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}