import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens, LoginCredentials, Permission } from '../types/auth.types';
import { ROLE_PERMISSIONS } from '../types/auth.types';
import api from '../lib/api';

// ─── Remember Me helpers ──────────────────────────────────────────────────────
const REMEMBERED_EMAIL_KEY = 'salesapp-remembered-email';
const SESSION_ONLY_KEY = 'salesapp-session-only'; // sessionStorage flag

export function getSavedEmail(): string {
  return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? '';
}

function saveRememberMe(email: string, remember: boolean) {
  if (remember) {
    localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    sessionStorage.removeItem(SESSION_ONLY_KEY); // persistent session
  } else {
    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    sessionStorage.setItem(SESSION_ONLY_KEY, '1'); // session-only marker
  }
}

function clearRememberMe() {
  localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  sessionStorage.removeItem(SESSION_ONLY_KEY);
}

/**
 * Called once on app boot (main.tsx).
 * If the user did NOT check Remember Me, their auth is session-only.
 * When the browser tab is closed, sessionStorage is wiped — on the next
 * fresh load we detect the missing SESSION_ONLY_KEY and clear localStorage.
 */
export function enforceSessionPolicy() {
  const sessionOnly = sessionStorage.getItem(SESSION_ONLY_KEY);
  const hasPersistedAuth = localStorage.getItem('salesapp-auth');
  // If auth was saved as session-only but the session marker is gone
  // (i.e., a fresh browser session), wipe the persisted auth.
  if (!sessionOnly && hasPersistedAuth) {
    try {
      const parsed = JSON.parse(hasPersistedAuth);
      // Only wipe if the stored state was marked session-only
      if (parsed?.state?.sessionOnly === true) {
        localStorage.removeItem('salesapp-auth');
      }
    } catch {
      // ignore
    }
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface BackendUser {
  id: number;
  email: string | null;
  firstName: string;
  lastName: string;
  role: string;
  code?: string | null;
  mobileNo?: string | null;
  branchId?: number | null;
  profileImg?: string | null;
  isAdmin: boolean;
}

interface AuthStore {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionTimeout: number; // minutes
  isLogoutModalOpen: boolean;
  rolePermissions: Record<string, Permission[]>;
  /** True when the user did NOT check Remember Me — session is cleared on browser close */
  sessionOnly: boolean;

  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setSessionTimeout: (minutes: number) => void;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: string) => boolean;
  clearError: () => void;
  updateProfile: (data: Partial<User>) => void;
  openLogoutModal: () => void;
  closeLogoutModal: () => void;
  toggleRolePermission: (role: string, permission: Permission, allowed: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map the backend user shape → frontend User type */
function mapBackendUser(
  backend: BackendUser,
  rolePermissions: Record<string, Permission[]>
): User {
  const role = (backend.isAdmin ? 'admin' : backend.role ?? 'user') as User['role'];
  return {
    id: String(backend.id),
    email: backend.email ?? '',
    firstName: backend.firstName,
    lastName: backend.lastName ?? '',
    role,
    permissions: (rolePermissions[role] ?? []) as Permission[],
    phone: backend.mobileNo ?? undefined,
    avatar: backend.profileImg
      ? (backend.profileImg.startsWith('http') ? backend.profileImg : `https://imperial_api.dccsalesapp.com/sales_app_api_ipl/public//images/users/${backend.profileImg.replace(/^\/+/, '')}`)
      : '',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };
}

/** Extract a human-readable message from an API error */
function extractError(err: unknown): string {
  const e = err as any;
  return (
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.message ||
    'Something went wrong. Please try again.'
  );
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      sessionTimeout: 30,
      isLogoutModalOpen: false,
      rolePermissions: ROLE_PERMISSIONS,
      sessionOnly: false,

      openLogoutModal: () => set({ isLogoutModalOpen: true }),
      closeLogoutModal: () => set({ isLogoutModalOpen: false }),

      toggleRolePermission: (role, permission, allowed) =>
        set((state) => {
          const current = state.rolePermissions[role] ?? [];
          const next = allowed
            ? Array.from(new Set([...current, permission]))
            : current.filter((p) => p !== permission);
          return {
            rolePermissions: { ...state.rolePermissions, [role]: next },
          };
        }),

      // ── Login ──────────────────────────────────────────────────────────────
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post<{
            status: string;
            data: { user: BackendUser; accessToken: string };
          }>('/auth/login', {
            email: credentials.email,
            password: credentials.password,
          });

          const { user: backendUser, accessToken } = data.data;
          const { rolePermissions } = get();
          const user = mapBackendUser(backendUser, rolePermissions);

          // Store access token so the request interceptor can attach it.
          // The refresh token lives in an httpOnly cookie — never in JS.
          const tokens: AuthTokens = {
            accessToken,
            refreshToken: '', // managed via httpOnly cookie, not JS-accessible
            expiresIn: 15 * 60,
          };

          // ── Remember Me ───────────────────────────────────────────────────
          const remember = credentials.rememberMe ?? false;
          saveRememberMe(credentials.email, remember);

          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            sessionOnly: !remember,
          });
        } catch (err) {
          set({ isLoading: false, error: extractError(err) });
          throw err;
        }
      },

      // ── Logout ─────────────────────────────────────────────────────────────
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // ignore — clear state regardless
        }
        clearRememberMe();
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          error: null,
          isLogoutModalOpen: false,
          sessionOnly: false,
        });
      },

      // ── Refresh ────────────────────────────────────────────────────────────
      // Called automatically by the axios interceptor on 401.
      // Can also be called manually to proactively refresh before expiry.
      refreshToken: async () => {
        try {
          const { data } = await api.post<{
            status: string;
            data: { accessToken: string };
          }>('/auth/refresh');

          const newAccessToken = data.data.accessToken;
          set((state) => ({
            tokens: state.tokens
              ? { ...state.tokens, accessToken: newAccessToken }
              : null,
          }));
        } catch {
          // Refresh failed — force logout
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      // ── Fetch Me ───────────────────────────────────────────────────────────
      // Re-fetches fresh user data from the backend (e.g. after profile update)
      fetchMe: async () => {
        try {
          const { data } = await api.get<{
            status: string;
            data: { user: BackendUser };
          }>('/auth/me');
          const { rolePermissions } = get();
          const user = mapBackendUser(data.data.user, rolePermissions);
          set({ user });
        } catch {
          // ignore
        }
      },

      // ── Helpers ────────────────────────────────────────────────────────────
      setSessionTimeout: (minutes) => set({ sessionTimeout: minutes }),

      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;
        return user.permissions.includes(permission);
      },

      hasRole: (role) => {
        const user = get().user;
        if (!user) return false;
        return user.role === role;
      },

      clearError: () => set({ error: null }),

      updateProfile: (data) => {
        const user = get().user;
        if (user) set({ user: { ...user, ...data } });
      },
    }),
    {
      name: 'salesapp-auth',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        sessionTimeout: state.sessionTimeout,
        rolePermissions: state.rolePermissions,
        sessionOnly: state.sessionOnly,
      }),
    }
  )
);
