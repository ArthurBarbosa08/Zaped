import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoAsset from "@/assets/zaped-logo.png.asset.json";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Entrar — Zaped" },
      { name: "description", content: "Acesse sua conta Zaped" },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous error

    // Simple authentication with admin@zaped.com/admin credentials
    if (email === "admin@zaped.com" && password === "admin") {
      navigate({ to: "/selecao-servicos" });
    } else {
      setError("E-mail ou senha inválidos");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Decorative orange glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-accent/15 blur-[120px]" />
        <div className="absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/10 blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo separated on top */}
        <div className="mb-8 flex flex-col items-center">
          <img
            src={logoAsset.url}
            alt="Zaped"
            className="h-24 w-auto object-contain"
          />
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-2xl shadow-primary/5 backdrop-blur-sm sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
              Bem-vindo de volta
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Entre com sua conta para continuar
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-card-foreground">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-card-foreground">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-transparent text-primary focus:ring-primary"
                />
                Lembrar-me
              </label>
              <a
                href="#"
                className="text-sm font-medium text-primary hover:text-primary/80 hover:underline"
              >
                Esqueceu a senha?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/25"
            >
              <Zap className="h-4 w-4" />
              Entrar
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <a
              href="#"
              className="font-semibold text-primary hover:text-primary/80 hover:underline"
            >
              Criar conta
            </a>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Zaped. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
