### Plano: Tela "Seleção de Serviços" (pós-login)

Nova tela minimalista, com o mesmo padrão visual das telas de filial e login (fundo escuro com glows laranja, logo Zaped no topo, card central com borda + blur).

#### Rota
- Criar `src/routes/selecao-servicos.tsx` → URL `/selecao-servicos`
- Após o clique em "Entrar" no `/login`, redirecionar para `/selecao-servicos` (substituindo o `console.log` atual)

#### Conteúdo da tela (menu de ações — sem enfeites)
- Logo Zaped no topo
- Título: "Selecione um serviço"
- Subtítulo curto: "Escolha o serviço que deseja acessar"
- Grade com 4 cards de serviço (mock inicial, prontos para virar rotas depois):
  1. Vendas
  2. Estoque
  3. Clientes
  4. Relatórios
- Cada card: ícone (lucide) + nome + seta no hover, mesmo estilo dos cards de filial
- Rodapé com copyright

Sem: busca, filtros, tabs, banners, notificações, avatar — nada além do menu.

#### Ações dos cards
- Por enquanto, apenas `console.log` do serviço selecionado (não há rotas de destino ainda). Fica pronto para conectar quando as telas existirem.

#### Detalhes técnicos
- `createFileRoute("/selecao-servicos")` com `head()` (title + description)
- Usa `bg-background`, `bg-card`, `text-primary`, `border-border` — nenhum hex hardcoded
- `handleSubmit` do login passa a chamar `navigate({ to: "/selecao-servicos" })`
