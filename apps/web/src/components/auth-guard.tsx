import { ReactNode, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

type AuthGuardProps = {
  children: ReactNode;
  requireExpert?: boolean;
};

export function AuthGuard({ children, requireExpert = false }: AuthGuardProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiClient.getMe(),
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data.user);
    }
  }, [query.data, setUser]);

  if (query.isLoading) {
    return <main className="min-h-screen p-8 text-center text-muted-foreground">Memeriksa sesi...</main>;
  }

  if (!query.data?.user) {
    return <Navigate to="/login" replace />;
  }

  if (requireExpert && query.data.user.role !== 'expert') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
