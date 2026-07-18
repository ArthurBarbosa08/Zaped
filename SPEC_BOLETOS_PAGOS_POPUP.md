# Especificação Técnica: Popup de Boletos Pagos (Versão Modal)

## Visão Geral
Esta especificação descreve a implementação do **Popup de Boletos Pagos** como um modal acessível diretamente do módulo Financeiro do sistema Zaped. Diferente da abordagem de aba tradicional, este popup será ativado por um botão de ação, proporcionando acesso rápido e contextualizado aos boletos já pagos, sem sair da tela atual de finanças.

## Objetivo
Fornecer um acesso instantâneo e não intrusivo à consulta de boletos pagos, integrado naturalmente ao fluxo de trabalho existente no módulo Financeiro, permitindo que os usuários verifiquem pagamentos recentes enquanto trabalham em outras tarefas financeiras.

## Requisitos Funcionais

### 1. Interface do Popup
#### 1.1 Trigger de Acesso
- Botão dedicado na barra de ações principal (junto a "Lançar boletos", "Pagar boletos", "Checar boletos")
- Ícone: `FileCheck` (do lucide-react) com label "Boletos Pagos"
- Posicionamento: Lado direito dos botões de ação existentes

#### 1.2 Layout do Modal
- Tamanho responsivo: 
  - Desktop: w-[600px] max-w-[80vw]
  - Mobile: w-full max-w-[90vw]
- Altura: max-h-[85vh] com scroll interno quando necessário
- Animação de entrada/saída suave (fade + slide)
- Overlay semi-transparente atrás do modal

#### 1.3 Estrutura Interna
```
Modal Header:
  - Título: "Boletos Pagos"
  - Botão de fechar (X) no canto superior direito

Modal Body:
  - Seção de filtros compacta (acordeão recolhível por padrão)
  - Lista de boletos pagos com paginação infinita ou tradicional
  - Área de resutados com contagem

Modal Footer:
  - Botões de ação: Exportar, Imprimir
  - Informação de total pago e quantidade
```

### 2. Funcionalidades Essenciais (Otimizadas para Popup)

#### 2.1 Filtros Inteligentes (Versão Compacta)
- **Período de Pagamento**: 
  - Seletor rápido: "Hoje", "Ontem", "Esta semana", "Mês atual", "Mês anterior", "Personalizado"
  - Campos de data inicial/final (aparecem apenas quando "Personalizado" selecionado)
- **Beneficário**: Campo de busca com autocomplete (mínimo 2 caracteres)
- **Valor**: Faixa mínima/máxima com máscara de moeda
- **Botão "Aplicar Filtros"** destacado
- **Botão "Limpar"** discreto

#### 2.2 Visualização de Resultados
Cada item na lista exibe:
- ✅ Ícone de pagamento (CheckCircle2 verde)
- Nome do beneficário (truncado se necessário)
- CNPJ/CPF (formato mascarado: **.222.333/0001-**)
- Data de pagamento ( DD/MM/AAAA )
- Valor pago (em destaque: formatBRL)
- Status: "Pago" (badge verde pequeno)

#### 2.3 Ações Contextuais
- **Exportar**: CSV com dados filtrados atuais
- **Imprimir**: Layout otimizado para A4
- **Ver detalhes**: Ao clicar no item, abre submodal com informações completas
- **Atualizar**: Botão de recarregar dados (útil se houver mudanças em background)

### 3. Integração com Fluxo Existente
#### 3.1 Conexão com Pagamento Manual
- Quando usuário confirma pagamento via dialogo existente ("Pagar Boleto Manual"):
  - Sistema automaticamente adiciona o boleto pago à lista interna do popup
  - Se popup estiver aberto, atualiza a lista em tempo real
  - Toast de sucesso permanece, mas dado já está disponível no popup

#### 3.2 Sincronização com Estado Global
- Utiliza mesmo mecanismo de estado das abas existentes
- Compartilha dados com a listagem principal de boletos (quando disponível via backend)
- Filtros do popup não afetam as abas principais e vice-versa

### 4. Regras de Uso e Comportamento

