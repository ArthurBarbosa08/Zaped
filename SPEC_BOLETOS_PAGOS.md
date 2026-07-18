# Especificação Técnica: Aba de Boletos Pagos

## Visão Geral
Esta especificação descreve a implementação da aba "Boletos Pagos" no módulo Financeiro do sistema Zaped. Esta aba permitirá aos usuários visualizar, filtrar e gerenciar boletos que já foram pagos, complementando as funcionalidades existentes de boletos a pagar e a vencer.

## Objetivo
Fornecer uma interface clara e eficiente para consulta e gestão de boletos já quitados, com recursos de filtragem, visualização de detalhes e geração de relatórios.

## Requisitos Funcionais

### 1. Tela Principal
#### 1.1 Layout
- Layout em abas semelhante às abas existentes ("Todos", "Próximos a vencer", "Vencidos")
- Nova aba: "Boletos Pagos"
- Exibição em formato de lista/cartões com informações essenciais do boleto
- Área de resumo com estatísticas (total pago, quantidade de boletos)

#### 1.2 Exibição de Dados
Cada boleto pago deve exibir:
- Número do documento/Nosso Número
- Nome do beneficário/fornecedor
- CNPJ/CPF do beneficário
- Data de emissão
- Data de vencimento
- Data do pagamento
- Valor Nominal (R$)
- Valor pago (R$) - pode incluir juros/multas
- Status de liquidacao (baixado)
- Número do documento de pagamento (se aplicável)
- Código de barras (visualização opcional)

### 2. Funcionalidades

#### 2.1 Filtros Avançados
- Período de pagamento (data inicial/final)
- Período de vencimento (data inicial/final)
- Nome/razão social do beneficário
- CNPJ/CPF do beneficário
- Número do documento/Nosso Número
- Valor mínimo/máximo pago
- Banco emissor
- Número do documento de pagamento (boleto bancário, TED, DOC, etc.)

#### 2.2 Ações Disponíveis
- Visualizar detalhes completos do boleto
- Emitir/baixar comprovante de pagamento (PDF)
- Visualizar código de barras original
- Exportar lista filtrada (CSV, Excel)
- Ver histórico de pagamento (se houver estornos ou pagamentos parciais)

#### 2.3 Integração com Funcionalidades Existentes
- Integração com a função de "Pagar boleto" existente (quando um boleto é marcado como pago, ele deve aparecer nesta aba)
- Possibilidade de estornar pagamento (voltando para estado de "a pagar")
- Vincular com boletos emitidos através da função "Lançar boletos"

### 3. Requisitos Não-Funcionais

#### 3.1 Performance
- Carregamento inicial rápido com paginação (mínimo 20 itens por página)
- Filtros aplicados sem recarregamento total da página
- Lazy loading para listas extensas

#### 3.2 Usabilidade
- Interface responsiva (mobile-first design)
- Tooltips explicativos para campos técnicos
- Confirmação visual para ações críticas (estorno, exportação)
- Mensagens de feedback claras (sucesso, erro, carregamento)

#### 3.3 Acessibilidade
- Contraste adequado (WCAG AA)
- Navegação totalmente teclável
- Labels adequados para leitores de tela
- Indicadores de loading acessíveis

### 4. Componentes Técnicos

#### 4.1 Estrutura de Componentes React
```
BoletosPagosPage/
├── BoletosPagosHeader.tsx          # Cabeçalho com título e estatísticas
├── BoletosPagosFilters.tsx         # Painel de filtros recolhível
├── BoletosPagosList.tsx            # Lista principal de boletos
│   ├── BoletosPagosItem.tsx        # Item individual da lista
│   └── BoletosPagosEmptyState.tsx  # Estado vazio
├── BoletosPagoDetailModal.tsx      # Modal de detalhes do boleto
├── BoletosPagoPagination.tsx       # Controle de paginação
└── BoletosPagoExportButtons.tsx    # Botões de exportação
```

#### 4.2 Integração com Estado Global
- Utilizar Context API ou Zustand para gerenciamento de estado
- Manter estado dos filtros aplicados
- Cache eficiente para evitar requisições desnecessárias
- Sincronizar com o estado geral de boletos do módulo financeiro

#### 4.3 Integração com API/Backend
Endpoints necessários (se backend existir):
- `GET /api/boletos/pagos` - Listar boletos pagos com filtros e paginação
- `GET /api/boletos/pagos/{id}` - Obter detalhes de um boleto pago específico
- `POST /api/boletos/pagos/{id}/estornar` - Estornar pagamento de um boleto
- `GET /api/boletos/pagos/export` - Exportar lista filtrada (CSV/Excel)
- `GET /api/boletos/pagos/{id}/comprovante` - Gerar comprovante de pagamento (PDF)

#### 4.4 Utilitários
Aproveitar funções existentes de `boletoUtils.ts`:
- `validateBoletoBarcode()` - Para validação de código de barras
- `validateBoletoLinhaDigitavel()` - Para validação de linha digitável
- `convertToBRDate()` e `parseBRDate()` - Para formatação de datas
- `formatBRL()` - Para formatação de valores monetários

### 5. Fluxos de Usuário

