import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthForm } from "@/components/auth-form";
import { apiClient, setAuthToken } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

function getUrlParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const oauthTokenConsumed = useRef(false);
  const [oauthProcessing, setOauthProcessing] = useState(false);

  // Handle OAuth callback: the API redirects to /login?token=<session_token>
  useEffect(() => {
    const token = getUrlParam("token");
    if (!token || oauthTokenConsumed.current) return;
    oauthTokenConsumed.current = true;
    setOauthProcessing(true);

    // Store token for future API calls and fetch user
    setAuthToken(token);

    apiClient
      .getMe()
      .then((data) => {
        setUser(data.user);
        queryClient.setQueryData(["auth", "me"], data);
        navigate("/dashboard", { replace: true });
      })
      .catch((err) => {
        setAuthToken(null);
        setOauthProcessing(false);
        setError(err instanceof Error ? err.message : "Google login gagal");
      });
  }, [setUser, queryClient, navigate]);

  // Show OAuth error from query param
  const oauthError = getUrlParam("error");
  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiClient.getMe(),
  });

  const mutation = useMutation({
    mutationFn: apiClient.login,
    onSuccess: (response) => {
      setUser(response.user);
      queryClient.setQueryData(["auth", "me"], response);
      navigate("/dashboard");
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Login gagal"),
  });

  // Show loading spinner while OAuth token is being processed
  if (oauthProcessing) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Menyelesaikan login dengan Google...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm md:max-w-md space-y-4">
        <AuthForm
          mode="login"
          isSubmitting={mutation.isPending}
          error={oauthError || error}
          googleOAuthEnabled={Boolean(
            meQuery.data?.features.googleOAuthEnabled,
          )}
          onSubmit={async ({ email, password }) => {
            setError(null);
            return mutation.mutateAsync({ email, password });
          }}
          onFieldChange={() => setError(null)}
        />
        <p className="text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link className="text-primary" to="/register">
            Daftar
          </Link>
        </p>
      </div>
    </main>
  );
}