#### 4.1 Estado Inicial
- Ao abrir popup pela primeira vez:
  - Carrega boletos pagos dos últimos 7 dias (padrão mais útil para consulta rápida)
  - Filtro de período definido como "Esta semana"
  - Outros filtros vazios
  - Primeira página de resultados carregada

#### 4.2 Comportamento de Filtros
- Aplicação em tempo real (sem necessidade de botão "Aplicar" em desktop)
- Em mobile: botão "Aplicar" obrigatório para evitar mudanças acidentais
- Filtros preservados entre aberturas do popup (usando localStorage ou state)
- Reset completo disponível via botão "Limpar"

#### 4.3 Performance e UX
- Loading states visíveis durante carregamento de dados
- Empty state ilustrativo quando nenhum resultado encontrado
- Paginação otimizada (20 itens por carga inicial, depois 10 por página)
- Debounce em campos de busca (300ms) para evitar excesso de chamadas
- Tecla ESC fecha o modal
- Clique fora do modal fecha (com confirmação se houver edição em filtros não aplicada)

### 5. Componentes Técnicos Específicos para Popup

#### 5.1 Novos Estados React
```typescript
const [isPaidBoletoPopupOpen, setIsPaidBoletoPopupOpen] = useState(false);
const [paidBoletoFilters, setPaidBoletoFilters] = useState({
  period: 'this_week', // today, yesterday, this_week, this_month, last_month, custom
  startDate: '',
  endDate: '',
  beneficiary: '',
  valueMin: '',
  valueMax: ''
});
const [paidBoletos, setPaidBoletos] = useState<Array<PaidBoletoType>>([]);
const [isLoadingPaid, setIsLoadingPaid] = useState(false);
const [page, setPage] = useState(1);
```

#### 5.2 Funções Auxiliares Específicas
```typescript
// Converte período relativo para datas reais
const getDateRangeFromPeriod = (period: string): {start: string, end: string} => {
  const hoje = new Date();
  switch (period) {
    case 'today': 
      return {start: formatBRDate(hoje), end: formatBRDate(hoje)};
    case 'yesterday': 
      const ontem = new Date(hoje);
      ontem.setDate(hoje.getDate() - 1);
      return {start: formatBRDate(ontem), end: formatBRDate(ontem)};
    case 'this_week':
      const domingo = new Date(hoje);
      domingo.setDate(hoje.getDate() - hoje.getDay());
      const sabado = new Date(domingo);
      sabado.setDate(domingo.getDate() + 6);
      return {start: formatBRDate(domingo), end: formatBRDate(sabado)};
    case 'this_month':
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      return {start: formatBRDate(inicioMes), end: formatBRDate(fimMes)};
    case 'last_month':
      const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const fimMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      return {start: formatBRDate(mesPassado), end: formatBRDate(fimMesPassado)};
    default: // custom
      return {start: paidBoletoFilters.startDate, end: paidBoletoFilters.endDate};
  }
};
```

### 6. Fluxo de Usuário Otimizado

#### 6.1 Consulta Rápida (Cenário Principal)
1. Usuário está na tela de Financeiro (qualquer aba)
2. Clica no botão "Boletos Pagos" (ícone de check em arquivo)
3. Modal aparece com:
   - Filtro pré-selecionado: "Esta semana"
   - Lista de boletos pagos dos últimos 7 dias
   - Total pago e quantidade visíveis no rodapé
4. Usuário verifica informações necessárias
5. Fecha modal clicando em X, fora do modal ou pressionando ESC
6. Continua exatamente onde estava no trabalho anterior

#### 6.2 Consulta Detalhada
1. Após abrir popup, usuário aplica filtros específicos se necessário
2. Clica em um boleto da lista para ver detalhes completos
3. Abre submodal interno com:
   - Todos os dados do boleto (beneficiário completo, banco, documento, etc.)
   - Comprovante de pagamento disponível para download
   - Histórico de tentativas (se適用)
4. Fecha submodal e continua no popup principal ou fecha tudo

### 7. Critérios de Aceitação para Popup

