# Implementação Sugerida: Aba de Boletos Pagos no financeiro.tsx

Este é um exemplo de como a aba "Boletos Pagos" poderia ser implementada diretamente no arquivo existente `src/routes/financeiro.tsx`, seguindo o mesmo padrão das abas existentes.

## Passo 1: Adicionar novo estado para boletos pagos

Adicione estas linhas junto com os outros estados existentes (aproximadamente na linha 91):

```typescript
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
```

## Passo 2: Dados mock para boletos pagos

Adicione estes dados mock junto com os outros dados mock (aproximadamente na linha 82):

```typescript
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
```

## Passo 3: Funções auxiliares para a aba de pagos

Adicione estas funções junto com as outras funções auxiliares (aproximadamente após a linha 170):

```typescript
// Converter string de data DD/MM/YYYY para objeto Date para comparação
const parseBRDateForComparison = (dateString: string): Date => {
  if (!dateString) return new Date(0); // Data inválida para comparação
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
```

## Passo 4: Carregar dados iniciais

Modifique o usoEffect existente ou adicione um novo para carregar os boletos pagos (aproximadamente após as definições de estado):

```typescript
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
    dataPagamentoFinal: `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}${hoje.getFullYear()}`
  }));
}, []); // Executar apenas uma vez no montagem
```

## Passo 5: Adicionar nova aba

Modifique a seção de Tabs (aproximadamente linha 643) para incluir a nova aba:

```typescript
<Tabs defaultValue="proximos" className="mt-12 w-full sm:mt-16">
  <TabsList className="grid w-full grid-cols-4"> {/* Alterado de 3 para 4 colunas */}
    <TabsTrigger value="todos">Todos</TabsTrigger>
    <TabsTrigger value="proximos">Próximos a vencer</TabsTrigger>
    <TabsTrigger value="vencidos">Vencidos</TabsTrigger>
    <TabsTrigger value="pagos">Boletos Pagos</TabsTrigger> {/* Nova aba */}
  </TabsList>
  
  {/* ... abas existentes ... */}
  
  {/* Nova aba para boletos pagos */}
  <TabsContent value="pagos" className="mt-4">
    <div className="rounded-2xl border border-border bg-card/70 p-4 shadow-lg shadow-primary/5 backdrop-blur-sm">
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
              className="bg-background/50 w-full focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
          
          {/* Data Pagamento Final */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Data Pagamento Final</label>
            <Input
              type="date"
              value={pagosFiltros.dataPagamentoFinal}
              onChange={(e) => setPagosFiltros(prev => ({ ...prev, dataPagamentoFinal: e.target.value }))}
              className="bg-background/50 w-full focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
          
          {/* Data Vencimento Inicial */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Data Vencimento Inicial</label>
            <Input
              type="date"
              value={pagosFiltros.dataVencimentoInicial}
              onChange={(e) => setPagosFiltros(prev => ({ ...prev, dataVencimentoInicial: e.target.value }))}
              className="bg-background/50 w-full focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
          
          {/* Data Vencimento Final */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Data Vencimento Final</label>
            <Input
              type="date"
              value={pagosFiltros.dataVencimentoFinal}
              onChange={(e) => setPagosFiltros(prev => ({ ...prev, dataVencimentoFinal: e.target.value }))}
              className="bg-background/50 w-full focus:border-orange-500 focus:ring-orange-500"
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
              className="bg-background/50 w-full focus:border-orange-500 focus:ring-orange-500"
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
              className="bg-background/50 w-full focus:border-orange-500 focus:ring-orange-500"
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
              className="bg-background/50 w-full focus:border-orange-500 focus:ring-orange-500"
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
              className="bg-background/50 w-full focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
          
          {/* Banco */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Banco</label>
            <Select
              value={pagosFiltros.banco}
              onValueChange={(value) => setPagosFiltros(prev => ({ ...prev, banco: value }))}
              className="w-full"
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um banco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="001 - BANCO DO BRASIL S.A.">Banco do Brasil</SelectItem>
                <SelectItem value="237 - BANCO BRADESCO S.A.">Bradesco</SelectItem>
                <SelectItem value="341 - BANCO ITAU S.A.">Itaú</SelectItem>
                <SelectItem value="033 - BANCO SANTANDER (SP) S.A.">Santander</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Botões de filtro */}
        <div className="mt-4 flex justify-end gap-2 sm:justify-start">
          <Button
            variant="outline"
            size="sm"
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
            <X className="h-3 w-3" /> Limpar
          </Button>
          <Button
            onClick={() => setPaginaAtual(1)} // Resetar para primeira página ao filtrar
            className="h-8 text-xs bg-orange-700 hover:bg-orange-800 text-white gap-1 px-4"
          >
            Aplicar Filtro
          </Button>
        </div>
      </div>

      {/* Lista de boletos pagos */}
      <div className="rounded-xl border border-border bg-card/70 p-4">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Boletos Pagos</h3>
        
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
          onClick={() => {
            // Implementar exportação (CSV/Excel)
            toast.success('Exportação iniciada!');
          }}
          className="h-10 text-sm gap-2"
        >
          <FileText className="h-4 w-4 mr-2" /> Exportar
        </Button>
        
        <Button
          onClick={() => {
            // Implementar impressão
            toast.success('Preparando para imprimir...');
          }}
          className="h-10 text-sm bg-green-600 hover:bg-green-700 text-white gap-2"
        >
          <Printer className="h-4 w-4 mr-2" /> Imprimir
        </Button>
      </div>
    </div>
  </TabsContent>
</Tabs>
```

