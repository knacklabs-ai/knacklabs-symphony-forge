import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loginDemo = useAuthStore((state) => state.loginDemo);
  const logout = useAuthStore((state) => state.logout);

  return {
    user,
    isAuthenticated,
    loginDemo,
    logout,
  };
}