#### 7.1 Funcionalidade Essencial
[ ] Botão de acesso visível na barra de ações principal
[ ] Modal abre/fecha corretamente com animação suave
[ ] Filtros funcionam conforme especificado (períodos rápidos e customizado)
[ ] Lista de boletos pagos carregada e filtrada corretamente
[ ] Total pago e quantidade atualizados em tempo real
[ ] Ações de exportar e imprimir funcionam
[ ] Clique em item abre detalhes em submodal
[ ] Tecla ESC fecha o modal
[ ] Clique fora fecha o modal (quando apropriado)

#### 7.2 Experiência do Usuário
[ ] Acesso em máximo 1 click da tela principal
[ ] Carregamento inicial < 1.5s (dados mock) ou < 3s (dados reais)
[ ] Interface limpa e não sobrecarregada (foco no essencial)
[ ] Responsivo perfeitamente em mobile e desktop
[ ] Feedback visual claro para todas as ações
[ ] Navegação totalmente acessível via teclado

#### 7.3 Integração
[ ] Boletos pagos via função existente aparecem automaticamente no popup
[ ] Estado do popup não interfere nas abas existentes
[ ] Dados compartilhados corretamente quando backend disponível
[ ] Consistente com padrões de UI do resto da aplicação

### 8. Considerações de Implementação

#### 8.1 Aproveitamento do Existente
- Reutiliza 100% dos componentes UI do `@/components/ui` já importados
- Aproveita funções utilitárias existentes: `formatBRL`, `convertToBRDate`, `parseBRDate`
- Usa mesmo padrão de hooks (useState, useEffect, useMemo) do código atual
- Segue o mesmo estilo de validação e tratamento de erros

#### 8.2 Otimizações para Popup
- Filtros simplificados em comparação com versão de aba completa
- Carregamento inicial limitado aos dados mais relevantes (última semana)
- Uso de virtual scrolling ou paginação eficiente se lista for grande
- Debounce em busca de texto para performance
- Memoization agressiva de funções de filtro e processamento de dados

#### 8.3 Estados e Loading
- Estados claros: idle → loading → success → error → empty
- Skeletons ou placeholders durante carregamento
- Mensagens de erro amigáveis e acionáveis
- Estado de "nenhum resultado" com sugestão de alterar filtros

### 9. Perguntas para Validação com Product Owner

#### 9.1 Escopo do Popup
1. Qual nível de detalhe é essencial na lista principal do popup?
   - Apenas valor e beneficiário, ou incluir dados bancário também?
2. Quantos dias/padrões de período rápido devem ser disponibilizados inicialmente?
3. O popup deve lembrar filtros entre sessões do navegador?

#### 9.2 Ações e Integração
1. Além de exportar/imprimir, existem outras ações críticas para o popup?
2. Deve haver integração direta com comprovantes de pagamento no popup?
3. Qual o comportamento ideal quando um usuário tenta pagar um boleto já listado como pago?

#### 9.3 Performance e Limites
1. Qual é o Volume esperado de boletos pagos a ser exibido inicialmente?
2. Existe necessidade de busca por número do documento ou nosso número?
3. Deve haver limite de tempo para dados exibidos (ex: apenas últimos 90 dias)?

### 10. Próximos Passos para Implementação Popup

1. **Aprovação do Conceito**: Validar abordagem de popup com stakeholders
2. **Refinamento do Design**: Ajustar filtros e layout específico para modal
3. **Implementação do Componente**: Criar `PaidBoletoPopup.tsx` seguindo padrões existentes
4. **Integração na Barra de Ações**: Adicionar botão de trigger com ícone FileCheck
5. **Conexão com Estado de Pagamento**: Vincular com função existente de pagamento manual
6. **Testes de Usabilidade**: Validar fluxo de acesso rápido e fechamento intuitivo
7. **Preparação para Backend**: Estruturar código para fácil substituição por APIs reais

---
*Especificação para Popup de Boletos Pagos*
*Elaborada por: Desenvolvedor Sênior Web*
*Data: 18/07/2026*
*Versão: 1.0 (Abordagem Popup/Modal)*