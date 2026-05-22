import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthForm } from '@/components/auth-form';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const meQuery = useQuery({ queryKey: ['auth', 'me'], queryFn: () => apiClient.getMe() });

  const mutation = useMutation({
    mutationFn: apiClient.login,
    onSuccess: (response) => {
      setUser(response.user);
      queryClient.setQueryData(['auth', 'me'], response);
      navigate('/dashboard');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Login gagal'),
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full space-y-4">
        <AuthForm
          mode="login"
          isSubmitting={mutation.isPending}
          error={error}
          googleOAuthEnabled={Boolean(meQuery.data?.features.googleOAuthEnabled)}
          onSubmit={async ({ email, password }) => {
            setError(null);
            return mutation.mutateAsync({ email, password });
          }}
          onFieldChange={() => setError(null)}
        />
        <p className="text-center text-sm text-muted-foreground">
          Belum punya akun? <Link className="text-primary" to="/register">Daftar</Link>
        </p>
      </div>
    </main>
  );
}
