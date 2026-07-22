import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ShoppingCart,
  Package,
  Truck,
  Wrench,
  Landmark,
  FileText,
  BookOpen,
  Users,
  Contact2,
  BarChart3,
  Search,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/selecao-servicos")({
  component: SelecaoServicosPage,
  head: () => ({
    meta: [
      { title: "Central de Módulos — Zaped" },
      {
        name: "description",
        content: "Escolha o módulo do sistema que deseja acessar",
      },
    ],
  }),
});

type Module = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
};

type ModuleGroup = {
  id: string;
  title: string;
  modules: Module[];
};

const groups: ModuleGroup[] = [
  {
    id: "operacoes",
    title: "Operações",
    modules: [
      { id: "vendas", name: "Vendas & PDV", description: "Pedidos, orçamentos e frente de caixa", icon: ShoppingCart },
      { id: "estoque", name: "Estoque & Produtos", description: "Inventário, entradas e saídas", icon: Package },
      { id: "compras", name: "Compras", description: "Fornecedores e ordens de compra", icon: Truck },
      { id: "servicos", name: "Serviços", description: "Ordens de serviço e contratos", icon: Wrench },
      { id: "crm", name: "CRM / Clientes", description: "Funil de vendas e relacionamento", icon: Users },
    ],
  },
  {
    id: "financeiro",
    title: "Finanças & Fiscal",
    modules: [
      { id: "financeiro", name: "Financeiro", description: "Contas a pagar, receber e fluxo de caixa", icon: Landmark },
      { id: "faturamento", name: "Faturamento & NF-e", description: "Emissão de notas e faturas", icon: FileText },
      { id: "contabilidade", name: "Contabilidade", description: "Apuração de impostos e SPED", icon: BookOpen },
    ],
  },
  {
    id: "gestao",
    title: "Gestão & Pessoas",
    modules: [
      { id: "rh", name: "Recursos Humanos", description: "Folha, benefícios e ponto", icon: Contact2 },
      { id: "bi", name: "Business Intelligence", description: "Relatórios e indicadores", icon: BarChart3 },
    ],
  },
];

function SelecaoServicosPage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        modules: g.modules.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.modules.length > 0);
  }, [query]);

  const handleSelect = (module: Module) => {
    if (module.id === "financeiro") {
      navigate({ to: "/financeiro" });
      return;
    }
    console.log("Módulo selecionado:", module.id);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-accent/15 blur-[120px]" />
        <div className="absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/10 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <header className="mb-8 flex flex-col items-center text-center">
          <Logo size="md" className="mb-5" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Central de Módulos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha o módulo que deseja acessar
          </p>
        </header>

        <div className="mx-auto mb-8 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar módulo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-8">
          {filteredGroups.map((group) => (
            <section key={group.id}>
              <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {group.title}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.modules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <button
                      key={module.id}
                      onClick={() => handleSelect(module)}
                      className="group flex items-start gap-4 rounded-2xl border border-border bg-card/70 p-4 text-left shadow-lg shadow-primary/5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/90"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-card-foreground">
                            {module.name}
                          </span>
                          <ArrowRight className="h-4 w-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {module.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          {filteredGroups.length === 0 && (
            <div className="rounded-2xl border border-border bg-card/60 py-12 text-center text-sm text-muted-foreground backdrop-blur-sm">
              Nenhum módulo encontrado para "{query}".
            </div>
          )}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Zaped. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
