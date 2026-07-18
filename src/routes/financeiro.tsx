
import { useState, useCallback, useMemo, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, AlertCircle, FileUp, Wallet, Search, FileCheck, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const proximosBoletosMock = [
  { id: 1, descricao: "Fornecedor A", vencimento: "15/07/2026", valor: 2500.0 },
  { id: 2, descricao: "Fornecedor B", vencimento: "18/07/2026", valor: 1890.0 },
  { id: 3, descricao: "Fornecedor C", vencimento: "20/07/2026", valor: 4120.0 },
];

// Mock para boletos pagos
const pagosBoletosMock = [
  {
    id: 201,
    descricao: "Fornecedor X",
    vencimento: "10/07/2026",
    pagamento: "12/07/2026",
    valor: 1500.0,
    valorPago: 1500.0,
    beneficio: "Fornecedor X Ltda",
    cnpj: "11.222.333/0001-44",
    banco: "001 - BANCO DO BRASIL S.A.",
    numeroDocumento: "PAG001234",
    nossoNumero: "12345678901"
  },
  {
    id: 202,
    descricao: "Fornecedor Y",
    vencimento: "05/07/2026",
    pagamento: "07/07/2026",
    valor: 3200.50,
    valorPago: 3250.50, // Com juros
    beneficio: "Fornecedor Y Corporation",
    cnpj: "99.888.777/0001-22",
    banco: "237 - BANCO BRADESCO S.A.",
    numeroDocumento: "PAG001235",
    nossoNumero: "98765432109"
  },
  {
    id: 203,
    descricao: "Fornecedor Z",
    vencimento: "01/07/2026",
    pagamento: "03/07/2026",
    valor: 850.75,
    valorPago: 850.75,
    beneficio: "Fornecedor Z ME",
    cnpj: "55.444.333/0001-11",
    banco: "341 - BANCO ITAU S.A.",
    numeroDocumento: "PAG001236",
    nossoNumero: "55566677788"
  }
];

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function FinanceiroPage() {
  const [dataVencimento, setDataVencimento] = useState<Date>();

  // Estado para próximos boletos a vencer
  const [proximosBoletos, setProximosBoletos] = useState<Array<{
    id: number;
    descricao: string;
    vencimento: string;
    valor: number;
    emissao?: string;
    pago?: boolean;
  }>>(proximosBoletosMock);

  // Estados para boletos pagos
  const [pagosBoletos, setPagosBoletos] = useState<Array<{
    id: number;
    descricao: string;
    vencimento: string; // DD/MM/YYYY
    pagamento: string; // DD/MM/YYYY
    valor: number;
    valorPago: number;
    beneficio: string;
    cnpj: string;
    banco: string;
    numeroDocumento: string;
    nossoNumero: string;
  }>>([]);

  // Estado para filtros da aba de pagos
  const [pagosFiltros, setPagosFiltros] = useState({
    dataPagamentoInicial: '',
    dataPagamentoFinal: '',
    dataVencimentoInicial: '',
    dataVencimentoFinal: '',
    beneficio: '',
    cnpj: '',
    valorMin: '',
    valorMax: '',
    banco: ''
  });

  // Estado para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Estado para controle do modal de boletos pagos
  const [isPaidBoletosOpen, setIsPaidBoletosOpen] = useState(false);

  // Estados para controle dos novos modais
  const [isLancarOpen, setIsLancarOpen] = useState(false);
  const [isPagarOpen, setIsPagarOpen] = useState(false);
  const [isChecarOpen, setIsChecarOpen] = useState(false);

  // Estados adicionais dos formulários
  const [lancarLinhaDigitavel, setLancarLinhaDigitavel] = useState('');
  const [checarLinhaDigitavel, setChecarLinhaDigitavel] = useState('');
  const [resultadoChecagem, setResultadoChecagem] = useState<{
    valido: boolean;
    tipo?: string;
    mensagem: string;
  } | null>(null);

  // Estados para filtros e seleção no modal Pagar Boletos
  const [filtroPagarFornecedor, setFiltroPagarFornecedor] = useState('');
  const [filtroPagarEmissao, setFiltroPagarEmissao] = useState('');
  const [filtroPagarValor, setFiltroPagarValor] = useState('');
  const [selectedBoletoId, setSelectedBoletoId] = useState<number | null>(null);

  // Estados para filtros no modal Checar Boletos
  const [filtroChecarFornecedor, setFiltroChecarFornecedor] = useState('');
  const [filtroChecarEmissao, setFiltroChecarEmissao] = useState('');
  const [filtroChecarValor, setFiltroChecarValor] = useState('');

  // Estado para formulário de pagamento manual
  const [fornecedorMP, setFornecedorMP] = useState('');
  const [cnpjMP, setCnpjMP] = useState('');
  const [dataVencimentoMP, setDataVencimentoMP] = useState('');
  const [dataEmissaoMP, setDataEmissaoMP] = useState('');
  const [valorMP, setValorMP] = useState('');

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

  // Converter string de data YYYY-MM-DD para DD/MM/YYYY (formato BR)
  const convertToBRDate = (dateString: string): string => {
    if (!dateString) return '';
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-');
      return `${(day || '').padStart(2, '0')}/${(month || '').padStart(2, '0')}/${year}`;
    }
    return dateString;
  };

  // Converter objeto Date para string YYYY-MM-DD (formato para input type="date")
  const formatDateForInput = (date: Date | string): string => {
    if (typeof date === 'string') {
      // Assume format DD/MM/YYYY
      const [day, month, year] = date.split('/');
      return `${year}-${(month || '').padStart(2, '0')}-${(day || '').padStart(2, '0')}`;
    }
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  // Calculate days between two dates
  const daysBetween = (date1: Date, date2: Date): number => {
    const timeDiff = date2.getTime() - date1.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  // Converter string de data (DD/MM/YYYY ou YYYY-MM-DD) para objeto Date para comparação
  const parseBRDateForComparison = (dateString: string): Date => {
    if (!dateString) return new Date(0); // Data inválida para comparação
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  // Filtrar boletos pagos baseado nos filtros
  const filteredPagosBoletos = useMemo(() => {
    return pagosBoletos.filter(boleto => {
      // Filtro por data de pagamento inicial
      if (pagosFiltros.dataPagamentoInicial) {
        const pagamentoDate = parseBRDateForComparison(boleto.pagamento);
        const filtroInicial = parseBRDateForComparison(pagosFiltros.dataPagamentoInicial);
        if (pagamentoDate < filtroInicial) return false;
      }

      // Filtro por data de pagamento final
      if (pagosFiltros.dataPagamentoFinal) {
        const pagamentoDate = parseBRDateForComparison(boleto.pagamento);
        const filtroFinal = parseBRDateForComparison(pagosFiltros.dataPagamentoFinal);
        if (pagamentoDate > filtroFinal) return false;
      }

      // Filtro por data de vencimento inicial
      if (pagosFiltros.dataVencimentoInicial) {
        const vencimentoDate = parseBRDateForComparison(boleto.vencimento);
        const filtroInicial = parseBRDateForComparison(pagosFiltros.dataVencimentoInicial);
        if (vencimentoDate < filtroInicial) return false;
      }

      // Filtro por data de vencimento final
      if (pagosFiltros.dataVencimentoFinal) {
        const vencimentoDate = parseBRDateForComparison(boleto.vencimento);
        const filtroFinal = parseBRDateForComparison(pagosFiltros.dataVencimentoFinal);
        if (vencimentoDate > filtroFinal) return false;
      }

      // Filtro por nome do beneficário
      if (pagosFiltros.beneficio.trim()) {
        const beneficioMatch = boleto.beneficio.toLowerCase().includes(pagosFiltros.beneficio.toLowerCase());
        if (!beneficioMatch) return false;
      }

      // Filtro por CNPJ
      if (pagosFiltros.cnpj.trim()) {
        const cnpjMatch = boleto.cnpj.includes(pagosFiltros.cnpj.replace(/\D/g, ''));
        if (!cnpjMatch) return false;
      }

      // Filtro por valor mínimo
      if (pagosFiltros.valorMin.trim()) {
        const valorMin = parseFloat(pagosFiltros.valorMin);
        if (!isNaN(valorMin) && boleto.valorPago < valorMin) return false;
      }

      // Filtro por valor máximo
      if (pagosFiltros.valorMax.trim()) {
        const valorMax = parseFloat(pagosFiltros.valorMax);
        if (!isNaN(valorMax) && boleto.valorPago > valorMax) return false;
      }

      // Filtro por banco
      if (pagosFiltros.banco.trim()) {
        const bancoMatch = boleto.banco.toLowerCase().includes(pagosFiltros.banco.toLowerCase());
        if (!bancoMatch) return false;
      }

      return true;
    });
  }, [pagosBoletos, pagosFiltros]);

  // Filter boletos based on selected date - wrapped in useMemo for stability
  const filteredBoletos = useMemo(() => {
    if (!dataVencimento) return proximosBoletos;

    return proximosBoletos.filter(boleto => {
      const vencimento = parseBRDate(boleto.vencimento);
      return vencimento <= dataVencimento; // Boletos vencidos até a data selecionada
    });
  }, [dataVencimento, proximosBoletos]);

  // Boletos em aberto filtrados para o modal de Pagar Boletos
  const filteredOpenBoletos = useMemo(() => {
    return proximosBoletos.filter(b => {
      // Somente boletos não pagos
      if (b.pago) return false;

      // Filtro por fornecedor
      if (filtroPagarFornecedor.trim()) {
        const matchesSupplier = b.descricao.toLowerCase().includes(filtroPagarFornecedor.toLowerCase());
        if (!matchesSupplier) return false;
      }

      // Filtro por data de emissão
      if (filtroPagarEmissao) {
        const queryEmissao = convertToBRDate(filtroPagarEmissao);
        // Procurar no campo emissão ou vencimento se emissão não estiver definida
        const dateToCompare = b.emissao ? convertToBRDate(b.emissao) : b.vencimento;
        if (dateToCompare && !dateToCompare.includes(queryEmissao)) return false;
      }

      // Filtro por valor
      if (filtroPagarValor.trim()) {
        const queryVal = parseFloat(filtroPagarValor);
        if (!isNaN(queryVal) && b.valor !== queryVal) return false;
      }

      return true;
    });
  }, [proximosBoletos, filtroPagarFornecedor, filtroPagarEmissao, filtroPagarValor]);

  // Boletos em aberto filtrados para o modal de Checar Boletos
  const filteredCheckBoletos = useMemo(() => {
    return proximosBoletos.filter(b => {
      // Somente boletos não pagos
      if (b.pago) return false;

      // Filtro por fornecedor
      if (filtroChecarFornecedor.trim()) {
        const matchesSupplier = b.descricao.toLowerCase().includes(filtroChecarFornecedor.toLowerCase());
        if (!matchesSupplier) return false;
      }

      // Filtro por data de emissão
      if (filtroChecarEmissao) {
        const queryEmissao = convertToBRDate(filtroChecarEmissao);
        const dateToCompare = b.emissao ? convertToBRDate(b.emissao) : b.vencimento;
        if (dateToCompare && !dateToCompare.includes(queryEmissao)) return false;
      }

      // Filtro por valor
      if (filtroChecarValor.trim()) {
        const queryVal = parseFloat(filtroChecarValor);
        if (!isNaN(queryVal) && b.valor !== queryVal) return false;
      }

      return true;
    });
  }, [proximosBoletos, filtroChecarFornecedor, filtroChecarEmissao, filtroChecarValor]);

  // Calculate filtered stats
  const filteredStats = {
    count: filteredBoletos.length,
    total: filteredBoletos.reduce((sum, boleto) => sum + boleto.valor, 0)
  };

  // Carregar dados iniciais para boletos pagos
  useEffect(() => {
    // Carregar boletos pagos mock (em produção, isso viria de uma API)
    setPagosBoletos(pagosBoletosMock);

    // Definir filtro padrão para último mês
    const hoje = new Date();
    const umMesAtras = new Date();
    umMesAtras.setMonth(hoje.getMonth() - 1);

    setPagosFiltros(prev => ({
      ...prev,
      dataPagamentoInicial: `${String(umMesAtras.getDate()).padStart(2, '0')}/${String(umMesAtras.getMonth() + 1).padStart(2, '0')}/${umMesAtras.getFullYear()}`,
      dataPagamentoFinal: `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`
    }));
  }, []); // Executar apenas uma vez no montagem

  // Função para lidar com o pagamento manual de boletos
  const handleSubmitManualPayment = useCallback((e: React.FormEvent | null = null) => {
    if (e) {
      e.preventDefault();
    }

    // Validação básica
    if (!fornecedorMP.trim()) {
      toast.error('Por favor, informe o fornecedor');
      return;
    }

    if (!cnpjMP.trim()) {
      toast.error('Por favor, informe o CNPJ');
      return;
    }

    if (!dataVencimentoMP) {
      toast.error('Por favor, informe a data de vencimento');
      return;
    }

    if (!dataEmissaoMP) {
      toast.error('Por favor, informe a data de emissão');
      return;
    }

    if (!valorMP || parseFloat(valorMP) <= 0) {
      toast.error('Por favor, informe um valor válido');
      return;
    }

    const valorNum = parseFloat(valorMP);

    // Criar novo boleto
    const newBoleto = {
      id: proximosBoletos.length + 1,
      descricao: fornecedorMP.trim(),
      vencimento: convertToBRDate(dataVencimentoMP),
      emissao: convertToBRDate(dataEmissaoMP),
      valor: valorNum,
      pago: true
    };

    // Adicionar à lista de boletos a pagar
    setProximosBoletos(prev => [...prev, newBoleto]);

    // NOVO: Também adicionar à lista de boletos pagos com informações de pagamento
    setPagosBoletos(prev => [...prev, {
      id: pagosBoletos.length + 200, // ID separado para evitar conflitos
      descricao: fornecedorMP.trim(),
      vencimento: convertToBRDate(dataVencimentoMP),
      pagamento: convertToBRDate(dataEmissaoMP), // Usando data de emissão como data de pagamento para simplificação
      valor: valorNum,
      valorPago: valorNum,
      beneficio: fornecedorMP.trim(),
      cnpj: cnpjMP.replace(/[^\d]/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '$1.$2.$3/$4-'), // Formata CNPJ
      banco: "000 - BANCO GERAL",
      numeroDocumento: `MAN${new Date().getTime()}`,
      nossoNumero: `${Math.floor(Math.random() * 10000000000)}`.padStart(10, '0')
    }]);

    toast.success(`Boleto de ${fornecedorMP.trim()} pago com sucesso!`);

    // Reset do formulário
    setFornecedorMP('');
    setCnpjMP('');
    setDataVencimentoMP('');
    setDataEmissaoMP('');
    setValorMP('');
    setIsPagarOpen(false);
  }, [fornecedorMP, cnpjMP, dataVencimentoMP, dataEmissaoMP, valorMP, proximosBoletos, pagosBoletos, setPagosBoletos, setProximosBoletos, convertToBRDate]);

  // Função para registrar o pagamento de um boleto selecionado
  const handlePaySelectedBoleto = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoletoId) {
      toast.error('Por favor, selecione um boleto para pagar');
      return;
    }

    const boletoToPay = proximosBoletos.find(b => b.id === selectedBoletoId);
    if (!boletoToPay) {
      toast.error('Boleto não encontrado');
      return;
    }

    // 1. Marcar como pago na lista de proximosBoletos
    setProximosBoletos(prev => prev.map(b => b.id === selectedBoletoId ? { ...b, pago: true } : b));

    // 2. Adicionar à lista de boletos pagos
    setPagosBoletos(prev => [...prev, {
      id: pagosBoletos.length + 300, // ID único
      descricao: boletoToPay.descricao,
      vencimento: boletoToPay.vencimento,
      pagamento: formatBRDate(new Date()), // data de hoje formatada
      valor: boletoToPay.valor,
      valorPago: boletoToPay.valor,
      beneficio: boletoToPay.descricao,
      cnpj: "00.000.000/0001-00", // CNPJ mock ou capturado
      banco: "000 - BANCO GERAL",
      numeroDocumento: `PAG${new Date().getTime()}`,
      nossoNumero: `${Math.floor(Math.random() * 10000000000)}`.padStart(10, '0')
    }]);

    toast.success(`Pagamento do boleto ${boletoToPay.descricao} registrado com sucesso!`);

    // Reset e fechar modal
    setSelectedBoletoId(null);
    setFiltroPagarFornecedor('');
    setFiltroPagarEmissao('');
    setFiltroPagarValor('');
    setIsPagarOpen(false);
  }, [selectedBoletoId, proximosBoletos, pagosBoletos, setProximosBoletos, setPagosBoletos]);

  // Função para exportar os boletos pagos filtrados em formato Excel (CSV)
  const handleExportToExcel = useCallback(() => {
    if (filteredPagosBoletos.length === 0) {
      toast.error('Nenhum boleto pago para exportar');
      return;
    }

    // Cabeçalho da planilha
    const headers = [
      'Descrição',
      'Data de Vencimento',
      'Data de Pagamento',
      'Valor Original (R$)',
      'Valor Pago (R$)',
      'Beneficiário',
      'CNPJ',
      'Banco',
      'Número do Documento',
      'Nosso Número'
    ];

    // Mapeamento dos dados com formatação brasileira (vírgula decimal)
    const rows = filteredPagosBoletos.map(b => [
      b.descricao,
      b.vencimento,
      b.pagamento,
      b.valor.toFixed(2).replace('.', ','),
      b.valorPago.toFixed(2).replace('.', ','),
      b.beneficio,
      b.cnpj,
      b.banco,
      b.numeroDocumento,
      b.nossoNumero
    ]);

    // Monta o conteúdo CSV com BOM UTF-8 para manter acentuação no Excel
    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
    ].join('\r\n');

    // Cria o blob e dispara download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `boletos_pagos_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Planilha exportada com sucesso!');
  }, [filteredPagosBoletos]);

  // Função para lançar boleto manualmente via linha digitável
  const handleLancarBoleto = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!lancarLinhaDigitavel.trim()) {
      toast.error('Por favor, informe a linha digitável ou código de barras');
      return;
    }
    const cleaned = lancarLinhaDigitavel.replace(/\D/g, '');
    if (cleaned.length !== 47 && cleaned.length !== 48) {
      toast.error('Linha digitável ou código de barras inválido (deve conter 47 ou 48 dígitos)');
      return;
    }

    // Criar um boleto simulado a vencer baseado na entrada
    const newBoleto = {
      id: proximosBoletos.length + 1,
      descricao: `Boleto Lançado #${proximosBoletos.length + 1}`,
      vencimento: formatBRDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)), // vencendo em 10 dias
      valor: Math.floor(Math.random() * 4000) + 100, // valor simulado
      emissao: formatBRDate(new Date()),
      pago: false
    };

    setProximosBoletos(prev => [...prev, newBoleto]);
    toast.success('Boleto lançado com sucesso e adicionado aos próximos a vencer!');
    setLancarLinhaDigitavel('');
    setIsLancarOpen(false);
  }, [lancarLinhaDigitavel, proximosBoletos, setProximosBoletos]);

  // Função para checar validade de boleto
  const handleChecarBoleto = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const input = checarLinhaDigitavel.trim();
    if (!input) {
      toast.error('Por favor, informe a linha digitável ou código de barras');
      return;
    }
    const cleaned = input.replace(/\D/g, '');
    if (cleaned.length === 47) {
      setResultadoChecagem({
        valido: true,
        tipo: 'Boleto de Cobrança Registrada (Bancário)',
        mensagem: `Linha digitável válida. Banco Emissor detectado: ${cleaned.substring(0, 3)}. Pronto para agendamento.`
      });
    } else if (cleaned.length === 48) {
      setResultadoChecagem({
        valido: true,
        tipo: 'Boleto de Concessionária / Tributo (Consumo)',
        mensagem: 'Linha digitável válida. Tipo: Contas de água/luz/gás/telefone ou tributos públicos.'
      });
    } else {
      setResultadoChecagem({
        valido: false,
        mensagem: `Linha digitável inválida. Contém ${cleaned.length} dígitos numéricos. Esperado: 47 ou 48 dígitos.`
      });
    }
  }, [checarLinhaDigitavel]);

  const actions = [
    { id: "lancar", label: "Lançar boletos", icon: FileUp, onClick: () => setIsLancarOpen(true) },
    { id: "pagar", label: "Pagar boletos", icon: Wallet, onClick: () => setIsPagarOpen(true) },
    { id: "checar", label: "Checar boletos", icon: Search, onClick: () => setIsChecarOpen(true) },
    { id: "pagos", label: "Boletos pagos", icon: FileCheck, onClick: () => setIsPaidBoletosOpen(true) },
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

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-lg shadow-primary/5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Boletos pagos</p>
                <p className="text-lg font-semibold text-card-foreground">{pagosBoletos.length} boletos</p>
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold text-foreground">{formatBRL(
              pagosBoletos.reduce((sum, boleto) => sum + boleto.valorPago, 0)
            )}</p>
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
                        className="flex items-center justify-between rounded-xl border border-red-500/20 px-4 py-3 bg-red-500/5"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {boleto.descricao}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="font-mono">{formatBRDate(vencimentoDate)}</span>
                            <span className="ml-2 px-2 py-0.5 text-xs bg-red-500/10 text-red-400 rounded-full border border-red-500/20">
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

        <Dialog open={isPaidBoletosOpen} onOpenChange={setIsPaidBoletosOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border border-border rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">Boletos Pagos</DialogTitle>
            </DialogHeader>

            <div className="mt-4">
              {/* Cabeçalho com estatísticas */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Pago</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatBRL(
                        filteredPagosBoletos.reduce((sum, boleto) => sum + boleto.valorPago, 0)
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Quantidade</p>
                    <p className="text-2xl font-bold text-foreground">
                      {filteredPagosBoletos.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Painel de filtros */}
              <div className="mb-6 rounded-xl border border-border bg-card/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Filtrar Boletos Pagos
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Data Pagamento Inicial */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Data Pagamento Inicial</label>
                    <Input
                      type="date"
                      value={pagosFiltros.dataPagamentoInicial}
                      onChange={(e) => setPagosFiltros(prev => ({ ...prev, dataPagamentoInicial: e.target.value }))}
                      className="bg-background/50 w-full focus:border-orange-500 focus:ring-orange-500 border border-input rounded-md px-3 py-1 text-sm shadow-sm"
                    />
                  </div>

                  {/* Data Pagamento Final */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Data Pagamento Final</label>
                    <Input
                      type="date"
                      value={pagosFiltros.dataPagamentoFinal}
                      onChange={(e) => setPagosFiltros(prev => ({ ...prev, dataPagamentoFinal: e.target.value }))}
                      className="bg-background/50 w-full focus:border-orange-500 focus:ring-orange-500 border border-input rounded-md px-3 py-1 text-sm shadow-sm"
                    />
                  </div>

                  {/* Data Vencimento Inicial */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Data Vencimento Inicial</label>
                    <Input
                      type="date"
                      value={pagosFiltros.dataVencimentoInicial}
                      onChange={(e) => setPagosFiltros(prev => ({ ...prev, dataVencimentoInicial: e.target.value }))}
                      className="bg-background/50 w-full focus:border-orange-500 focus:ring-orange-500 border border-input rounded-md px-3 py-1 text-sm shadow-sm"
                    />
                  </div>

                  {/* Data Vencimento Final */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Data Vencimento Final</label>
                    <Input
                      type="date"
                      value={pagosFiltros.dataVencimentoFinal}
                      onChange={(e) => setPagosFiltros(prev => ({ ...prev, dataVencimentoFinal: e.target.value }))}
                      className="bg-background/50 w-full focus:border-orange-500 focus:ring-orange-500 border border-input rounded-md px-3 py-1 text-sm shadow-sm"
                    />
                  </div>

                  {/* Beneficário */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Beneficário</label>
                    <Input
                      type="text"
                      placeholder="Ex: Fornecedor X"
                      value={pagosFiltros.beneficio}
                      onChange={(e) => setPagosFiltros(prev => ({ ...prev, beneficio: e.target.value }))}
                      className="bg-background/50 w-full focus:border-orange-500 focus:ring-orange-500 border border-input rounded-md px-3 py-1 text-sm shadow-sm"
                    />
                  </div>

                  {/* CNPJ */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">CNPJ</label>
                    <Input
                      type="text"
                      placeholder="Ex: 11.222.333/0001-44"
                      value={pagosFiltros.cnpj}
                      onChange={(e) => setPagosFiltros(prev => ({ ...prev, cnpj: e.target.value }))}
                      className="bg-background/50 w-full focus:border-orange-500 focus:ring-orange-500 border border-input rounded-md px-3 py-1 text-sm shadow-sm"
                    />
                  </div>

                  {/* Valor Mínimo */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Valor Mínimo (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pagosFiltros.valorMin}
                      onChange={(e) => setPagosFiltros(prev => ({ ...prev, valorMin: e.target.value }))}
                      className="bg-background/50 w-full focus:border-orange-500 focus:ring-orange-500 border border-input rounded-md px-3 py-1 text-sm shadow-sm"
                    />
                  </div>

                  {/* Valor Máximo */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Valor Máximo (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pagosFiltros.valorMax}
                      onChange={(e) => setPagosFiltros(prev => ({ ...prev, valorMax: e.target.value }))}
                      className="bg-background/50 w-full focus:border-orange-500 focus:ring-orange-500 border border-input rounded-md px-3 py-1 text-sm shadow-sm"
                    />
                  </div>

                  {/* Banco */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Banco</label>
                    <select
                      value={pagosFiltros.banco}
                      onChange={(e) => setPagosFiltros(prev => ({ ...prev, banco: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus:border-orange-500 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                    >
                      <option value="" className="bg-background text-foreground">Selecione um banco</option>
                      <option value="001 - BANCO DO BRASIL S.A." className="bg-background text-foreground">Banco do Brasil</option>
                      <option value="237 - BANCO BRADESCO S.A." className="bg-background text-foreground">Bradesco</option>
                      <option value="341 - BANCO ITAU S.A." className="bg-background text-foreground">Itaú</option>
                      <option value="033 - BANCO SANTANDER (SP) S.A." className="bg-background text-foreground">Santander</option>
                    </select>
                  </div>
                </div>

                {/* Botões de filtro */}
                <div className="mt-4 flex justify-end gap-2 sm:justify-start">
                  <button
                    onClick={() => setPagosFiltros({
                      dataPagamentoInicial: '',
                      dataPagamentoFinal: '',
                      dataVencimentoInicial: '',
                      dataVencimentoFinal: '',
                      beneficio: '',
                      cnpj: '',
                      valorMin: '',
                      valorMax: '',
                      banco: ''
                    })}
                    className="h-8 text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-500/10 gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Limpar
                  </button>
                  <button
                    onClick={() => setPaginaAtual(1)} // Resetar para primeira página ao filtrar
                    className="h-8 text-xs bg-orange-700 hover:bg-orange-800 text-white gap-1 px-4"
                  >
                    Aplicar Filtro
                  </button>
                </div>
              </div>

              {/* Lista de boletos pagos */}
              <div className="rounded-xl border border-border bg-card/70 p-4">
                {/* Controle de paginação simplicado */}
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Mostrando {((paginaAtual - 1) * itensPorPagina) + 1}-{Math.min(paginaAtual * itensPorPagina, filteredPagosBoletos.length)}
                    de {filteredPagosBoletos.length} registros
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      disabled={paginaAtual === 1}
                      onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                      className="h-9 text-xs"
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      disabled={paginaAtual * itensPorPagina >= filteredPagosBoletos.length}
                      onClick={() => setPaginaAtual(prev => Math.min(
                        Math.ceil(filteredPagosBoletos.length / itensPorPagina),
                        prev + 1
                      ))}
                      className="h-9 text-xs"
                    >
                      Próxima
                    </Button>
                  </div>
                </div>

                {/* Lista de boletos */}
                <div className="space-y-3">
                  {filteredPagosBoletos.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina).map((boleto) => (
                    <div
                      key={boleto.id}
                      className="flex items-center justify-between rounded-xl border border-border px-4 py-3 bg-background/50"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {boleto.descricao}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="font-mono">{boleto.pagamento}</span>
                          <span className="ml-2 px-2 text-xs bg-green-100 text-green-800 rounded-full">
                            Pago
                          </span>
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-foreground block text-right space-y-1">
                        <p>{formatBRL(boleto.valorPago)}</p>
                        <p className="text-xs text-muted-foreground">
                          Valor original: {formatBRL(boleto.valor)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {filteredPagosBoletos.length === 0 && (
                    <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                      Nenhum boleto pago encontrado para o período selecionado
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de ação */}
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleExportToExcel}
                  className="h-10 text-sm gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Exportar
                </Button>

                <Button
                  onClick={() => {
                    // Implementar impressão
                    toast.success('Preparando para imprimir...');
                  }}
                  className="h-10 text-sm bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10h5a3 3 0 013 3v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a3 3 0 013-3h6V5a2 2 0 012-2zM9 17a1 1 0 100-2H7a1 1 0 100 2h2z" />
                  </svg>
                  Imprimir
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Lançar Boletos */}
        <Dialog open={isLancarOpen} onOpenChange={setIsLancarOpen}>
          <DialogContent className="max-w-md bg-background border border-border rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">Lançar Novo Boleto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleLancarBoleto} className="space-y-6 mt-4">
              <div className="rounded-xl border border-dashed border-border p-6 text-center bg-card/30 hover:bg-card/50 transition-colors cursor-pointer">
                <FileUp className="mx-auto h-8 w-8 text-orange-500 mb-2" />
                <p className="text-sm font-medium text-foreground">Arraste seu boleto PDF/XML aqui</p>
                <p className="text-xs text-muted-foreground mt-1">ou clique para selecionar o arquivo</p>
              </div>

              <div className="text-center text-xs text-muted-foreground relative my-2">
                <span className="bg-background px-2 relative z-10">OU DIGITE A LINHA DIGITÁVEL</span>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-border z-0"></div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Linha Digitável / Código de Barras</label>
                <Input
                  type="text"
                  placeholder="34191.79001 01043.513184 91020.150008 7 98200000035000"
                  value={lancarLinhaDigitavel}
                  onChange={(e) => setLancarLinhaDigitavel(e.target.value)}
                  className="bg-background/50 focus:border-orange-500 focus:ring-orange-500 border border-input rounded-md px-3 py-2 text-sm w-full shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLancarOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-orange-700 hover:bg-orange-800 text-white"
                >
                  Lançar Boleto
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Registrar Pagamento (Selecionar Boleto em Aberto) */}
        <Dialog open={isPagarOpen} onOpenChange={(open) => {
          setIsPagarOpen(open);
          if (!open) {
            setSelectedBoletoId(null);
            setFiltroPagarFornecedor('');
            setFiltroPagarEmissao('');
            setFiltroPagarValor('');
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background border border-border rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">Selecionar Boleto para Pagamento</DialogTitle>
            </DialogHeader>

            {/* Painel de Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 mb-4 p-3 bg-card/40 rounded-xl border border-border">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Fornecedor</label>
                <Input
                  type="text"
                  placeholder="Filtrar por nome"
                  value={filtroPagarFornecedor}
                  onChange={(e) => setFiltroPagarFornecedor(e.target.value)}
                  className="h-8 bg-background/50 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Data de Emissão</label>
                <Input
                  type="date"
                  value={filtroPagarEmissao}
                  onChange={(e) => setFiltroPagarEmissao(e.target.value)}
                  className="h-8 bg-background/50 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Valor (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Valor exato"
                  value={filtroPagarValor}
                  onChange={(e) => setFiltroPagarValor(e.target.value)}
                  className="h-8 bg-background/50 text-xs"
                />
              </div>
            </div>

            {/* Lista de Boletos em Aberto */}
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Boletos em Aberto Encontrados ({filteredOpenBoletos.length})
              </p>
              {filteredOpenBoletos.map((boleto) => {
                const isSelected = selectedBoletoId === boleto.id;
                return (
                  <div
                    key={boleto.id}
                    onClick={() => setSelectedBoletoId(boleto.id)}
                    className={`flex items-center justify-between rounded-xl border p-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/10 shadow-sm shadow-orange-500/5'
                        : 'border-border bg-background/50 hover:bg-card/30'
                    }`}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {boleto.descricao}
                      </p>
                      <p className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                        {boleto.emissao && (
                          <span>Emissão: <span className="font-mono">{boleto.emissao}</span></span>
                        )}
                        <span>Vencimento: <span className="font-mono">{boleto.vencimento}</span></span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-foreground">
                        {formatBRL(boleto.valor)}
                      </span>
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : 'border-border'
                      }`}>
                        {isSelected && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredOpenBoletos.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  Nenhum boleto em aberto atende aos filtros informados.
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/50 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPagarOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!selectedBoletoId}
                onClick={handlePaySelectedBoleto}
                className="bg-orange-700 hover:bg-orange-800 text-white disabled:opacity-50"
              >
                Confirmar Pagamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Checar Boletos */}
        <Dialog open={isChecarOpen} onOpenChange={(open) => {
          setIsChecarOpen(open);
          if (!open) {
            setChecarLinhaDigitavel('');
            setResultadoChecagem(null);
            setFiltroChecarFornecedor('');
            setFiltroChecarEmissao('');
            setFiltroChecarValor('');
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background border border-border rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">Checagem e Validação de Boleto</DialogTitle>
            </DialogHeader>

            {/* Painel de Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 mb-4 p-3 bg-card/40 rounded-xl border border-border">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Fornecedor</label>
                <Input
                  type="text"
                  placeholder="Filtrar por nome"
                  value={filtroChecarFornecedor}
                  onChange={(e) => setFiltroChecarFornecedor(e.target.value)}
                  className="h-8 bg-background/50 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Data de Emissão</label>
                <Input
                  type="date"
                  value={filtroChecarEmissao}
                  onChange={(e) => setFiltroChecarEmissao(e.target.value)}
                  className="h-8 bg-background/50 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Valor (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Valor exato"
                  value={filtroChecarValor}
                  onChange={(e) => setFiltroChecarValor(e.target.value)}
                  className="h-8 bg-background/50 text-xs"
                />
              </div>
            </div>

            {/* Lista de Boletos em Aberto para Checagem */}
            <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1 mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Selecione um Boleto em Aberto para Autopreencher ({filteredCheckBoletos.length})
              </p>
              {filteredCheckBoletos.map((boleto) => (
                <div
                  key={boleto.id}
                  onClick={() => {
                    const baseValue = String(Math.round(boleto.valor)).padStart(10, '0');
                    const mockCode = `34191.79001 01043.513184 91020.150008 7 ${baseValue}`;
                    setChecarLinhaDigitavel(mockCode);
                    setResultadoChecagem({
                      valido: true,
                      tipo: 'Boleto de Cobrança Registrada (Bancário)',
                      mensagem: `Linha digitável gerada para o boleto de ${boleto.descricao}. Banco emissor simulado: Itaú. Pronto para pagamento.`
                    });
                  }}
                  className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-3 hover:bg-card/30 transition-all cursor-pointer"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {boleto.descricao}
                    </p>
                    <p className="text-xs text-muted-foreground flex gap-3">
                      {boleto.emissao && <span>Emissão: {boleto.emissao}</span>}
                      <span>Vencimento: {boleto.vencimento}</span>
                    </p>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {formatBRL(boleto.valor)}
                  </span>
                </div>
              ))}

              {filteredCheckBoletos.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  Nenhum boleto em aberto atende aos filtros informados.
                </div>
              )}
            </div>

            {/* Input Manual / Digitação */}
            <form onSubmit={handleChecarBoleto} className="space-y-4 pt-4 border-t border-border/50">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Linha Digitável ou Código de Barras</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Cole a linha digitável ou código de barras aqui"
                    value={checarLinhaDigitavel}
                    onChange={(e) => setChecarLinhaDigitavel(e.target.value)}
                    className="bg-background/50 focus:border-orange-500 focus:ring-orange-500 border border-input rounded-md px-3 py-2 text-sm flex-1 shadow-sm"
                  />
                  <Button
                    type="submit"
                    className="bg-orange-700 hover:bg-orange-800 text-white"
                  >
                    Validar
                  </Button>
                </div>
              </div>

              {resultadoChecagem && (
                <div className={`mt-4 rounded-xl border p-4 ${
                  resultadoChecagem.valido
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {resultadoChecagem.valido ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-semibold text-sm">
                      {resultadoChecagem.valido ? 'Boleto Válido' : 'Boleto Inválido'}
                    </span>
                  </div>
                  {resultadoChecagem.tipo && (
                    <p className="text-xs font-medium mb-1 text-foreground">Tipo: {resultadoChecagem.tipo}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{resultadoChecagem.mensagem}</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsChecarOpen(false)}
                >
                  Fechar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
