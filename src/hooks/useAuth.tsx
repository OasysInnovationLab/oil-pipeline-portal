import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { keycloak, keycloakInitOptions, getUserInfo, isAdmin } from '@/lib/keycloak';

// =============================================================================
// Types
// =============================================================================

interface User {
  username: string;
  email: string;
  name: string;
  roles: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  isAdmin: boolean;
  login: () => void;
  logout: () => void;
}

// =============================================================================
// Context
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// Provider
// =============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        const authenticated = await keycloak.init(keycloakInitOptions);
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          const userInfo = getUserInfo();
          setUser(userInfo);
        }
      } catch (error) {
        console.error('Keycloak initialization failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initKeycloak();

    // Set up token refresh
    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).catch(() => {
        console.error('Token refresh failed');
        setIsAuthenticated(false);
        setUser(null);
      });
    };

    // Handle auth state changes
    keycloak.onAuthSuccess = () => {
      setIsAuthenticated(true);
      setUser(getUserInfo());
    };

    keycloak.onAuthLogout = () => {
      setIsAuthenticated(false);
      setUser(null);
    };
  }, []);

  const login = useCallback(() => {
    keycloak.login();
  }, []);

  const logout = useCallback(() => {
    keycloak.logout({ redirectUri: window.location.origin });
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    isAdmin: isAdmin(),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =============================================================================
// Hook
// =============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