#### 5.1 Consulta de Boletos Pagos
1. Usuário navega para módulo Financeiro
2. Clica na aba "Boletos Pagos"
3. Sistema carrega boletos pagos padrão (últimos 30 dias)
4. Usuário aplica filtros conforme necessário
5. Lista é atualizada em tempo real
6. Usuário pode clicar em um boleto para ver detalhes

#### 5.2 Visualização de Detalhes
1. Usuário clica em um boleto da lista
2. Modal abre com informações completas:
   - Dados do beneficiário
   - Dados do documento
   - Histórico de pagamentos
   - Comprovante disponível para download
   - Opção para estornar pagamento (se permitido)

#### 5.3 Estorno de Pagamento
1. Usuário visualiza detalhes de um boleto pago
2. Clica em "Estornar Pagamento"
3. Sistema solicita confirmação com motivo
4. Após confirmação:
   - Boleto retorna para state "a pagar"
   - Atualiza listas em tempo real
   - Gera protocolo de estorno

#### 5.4 Exportação de Dados
1. Usuário aplica filtros desejados
2. Clica em "Exportar"
3. Seleciona formato (CSV/Excel)
4. Sistema gera e baixa o arquivo
5. Notificação de sucesso/erro

### 6. Regras de Negócio

#### 6.1 Exibição de Dados
- Boletos pagos são aqueles com status "pago" ou "baixado"
- Valor pago pode ser diferente do valor nominal (acréscimos ou descontos)
- Data de pagamento deve ser posterior ou igual à data de vencimento
- Boletos estornados devem retornar para a fila de "a pagar" automaticamente

#### 6.2 Validações
- Não permitir pagamento de boleto já pago (sem estorno prévio)
- Validar formato de data (DD/MM/AAAA)
- Validar valores monetários (mínimo 0.01)
- Verificar duplicidade de pagamento antes de confirmar

#### 6.3 Segurança
- Apenas usuários com permissão financeira podem acessar
- Log de todas as operações (pagamento, estorno, exportação)
- Validação server-side de todas as operações (mesmo que simulemos frontend)

### 7. Considerações de Implementação

#### 7.1 Integração com Código Existente
- Reutilizar componentes existentes (Button, Input, Select, Dialog, etc.)
- Aproveitar funções de formatação de data e moeda já implementadas
- Manter consistência visual com as abas existentes
- Utilizar o mesmo padrão de modais e diálogos

#### 7.2 Estado Inicial
- Ao carregar, mostrar boletos pagos dos últimos 30 dias
- Permitir ajuste rápido para "Mês atual", "Mês anterior", "Ano atual"
- Filtro padrão vazio para outros campos
athen#### 7.3 Tratamento de Estados
- Loading state durante carregamento de dados
- Empty state quando nenhum boleto corresponde aos filtros
- Error state para falhas na carga de dados
- Partial loading para melhor experiência em listas longas

### 8. Critérios de Aceitação

#### 8.1 Funcionalidade
[ ] Aba "Boletos Pagos" visível no módulo Financeiro
[ ] Lista de boletos pagos carregada corretamente
[ ] Filtros funcionando conforme especificado
[ ] Visualização de detalhes completa e precisa
[ ] Funcionalidade de exportação operante
[ ] Funcionalidade de estorno com confirmação
[ ] Integração com função existente de pagamento

#### 8.2 Usabilidade
[ ] Interface responsiva em diferentes tamanhos de tela
[ ] Navegação totalmente acessível via teclado
[ ] Feedback visual adequado para todas as ações
[ ] Tempos de carregamento aceitáveis (<2s para lista inicial)
[ ] Mensagens de erro claras e acionáveis

#### 8.3 Qualidade de Código
[ ] Código seguindo padrões do projeto existente
[ ] Componentes reutilizáveis e bem encapsulados
[ ] Tratamento adequado de erros e edge cases
[ ] Documentação inline adequada
[ ] Testes unitários para componentes críticos

### 9. Perguntas para o Product Owner/Stakeholder

1. **Dados de Pagamento**: 
   - Devo considerar apenas a data de baixa no sistema ou também a data efetiva do débito em conta?
   - Como lidar com pagamentos parciais?

2. **Estorno**:
   - Quais são as regras de negócio para estornar um pagamento?
   - Existe prazo limite para estorno após o pagamento?
   - Quem pode autorizar estornos?

3. **Exportação**:
   - Quais campos devem ser incluídos na exportação padrão?
   - Existe formato preferido (CSV vs Excel)?
   - Há necessidade de agrupamento ou subtotais na exportação?

4. **Integração**:
   - Os boletos pagos vem de um sistema legado ou são processados internamente?
   - Existe conciliação bancária automática que devo considerar?
   - Como é feita a baixa dos boletos no sistema atual?

5. **Reportes**:
   - Além da lista simples, existem relatórios gerenciais necessários?
   - Quais são os indicadores-chave que devem ser destacados no cabeçalho?

### 10. Próximos Passos

1. **Validação**: Revisar esta especificação com o product owner
2. **Design**: Criar wireframes/mockups da interface proposta
3. **Planejamento**: Definir tarefas técnicas e estimativas
4. **Implementação**: Desenvolver seguindo o plano estabelecido
5. **Teste**: Executar testes funcionais e de usabilidade
6. **Deploy**: Implantação em ambiente de homologação seguido de produção

---
*Especificação elaborada por: Desenvolvedor Sênior Web*
*Data: 18/07/2026*
*Versão: 1.0*