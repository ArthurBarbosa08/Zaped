import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, MapPin, Store, ArrowRight } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/selecionar-filial")({
  component: SelecionarFilialPage,
  head: () => ({
    meta: [
      { title: "Selecione sua Filial — Zaped" },
      { name: "description", content: "Selecione a filial da sua empresa para continuar" },
    ],
  }),
});

type Branch = {
  id: string;
  name: string;
  address: string;
  status: "active" | "inactive";
};

const mockBranches: Branch[] = [
  { id: "1", name: "Matriz", address: "Av. Paulista, 1000 — São Paulo, SP", status: "active" },
  { id: "2", name: "Filial Rio", address: "Rua da Assembleia, 50 — Rio de Janeiro, RJ", status: "active" },
  { id: "3", name: "Filial Minas", address: "Av. Afonso Pena, 300 — Belo Horizonte, MG", status: "active" },
  { id: "4", name: "Filial Curitiba", address: "Rua XV de Novembro, 120 — Curitiba, PR", status: "inactive" },
  { id: "5", name: "Filial Recife", address: "Av. Boa Viagem, 800 — Recife, PE", status: "active" },
];

function SelecionarFilialPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = mockBranches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (branch: Branch) => {
    localStorage.setItem("zaped_selected_branch_id", branch.id);
    localStorage.setItem("zaped_selected_branch_name", branch.name);
    navigate({ to: "/login" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Decorative orange glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-accent/15 blur-[120px]" />
        <div className="absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/10 blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo separated on top */}
        <div className="mb-8 flex flex-col items-center">
          <Logo size="lg" />
        </div>

        {/* Branch selection card */}
        <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-2xl shadow-primary/5 backdrop-blur-sm sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
              Selecione sua filial
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Escolha a unidade que deseja acessar para continuar
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Digite o nome da filial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Branch list */}
          <div className="space-y-3">
            {filtered.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleSelect(branch)}
                className="group flex w-full items-center gap-4 rounded-xl border border-border bg-secondary/40 p-4 text-left transition-colors hover:border-primary/30 hover:bg-secondary/60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Store className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-card-foreground">
                      {branch.name}
                    </span>
                    {branch.status === "active" ? (
                      <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        Ativa
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Inativa
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {branch.address}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma filial encontrada. Verifique o nome digitado.
              </div>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Zaped. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
