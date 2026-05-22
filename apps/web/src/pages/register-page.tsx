import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthForm } from '@/components/auth-form';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

export function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const meQuery = useQuery({ queryKey: ['auth', 'me'], queryFn: () => apiClient.getMe() });

  const mutation = useMutation({
    mutationFn: apiClient.register,
    onSuccess: (response) => {
      setUser(response.user);
      queryClient.setQueryData(['auth', 'me'], response);
      navigate('/dashboard');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Registrasi gagal'),
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full space-y-4">
        <AuthForm
          mode="register"
          isSubmitting={mutation.isPending}
          error={error}
          googleOAuthEnabled={Boolean(meQuery.data?.features.googleOAuthEnabled)}
          onSubmit={async ({ name, email, password }) => mutation.mutateAsync({ name: name ?? '', email, password })}
        />
        <p className="text-center text-sm text-muted-foreground">
          Sudah punya akun? <Link className="text-primary" to="/login">Masuk</Link>
        </p>
      </div>
    </main>
  );
}
