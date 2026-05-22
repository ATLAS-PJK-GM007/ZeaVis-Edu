import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({ name, email, password });
  }

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
            <Input id="password" type="password" minLength={8} value={password} onChange={(event) => {
              setPassword(event.target.value);
              onFieldChange?.();
            }} required />
          </div>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
          </Button>
        </form>
        {googleOAuthEnabled && (
          <Button className="mt-3 w-full" variant="outline" asChild>
            <a href="/api/v1/auth/google">Masuk dengan Google</a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
