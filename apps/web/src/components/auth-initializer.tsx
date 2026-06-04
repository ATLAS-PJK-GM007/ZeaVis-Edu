import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

export function AuthInitializer() {
  const setUser = useAuthStore((state) => state.setUser);
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiClient.getMe(),
    retry: false,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data.user);
    }
  }, [query.data, setUser]);

  return null;
}
