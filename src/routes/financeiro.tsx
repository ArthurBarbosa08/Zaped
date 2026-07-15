
import { useState, useCallback, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, AlertCircle, FileUp, Wallet, Search, FileCheck, Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import logoAsset from "@/assets/zaped-logo.png.asset.json";

export const Route = createFileRoute("/financeiro")({
  component: FinanceiroPage,
  head: () => ({
    meta: [
      { title: "Financeiro — Zaped" },
      { name: "description", content: "Dashboard financeiro: contas pagas e não pagas" },
    ],
  }),
});

// Mock inicial — substituir por dados reais quando o backend existir
const stats = {
  pagas: { count: 42, total: 128_450.75 },
  naoPagas: { count: 11, total: 34_210.9 },
  aVencer: { count: 8, total: 67_890.5 },
};

const proximosBoletos = [
  { id: 1, descricao: "Fornecedor A", vencimento: "15/07/2026", valor: 2500.0 },
  { id: 2, descricao: "Fornecedor B", vencimento: "18/07/2026", valor: 1890.0 },
  { id: 3, descricao: "Fornecedor C", vencimento: "20/07/2026", valor: 4120.0 },
];

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function FinanceiroPage() {
  const [dataVencimento, setDataVencimento] = useState<Date>();

  // Handler to clear the selected date
  const clearDate = useCallback(() => {
    setDataVencimento(undefined);
  }, []);

  // Helper function to parse DD/MM/YYYY string to Date object
  const parseBRDate = (dateString: string): Date => {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  // Helper function to format date as DD/MM/YYYY
  const formatBRDate = (date: Date): string => {
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Calculate days between two dates
  const daysBetween = (date1: Date, date2: Date): number => {
    const timeDiff = date2.getTime() - date1.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  // Filter boletos based on selected date - wrapped in useMemo for stability
  const filteredBoletos = useMemo(() => {
    if (!dataVencimento) return proximosBoletos;

    return proximosBoletos.filter(boleto => {
      const vencimento = parseBRDate(boleto.vencimento);
      return vencimento <= dataVencimento; // Boletos vencidos até a data selecionada
    });
  }, [dataVencimento, proximosBoletos]);

  // Calculate filtered stats
  const filteredStats = {
    count: filteredBoletos.length,
    total: filteredBoletos.reduce((sum, boleto) => sum + boleto.valor, 0)
  };

  const actions = [
    { id: "lancar", label: "Lançar boletos", icon: FileUp, onClick: () => console.log("lançar") },
    { id: "pagar", label: "Pagar boletos", icon: Wallet, onClick: () => console.log("pagar") },
    { id: "checar", label: "Checar boletos", icon: Search, onClick: () => console.log("checar") },
    { id: "pagos", label: "Boletos pagos", icon: FileCheck, onClick: () => console.log("pagos") },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-accent/15 blur-[120px]" />
      </div>

      <img
        src={logoAsset.url}
        alt="Zaped"
        className="absolute left-4 top-4 z-10 h-9 w-auto object-contain sm:left-6 sm:top-6 sm:h-10"
      />

      <Link
        to="/selecao-servicos"
        className="absolute left-4 top-14 z-10 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground sm:left-6 sm:top-16"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar aos módulos
      </Link>

      <div className="relative z-10 mx-auto w-full max-w-5xl pt-4">
        <header className="mb-10 flex flex-col items-center pt-8 text-center sm:mb-12 sm:pt-12">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Financeiro
          </h1>
        </header>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-lg shadow-primary/5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Contas pagas</p>
                <p className="text-lg font-semibold text-card-foreground">{stats.pagas.count} contas</p>
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold text-foreground">{formatBRL(stats.pagas.total)}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-lg shadow-primary/5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Contas não pagas</p>
                <p className="text-lg font-semibold text-card-foreground">{stats.naoPagas.count} contas</p>
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold text-foreground">{formatBRL(stats.naoPagas.total)}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-lg shadow-primary/5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500 hover:bg-orange-500/20">
                      <CalendarIcon className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-3">
                    <div className="space-y-3">
                      <div className="px-1 pb-2 border-b border-border/40">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Filtrar por vencimento
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {dataVencimento ? (
                            <span className="text-primary">{formatBRDate(dataVencimento)}</span>
                          ) : (
                            <span className="text-muted-foreground">Selecione uma data</span>
                          )}
                        </p>
                      </div>
                      <div className="flex justify-center">
                        <Calendar
                          mode="single"
                          selected={dataVencimento}
                          onSelect={setDataVencimento}
                          initialFocus
                          className="p-0 pointer-events-auto"
                        />
                      </div>
                      <div className="flex justify-end pt-2 border-t border-border/40">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearDate}
                          className="h-8 text-xs hover:bg-muted"
                        >
                          Limpar
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Boletos a vencer</p>
                <p className="text-lg font-semibold text-card-foreground">{filteredStats.count} boletos</p>
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold text-foreground">{formatBRL(filteredStats.total)}</p>
            {dataVencimento && (
              <p className="mt-1 text-xs text-muted-foreground">Vencendo até {formatBRDate(dataVencimento)}</p>
            )}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:mt-24 lg:grid-cols-4">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <Button
                key={a.id}
                onClick={a.onClick}
                className="h-auto flex-col gap-1.5 rounded-2xl bg-orange-700 py-3 text-white hover:bg-orange-800"
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-semibold">{a.label}</span>
              </Button>
            );
          })}
        </div>

        <Tabs defaultValue="proximos" className="mt-12 w-full sm:mt-16">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="proximos">Próximos a vencer</TabsTrigger>
            <TabsTrigger value="vencidos">Vencidos</TabsTrigger>
          </TabsList>
          <TabsContent value="proximos" className="mt-4">
            <div className="rounded-2xl border border-border bg-card/70 p-4 shadow-lg shadow-primary/5 backdrop-blur-sm">
              <div className="mb-4">
                {dataVencimento ? (
                  <p className="text-xs text-muted-foreground">
                    Mostrando boletos vencendo até <span className="font-medium">{formatBRDate(dataVencimento)}</span>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Mostrando todos os boletos (selecione uma data para filtrar)
                  </p>
                )}
              </div>
              <h3 className="mb-4 text-sm font-semibold text-foreground">Boletos próximos a vencer</h3>
              <ul className="space-y-2">
                {filteredBoletos.map((boleto) => {
                  const vencimentoDate = parseBRDate(boleto.vencimento);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const daysDiff = daysBetween(today, vencimentoDate);

                  // Determine status and styling based on days until vencimento
                  const getStatusInfo = (daysDiff: number) => {
                    if (daysDiff < 0) {
                      return {
                        text: "VENCIDO",
                        bgClass: "bg-red-100 text-red-800",
                        textClass: "text-muted-foreground",
                        borderClass: "border-red-200"
                      };
                    }
                    if (daysDiff === 0) {
                      return {
                        text: "Vence hoje",
                        bgClass: "bg-yellow-100 text-yellow-800",
                        textClass: "text-muted-foreground",
                        borderClass: "border-yellow-200"
                      };
                    }
                    if (daysDiff === 1) {
                      return {
                        text: "AMANHÃ",
                        bgClass: "bg-amber-50 border-amber-200",
                        textClass: "text-muted-foreground",
                        borderClass: "border-amber-200"
                      };
                    }
                    if (daysDiff > 0 && daysDiff <= 3) {
                      return {
                        text: `${daysDiff} dias`,
                        bgClass: "bg-yellow-50 border-yellow-200",
                        textClass: "text-muted-foreground",
                        borderClass: "border-yellow-200"
                      };
                    }
                    // Default case: 4+ days until vencimento
                    return {
                      text: `${daysDiff} dias`,
                      bgClass: "bg-green-100 text-green-800",
                      textClass: "text-muted-foreground",
                      borderClass: "border-green-200"
                    };
                  };

                  const statusInfo = getStatusInfo(daysDiff);

                  return (
                    <div
                      key={boleto.id}
                      className="flex items-center justify-between rounded-xl border border-border px-4 py-3 bg-background/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {boleto.descricao}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="font-mono">{formatBRDate(vencimentoDate)}</span>
                          <span className={`ml-2 px-1.5 px-2 text-xs rounded-full ${statusInfo.bgClass}`}>
                            {statusInfo.text}
                          </span>
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-foreground block text-right">
                        {formatBRL(boleto.valor)}
                      </span>
                    </div>
                  );
                })}
                {filteredBoletos.length === 0 && (
                  <li className="px-4 py-3 text-center text-xs text-muted-foreground">
                    Nenhum boletor encontrado para o período selecionado
                  </li>
                )}
              </ul>
              {filteredBoletos.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">{formatBRL(filteredStats.total)}</span>
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="todos" className="mt-4">
            <div className="rounded-2xl border border-border bg-card/70 p-4 shadow-lg shadow-primary/5 backdrop-blur-sm">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Todos os boletos</h3>
              <div className="space-y-2">
                {proximosBoletos.map((boleto) => {
                  const vencimentoDate = parseBRDate(boleto.vencimento);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isOverdue = vencimentoDate < today;
                  const daysDiff = isOverdue
                    ? -daysBetween(today, vencimentoDate)
                    : daysBetween(today, vencimentoDate);

                  return (
                    <div
                      key={boleto.id}
                      className="flex items-center justify-between rounded-xl border border-border px-4 py-3 bg-background/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {boleto.descricao}
                        </p>
                        <p className="text-xs text-foreground flex items-center gap-1">
                          <span className="font-mono">{formatBRDate(vencimentoDate)}</span>
                          {isOverdue ? (
                            <span className="ml-2 px-1.5 px-2 text-xs bg-red-100 text-red-800 rounded-full">
                              {daysDiff} dias vencido
                            </span>
                          ) : daysDiff === 0 ? (
                            <span className="ml-2 px-1.5 px-2 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                              Vence hoje
                            </span>
                          ) : (
                            <span className="ml-2 px-1.5 px-2 text-xs bg-green-100 text-green-800 rounded-full">
                              {daysDiff} dias
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-foreground block text-right">
                        {formatBRL(boleto.valor)}
                      </span>
                    </div>
                  );
                })}
                {proximosBoletos.length === 0 && (
                  <p className="px-4 py-3 text-center text-xs text-muted-foreground">
                    Nenhum boleto cadastrado
                  </p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground flex justify-between">
                  <span>Total geral:</span>
                  <span className="font-medium">{formatBRL(
                    proximosBoletos.reduce((sum, boleto) => sum + boleto.valor, 0)
                  )}</span>
                </p>
                <p className="text-xs text-muted-foreground flex justify-between mt-1">
                  <span>Vencidos:</span>
                  <span className="font-medium text-red-600">
                    {formatBRL(
                      proximosBoletos
                        .filter((boleto) => {
                          const vencimentoDate = parseBRDate(boleto.vencimento);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return vencimentoDate < today;
                        })
                        .reduce((sum, boleto) => sum + boleto.valor, 0)
                    )}</span>
                  <span className="mx-4">|</span>
                  <span>Vencendo:</span>
                  <span className="font-medium text-green-600">
                    {formatBRL(
                      proximosBoletos
                        .filter((boleto) => {
                          const vencimentoDate = parseBRDate(boleto.vencimento);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return vencimentoDate >= today;
                        })
                        .reduce((sum, boleto) => sum + boleto.valor, 0)
                    )}</span>
                </p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="vencidos" className="mt-4">
            <div className="rounded-2xl border border-border bg-card/70 p-4 shadow-lg shadow-primary/5 backdrop-blur-sm">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Boletos vencidos</h3>
              <div className="space-y-2">
                {proximosBoletos
                  .filter((boleto) => {
                    const vencimentoDate = parseBRDate(boleto.vencimento);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return vencimentoDate < today;
                  })
                  .map((boleto) => {
                    const vencimentoDate = parseBRDate(boleto.vencimento);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const daysOverdue = -daysBetween(today, vencimentoDate); // Positive number of days overdue

                    return (
                      <div
                        key={boleto.id}
                        className="flex items-center justify-between rounded-xl border border-border px-4 py-3 bg-red-50 border-red-200"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-card-foreground truncate">
                            {boleto.descricao}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="font-mono">{formatBRDate(vencimentoDate)}</span>
                            <span className="ml-2 px-1.5 px-2 text-xs bg-red-100 text-red-800 rounded-full">
                              {daysOverdue} dias vencido
                            </span>
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-foreground block text-right">
                          {formatBRL(boleto.valor)}
                        </span>
                      </div>
                    );
                  })}
                {proximosBoletos.every((boleto) => {
                  const vencimentoDate = parseBRDate(boleto.vencimento);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return vencimentoDate >= today;
                }) && (
                  <p className="px-4 py-3 text-center text-xs text-muted-foreground">
                    Nenhum boleto vencido
                  </p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground flex justify-between">
                  <span>Total vencido:</span>
                  <span className="font-medium text-red-600">
                    {formatBRL(
                      proximosBoletos
                        .filter((boleto) => {
                          const vencimentoDate = parseBRDate(boleto.vencimento);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return vencimentoDate < today;
                        })
                        .reduce((sum, boleto) => sum + boleto.valor, 0)
                    )}</span>
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
