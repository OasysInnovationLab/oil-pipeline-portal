import Keycloak from 'keycloak-js';

// =============================================================================
// Keycloak Configuration
// =============================================================================

const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'https://auth.oasysic.net',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'oil',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'pipeline-portal',
};

// Create Keycloak instance
export const keycloak = new Keycloak(keycloakConfig);

// =============================================================================
// Keycloak Initialization Options
// =============================================================================

export const keycloakInitOptions: Keycloak.KeycloakInitOptions = {
  onLoad: 'check-sso',
  silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
  pkceMethod: 'S256',
  checkLoginIframe: false,
};

// =============================================================================
// Token Utilities
// =============================================================================

export async function getToken(): Promise<string | undefined> {
  if (!keycloak.authenticated) {
    return undefined;
  }

  // Refresh token if it will expire in the next 30 seconds
  try {
    await keycloak.updateToken(30);
  } catch (error) {
    console.error('Failed to refresh token:', error);
    keycloak.login();
    return undefined;
  }

  return keycloak.token;
}

export function getUserInfo() {
  if (!keycloak.authenticated || !keycloak.tokenParsed) {
    return null;
  }

  return {
    username: keycloak.tokenParsed.preferred_username as string,
    email: keycloak.tokenParsed.email as string,
    name: keycloak.tokenParsed.name as string,
    roles: (keycloak.tokenParsed.realm_access?.roles || []) as string[],
  };
}

export function hasRole(role: string): boolean {
  return keycloak.hasRealmRole(role);
}

export function isAdmin(): boolean {
  return hasRole('OIL Admin') || hasRole('admin');
}