## Passo 6: Atualizar estatísticas existentes

Modifique a seção de estatísticas (aproximadamente linha 469) para incluir estatísticas de boletos pagos:

```typescript
<div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {/* Estatística existente de contas pagas */}
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

  {/* Estatística existente de contas não pagas */}
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

  {/* Nova estatística de boletos pagos */}
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

  {/* Estatística existente de boletos a vencer */}
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
            {/* Conteúdo do popover existente */}
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
```

## Integração com a Funcionalidade de Pagamento Existente

Para fazer com que quando um boleto seja marcado como pago através da função existente, ele apareça na aba de boletos pagos, modifique a função `handleSubmitManualPayment` (aproximadamente linha 404):

```typescript
// Dentro da função handleSubmitManualPayment, após criar o newBoleto:
const handleSubmitManualPayment = useCallback((e: React.FormEvent) => {
  e.preventDefault();

  // Validação existente...
  
  // Criar novo boleto (código existente)
  const newBoleto = {
    id: boletos.length + 1,
    descricao: fornecedorMP.trim(),
    vencimento: convertToBRDate(dataVencimentoMP),
    emissao: convertToBRDate(dataEmissaoMP),
    valor: valorNum,
    pago: true
  };

  // Adicionar à lista de boletos a pagar (código existente)
  setBoletos(prev => [...prev, newBoleto]);
  
  // NOVO: Também adicionar à lista de boletos pagos com informações de pagamento
  setPagosBoletos(prev => [...prev, {
    id: pagosBoletos.length + 200, // ID separado para evitar conflitos
    descricao: fornecedorMP.trim(),
    vencimento: convertToBRDate(dataVencimentoMP),
    pagamento: convertToBRDate(dataEmissaoMP), // Usando data de emissão como data de pagamento para simplificação
    valor: valorNum,
    valorPago: valorNum,
    beneficio: fornecedorMP.trim(),
    cnpj: "00.000.000/0000-00", // CNPJ genérico - em produção viria do cadastro do fornecedor
    banco: "000 - BANCO GERAL",
    numeroDocumento: `MAN${new Date().getTime()}`,
    nossoNumero: `${Math.floor(Math.random() * 10000000000)}`.padStart(10, '0')
  }]);
  
  toast.success(`Boleto de ${fornecedorMP.trim()} pago com sucesso!`);
  
  // Reset do formulário (código existente)
  // ...
}, [boletos, toast, pagosBoletos, setPagosBoletos]);
```

## Considerações Finais

1. **Separação de IDs**: Note que usei IDs diferentes (adicionando 200) para os boletos na lista de pagos para evitar conflitos com os IDs da lista de boletos a pagar.

2. **Dados do Beneficário**: Na implementação real, os campos como CNPJ, nome completo do beneficário e dados bancários viriam de um cadastro de fornecedores/clientes.

3. **Data de Pagamento**: Na implementação simplificada acima, usei a data de emissão como data de pagamento. Em produção, isso seria a data real do pagamento ou da baixa bancária.

4. **Persistência de Estado**: Em uma aplicação real, você provavelmente quereria persistir o estado dos filtros e da paginação usando URL query params ou localStorage para melhor experiência do usuário.

5. **Integração com Backend**: Quando o backend estiver disponível, substitua os dados mock e os useEffects por chamadas de API reais.

Esta implementação segue exatamente o mesmo padrão de código existente no arquivo financeiro.tsx, mantendo consistência com:
- Os mesmos componentes UI (Button, Input, Select, etc.)
- O mesmo padrão de hooks useState e useEffect
- O mesmo estilo de formatação de data e moeda
- A mesma abordagem de modais e diálogos
- O mesmo padrão de filtragem e exibição de listas