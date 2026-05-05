# 🎣 Tá Pra Pesca — Landing Page

Landing page de vendas diretas com Next.js 14, deployada na Vercel, integrada com Yampi (checkout), Bling (ERP) e GTM (tagueamento).

---

## Stack

| Camada | Ferramenta |
|---|---|
| Framework | Next.js 14 (App Router) |
| Hosting | Vercel |
| Repositório | GitHub |
| Checkout | Yampi |
| ERP / NF-e | Bling |
| Tag Manager | Google Tag Manager |
| Analytics | GA4 (via GTM) |
| Ads | Meta Pixel + Google Ads (via GTM) |

---

## Rodando localmente

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/ta-pra-pesca.git
cd ta-pra-pesca

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.local.example .env.local
# Edite o .env.local com os valores reais

# 4. Rode o servidor de desenvolvimento
npm run dev
# Acesse: http://localhost:3000
```

---

## Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_WA_NUMBER` | Número do WhatsApp (55 + DDD + número) |
| `NEXT_PUBLIC_WA_MESSAGE` | Mensagem padrão do WhatsApp (URL encoded) |
| `NEXT_PUBLIC_KIT1_URL` | Link de checkout Yampi — Kit Rio & Tilápia |
| `NEXT_PUBLIC_KIT2_URL` | Link de checkout Yampi — Kit Pesqueiro Completo |
| `NEXT_PUBLIC_KIT3_URL` | Link de checkout Yampi — Kit Carretilha Expert |
| `NEXT_PUBLIC_GTM_ID` | ID do Google Tag Manager (ex: GTM-XXXXXXX) |

> **No Vercel:** adicione essas variáveis em Project → Settings → Environment Variables.
> O GTM só é injetado quando `NEXT_PUBLIC_GTM_ID` estiver preenchido (Fase 3).

---

## Deploy no Vercel

```bash
# 1. Faça push pro GitHub
git add .
git commit -m "feat: setup inicial da landing page"
git push origin main

# 2. No Vercel:
# - Vá em vercel.com → New Project
# - Importe o repositório do GitHub
# - O Vercel detecta Next.js automaticamente
# - Adicione as variáveis de ambiente
# - Clique em Deploy
```

Após o primeiro deploy, cada `git push` na branch `main` faz deploy automático.

---

## Estrutura do projeto

```
ta-pra-pesca/
├── app/
│   ├── layout.tsx          # Root layout — metadata + GTM
│   ├── page.tsx            # Landing page principal
│   ├── globals.css         # Design system (tokens, reset, utilitários)
│   └── obrigado/
│       └── page.tsx        # Thank you page (rastreio de conversão)
├── components/
│   ├── Navbar.tsx          # Navbar fixa com efeito scroll
│   ├── Hero.tsx            # Seção hero
│   ├── TrustBar.tsx        # Barra de selos de confiança
│   ├── Kits.tsx            # Cards dos 3 kits
│   ├── HowItWorks.tsx      # Seção "3 passos"
│   ├── Diferenciais.tsx    # Seção "Por que a gente"
│   ├── FAQ.tsx             # Accordion de perguntas frequentes
│   ├── FinalCTA.tsx        # Seção de call-to-action final
│   ├── Footer.tsx          # Rodapé
│   ├── WhatsAppFloat.tsx   # Botão WhatsApp flutuante
│   └── GTM.tsx             # Google Tag Manager (ativo na Fase 3)
├── data/
│   └── kits.ts             # ← EDITE AQUI para atualizar os kits
├── .env.local.example      # Modelo de variáveis de ambiente
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## Atualizando os kits

Edite **`data/kits.ts`** — é o único arquivo que precisa mudar quando:

- Preços mudarem
- Brindes dos kits 1 e 3 forem definidos
- Links de checkout do Yampi forem gerados
- Itens dos kits mudarem

---

## Roadmap de integração

### ✅ Fase 1 — Infraestrutura (concluída)
- [x] Projeto Next.js estruturado
- [x] GitHub + Vercel configurados
- [ ] Domínio personalizado (configurar no Vercel quando comprar o domínio)

### 🔄 Fase 2 — Checkout (próxima)
1. Criar conta no [Yampi](https://www.yampi.com.br)
2. Cadastrar os 3 kits como produtos
3. Gerar os links de checkout de cada kit
4. Preencher `NEXT_PUBLIC_KIT1_URL`, `NEXT_PUBLIC_KIT2_URL`, `NEXT_PUBLIC_KIT3_URL` no `.env.local` e no Vercel

### 📊 Fase 3 — Tagueamento
1. Criar conta no [Google Tag Manager](https://tagmanager.google.com)
2. Preencher `NEXT_PUBLIC_GTM_ID` → o script GTM é injetado automaticamente
3. Dentro do GTM: configurar GA4, Meta Pixel, Google Ads Conversion Tag
4. Mapear eventos: `page_view` → `view_item` → `begin_checkout` → `purchase`

### 🔗 Fase 4 — Bling
1. Criar conta no [Bling](https://www.bling.com.br)
2. Cadastrar os produtos com os mesmos SKUs do Yampi
3. Ativar integração nativa Yampi → Bling no painel do Yampi
4. Configurar emissão automática de NF-e no Bling

### 📈 Fase 5 — Otimização
- [ ] Microsoft Clarity (heatmaps grátis — instala via GTM)
- [ ] Looker Studio conectando GA4 + Bling para dashboard unificado
- [ ] Testes A/B de headlines

---

## Comandos úteis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção (teste local antes do deploy)
npm run start    # Roda o build localmente
npm run lint     # Verifica erros de TypeScript/ESLint
```

---

## Pendências (Lucas)

- [ ] Definir brinde do Kit 1 (Rio & Tilápia) e atualizar `data/kits.ts`
- [ ] Definir brinde do Kit 3 (Carretilha Expert) e atualizar `data/kits.ts`
- [ ] Comprar domínio próprio (sugestão: `taprapesca.com.br`)
- [ ] Criar conta Yampi e gerar links de checkout
- [ ] Preencher número do WhatsApp no `.env.local` e no Vercel
- [ ] Adicionar fotos dos produtos na pasta `/public` (quando disponíveis)
