import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthForm } from "@/components/auth-form";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

export function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiClient.getMe(),
  });

  const mutation = useMutation({
    mutationFn: apiClient.register,
    onSuccess: (response) => {
      setUser(response.user);
      queryClient.setQueryData(["auth", "me"], response);
      navigate("/dashboard");
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Registrasi gagal"),
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(https://cdn.pixabay.com/photo/2014/09/09/19/07/corn-field-440338_1280.jpg)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Glassmorphism Container */}
      <div className="relative z-10 w-full max-w-sm md:max-w-md space-y-6 bg-white/60 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-2xl border border-white/50">
        <AuthForm
          mode="register"
          isSubmitting={mutation.isPending}
          error={error}
          googleOAuthEnabled={Boolean(
            meQuery.data?.features.googleOAuthEnabled,
          )}
          onSubmit={async ({ name, email, password }) => {
            setError(null);
            return mutation.mutateAsync({ name: name ?? "", email, password });
          }}
          onFieldChange={() => setError(null)}
        />
        <p className="text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link className="text-primary" to="/login">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
