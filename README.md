# Site — Quintal Restaurante e Pizzaria (Ouro Preto do Oeste, RO)

Site institucional de vitrine, página única, com elementos interativos (Three.js + GSAP) inspirados
na paleta real da fachada do restaurante.

🔗 **Repositório:** https://github.com/ismailepereira/quintal-pizzaria

## Stack
HTML + CSS + JavaScript puro (sem build). Tailwind, GSAP (+ ScrollTrigger) e Three.js via CDN.
Hospedado no GitHub Pages com deploy automático (GitHub Actions) a cada push na `main`.

## Estrutura
```
quintal-pizzaria/
├── docs/briefing.md              # spec do projeto
├── src/
│   ├── index.html                 # página única (hero, cardápio, ambiente, localização, contato)
│   ├── robots.txt · sitemap.xml
│   └── assets/
│       ├── css/styles.css         # design tokens (paleta/tipografia) + layout
│       ├── js/
│       │   ├── hero-scene.js      # cena Three.js do hero
│       │   └── main.js            # GSAP/ScrollTrigger + carregamento do cardápio
│       ├── data/menu.json         # itens do cardápio (placeholder, editável)
│       └── img/                   # placeholders de imagem
└── README.md
```

## Rodando localmente
```
python -m http.server 5174 --directory src
```
Ou use o preview configurado em `.claude/launch.json`.

## Identidade visual
Paleta extraída da fachada real do restaurante (letreiro neon + madeira + string lights):
- Fundo madeira escura `#140d08` → `#241a12`
- Logo/título glow `#efe6f7` (branco-lilás)
- Acento âmbar `#e8b04b`
- Verde plantas `#3d5a2e` / `#4a6b38`
- Ingredientes: tomate `#c0392b` · limão `#f1c40f` · manjericão `#6b8e23`

Títulos: *Cormorant Garamond* · Texto/UI: *Jost*

## Pendências (dados reais a confirmar com o cliente)
- [ ] Cardápio real (itens/preços) — hoje em `assets/data/menu.json` é placeholder
- [ ] Fotos reais do ambiente/pratos — hoje o site usa placeholders/elementos 3D
- [ ] Confirmar WhatsApp, endereço exato e horário de funcionamento atuais
- [ ] Logo/identidade visual oficial (hoje é uma wordmark recriada a partir do letreiro)
- [ ] Domínio próprio (atualizar URLs canônicas/OG ao migrar)

## Créditos / licenças de terceiros
- Modelo 3D da pizza do hero: **"Pepperoni pizza"** por *Poly by Google* — licença
  **CC-BY** (Creative Commons Attribution). Fonte: https://poly.pizza/m/9IWGn64Fnqo
  Arquivo auto-hospedado em `src/assets/models/pizza.glb`.
- Bibliotecas via CDN: Three.js, Motion (motion.dev), Tailwind.

---
Desenvolvido por [ismailepereira](https://ismailepereira.github.io/)
