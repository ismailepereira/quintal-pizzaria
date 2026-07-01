# Site — Quintal Restaurante e Pizzaria (Ouro Preto do Oeste, RO)

Site institucional de vitrine, página única, com estética cinematográfica escura
(inspirada no projeto *benditta*, Made in Webflow) e micro-interações com Motion.

🔗 **Repositório:** https://github.com/ismailepereira/quintal-pizzaria
🔗 **No ar:** https://ismailepereira.github.io/quintal-pizzaria/

## Stack
HTML + CSS + JavaScript puro (sem build). Tailwind e Motion (motion.dev) via CDN.
Hospedado no GitHub Pages com deploy automático (GitHub Actions) a cada push na `main`.

## Estrutura
```
quintal-pizzaria/
├── docs/briefing.md              # spec do projeto
├── src/
│   ├── index.html                 # página única (hero, diferenciais, cardápio, sobre, localização, contato)
│   ├── robots.txt · sitemap.xml
│   └── assets/
│       ├── css/styles.css         # design tokens (paleta/tipografia) + layout
│       ├── js/main.js             # Motion: intro, reveals, nav, cursor glow + cardápio
│       ├── data/menu.json         # itens do cardápio (placeholder, editável)
│       ├── logo/quintal-branca.png # logo oficial (versão branca, PNG transparente)
│       └── img/                   # fotos (Unsplash, trocáveis por fotos reais)
└── README.md
```

## Rodando localmente
```
python -m http.server 5174 --directory src
```
Ou use o preview configurado em `.claude/launch.json`.

## Identidade visual
Estética escura/cinematográfica (referência *benditta*), adaptada ao Quintal:
- Fundo preto quente `#0c0a09` → `#151110`
- Texto creme `#f5efe6`
- Acento vinho `#6e0d12` / `#9a1b1f` (faixas, molduras, marcadores)
- Acento dourado `#e8b04b` (rótulos, preços, CTA)

Títulos: *Bitter* · Texto/UI: *Montserrat* (Google Fonts)

## Pendências (dados reais a confirmar com o cliente)
- [ ] Cardápio real (itens/preços por tamanho) — hoje `assets/data/menu.json` é placeholder
- [ ] Fotos reais do ambiente/pratos — hoje usa fotos royalty-free do Unsplash
- [ ] Confirmar WhatsApp, endereço exato e horário de funcionamento atuais
- [ ] Domínio próprio (atualizar URLs canônicas/OG ao migrar)

## Créditos / licenças de terceiros
- Fotos (`assets/img/*.jpg`): **Unsplash** (licença Unsplash — uso comercial livre,
  sem atribuição obrigatória). Substituir por fotos reais do Quintal quando disponíveis.
- Logo: arte oficial do cliente (`assets/logo/quintal-branca.png`).
- Bibliotecas via CDN: Motion (motion.dev), Tailwind. Tipografia: Google Fonts.
- Direção de layout inspirada no projeto *benditta* (Made in Webflow, Sarah Bertuol) —
  referência estética; código, textos e assets são próprios.

---
Desenvolvido por [ismailepereira](https://ismailepereira.github.io/)
