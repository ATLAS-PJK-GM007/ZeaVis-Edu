import { FormEvent, useState, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isTauri, openUrl } from '@/lib/tauri';

type AuthFormProps = {
  mode: 'login' | 'register';
  isSubmitting: boolean;
  error: string | null;
  googleOAuthEnabled: boolean;
  onSubmit: (payload: { name?: string; email: string; password: string }) => Promise<unknown>;
  onFieldChange?: () => void;
};

export function AuthForm({ mode, isSubmitting, error, googleOAuthEnabled, onSubmit, onFieldChange }: AuthFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({ name, email, password });
  }

  const handleGoogleLogin = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    const platform = isTauri() ? 'tauri' : 'web';
    // Use API base URL, not window.location.origin — on Tauri Android
    // the origin is http://tauri.localhost which is not the API server.
    const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    const googleUrl = `${apiBase}/api/v1/auth/google?platform=${platform}`;
    await openUrl(googleUrl);
  }, []);

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === 'login' ? 'Masuk ke ZeaVis Edu' : 'Buat akun ZeaVis Edu'}</CardTitle>
        <CardDescription>
          {mode === 'login'
            ? 'Masuk untuk melihat riwayat diagnosis daun jagung Anda.'
            : 'Daftar untuk menyimpan diagnosis dan mengikuti review pakar.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input id="name" value={name} onChange={(event) => {
                setName(event.target.value);
                onFieldChange?.();
              }} required />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(event) => {
              setEmail(event.target.value);
              onFieldChange?.();
            }} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} minLength={8} value={password} onChange={(event) => {
                setPassword(event.target.value);
                onFieldChange?.();
              }} required />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
          </Button>
        </form>
        {googleOAuthEnabled && (
          <Button className="mt-3 w-full flex items-center justify-center gap-2.5" variant="outline" onClick={handleGoogleLogin} type="button">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              <path fill="none" d="M1 1h22v22H1z" />
            </svg>
            Masuk dengan Google
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
