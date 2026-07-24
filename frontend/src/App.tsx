import { useState, useEffect } from 'react';
import { CanvasBoard } from './ui/CanvasBoard';
import { AuthScreen } from './ui/AuthScreen';

/**
 * App — The root component.
 *
 * Routing:
 *   - If the user is not authenticated → show AuthScreen
 *   - If authenticated → show CanvasBoard
 *
 * Persistence:
 *   The JWT token and user info are stored in localStorage.
 *   On app load, we check if a valid session exists and restore it.
 */

interface AuthUser {
  id: string;
  displayName: string;
  email: string;
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string>('');

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('collab_token');
    const storedUser = localStorage.getItem('collab_user');

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch {
        // Corrupted localStorage — clear and show login
        localStorage.removeItem('collab_token');
        localStorage.removeItem('collab_user');
      }
    }
  }, []);

  const handleAuth = (authUser: AuthUser, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('collab_token');
    localStorage.removeItem('collab_user');
  };

  if (!user) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  return (
    <CanvasBoard
      userId={user.id}
      displayName={user.displayName}
      token={token}
      onLogout={handleLogout}
    />
  );
}

export default App;
