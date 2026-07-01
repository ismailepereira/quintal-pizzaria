# Spec — Site Quintal Restaurante e Pizzaria

**Data:** 2026-07-01
**Cliente:** Quintal Restaurante e Pizzaria (Ouro Preto do Oeste, RO)

## Contexto do negócio

- Instagram: [@quintal.opo](https://www.instagram.com/quintal.opo/) (~5,7k seguidores)
- Horário conhecido: almoço seg-sáb 11h-14h · jantar ter-dom 18h-23h
- Telefone encontrado (post de 2020, **não confirmado**): (69) 3461-1766
- Endereço: conforme link do Google Maps fornecido pelo cliente
- Identidade visual real: fachada em madeira escura rústica, letreiro com emblema circular "Q" e wordmark "QUINTAL" em brilho neon branco-lilás, string lights âmbar, plantas (folhagem tipo espada-de-são-jorge) na entrada

## Objetivo

Site institucional de vitrine (página única), com forte apelo visual e elementos flutuantes/interativos, para apresentar o restaurante, cardápio e localização. Não é e-commerce/pedido online nesta fase.

## Escopo confirmado com o cliente

- **Seções:** Hero · Cardápio · Ambiente · Localização · Contato (rodapé). Sem delivery/pedido online, sem blog/eventos, sem depoimentos nesta fase.
- **Fotos:** placeholders (sem fotografia real ainda) — cliente troca depois.
- **Cardápio:** itens/preços placeholder (fictícios, típicos de pizzaria) — cliente troca depois em `assets/data/menu.json`.
- **Contato:** usa os dados encontrados (telefone antigo) + marca WhatsApp/endereço exato/horário como pendente de confirmação (comentário HTML visível só no código-fonte).
- **Identidade visual:** sem logo digital pronta — recriar uma wordmark/emblema simples inspirado no letreiro real da fachada (círculo + "QUINTAL"), usando a paleta extraída da foto da fachada.
- **Estrutura:** página única (`index.html`) com âncoras, não páginas separadas.
- **Repositório:** novo repositório GitHub dedicado (`quintal-pizzaria`), com deploy automático via GitHub Pages.

## Direção visual aprovada

Referência principal: [Pizza 4P's (Awwwards)](https://www.awwwards.com/sites/pizza-4ps) — tom editorial, sofisticado, foto grande no hero, tipografia limpa — **adaptado com a paleta real da fachada do Quintal** (mais quente/noturno que o azul/bege original do Pizza 4P's).

**Composição do hero (layout "A" aprovado):** texto + CTA à esquerda, elemento visual grande à direita (foto/3D), pontinhos de ingrediente flutuando discretamente perto do elemento visual — não a tela toda dominada pelo 3D.

**Paleta (extraída da foto da fachada):**
| Uso | Cor |
|---|---|
| Fundo | `#140d08` → `#241a12` (gradiente madeira escura) |
| Logo/título (glow neon) | `#efe6f7` (branco-lilás) |
| Acento principal (CTA, string lights) | `#e8b04b` (âmbar) |
| Verde plantas | `#3d5a2e` / `#4a6b38` |
| Ingredientes flutuantes | tomate `#c0392b` · limão-siciliano `#f1c40f` · manjericão `#6b8e23` |

**Tipografia:** título serifado editorial (ex: Cormorant Garamond, reaproveitando o padrão já usado no projeto jessica-machado) + corpo em sans-serif limpo.

## Arquitetura técnica

Sem build step — HTML/CSS/JS puro, Tailwind + GSAP + Three.js via CDN. Segue o padrão dos outros projetos de cliente (ex: jessica-machado): pasta `src/` isolada é a única coisa publicada/deployada, incluindo `robots.txt`, `sitemap.xml`, favicon e meta tags Open Graph (título, descrição, imagem de compartilhamento) no `<head>` do `index.html`.

```
quintal-pizzaria/
├── .claude/launch.json          # preview local: python -m http.server na pasta src
├── .github/workflows/pages.yml  # deploy automático pro GitHub Pages a cada push em main
├── docs/briefing.md             # este documento
├── .gitignore
├── README.md
└── src/
    ├── index.html
    ├── robots.txt · sitemap.xml
    └── assets/
        ├── css/styles.css        # design tokens (paleta/tipografia) + layout
        ├── js/
        │   ├── hero-scene.js     # cena Three.js do hero
        │   └── main.js           # GSAP/ScrollTrigger: reveals, parallax, menu mobile
        ├── data/menu.json         # itens do cardápio (placeholder, editável)
        └── img/                   # placeholders de imagem
```

### Seções da página (`index.html`)

1. **Hero** — cena 3D (pizza girando + ingredientes orbitando), headline, CTA "Ver cardápio" / WhatsApp
2. **Cardápio** — grid de pratos (nome, descrição curta, preço) lido de `menu.json`, com reveal em scroll (stagger)
3. **Ambiente** — bloco editorial (imagem grande + texto) sobre o clima do "quintal" real
4. **Localização** — iframe do Google Maps (link fornecido pelo cliente) + horários
5. **Contato/rodapé** — telefone/WhatsApp, Instagram, horários, marcação de dados pendentes de confirmação

### Sistema de animação

**Three.js (`hero-scene.js`)** — escopo: só o hero.
- Cena leve: 1 esfera/disco representando a pizza (textura procedural: base + "queijo" + pontos de recheio) girando devagar no eixo Y, com 4-6 ingredientes (esferas pequenas coloridas) orbitando em raios/velocidades diferentes.
- Luz ambiente + 1 point light âmbar (ecoando as string lights) para o brilho neon nos materiais.
- Câmera com parallax leve reagindo ao mouse.
- `IntersectionObserver` pausa o render loop quando o hero sai da viewport.
- `prefers-reduced-motion`: desliga a rotação automática, mostra frame estático.
- **Fallback sem WebGL:** emblema "Q" com glow em CSS puro substitui o canvas — nunca quebra o layout.

**GSAP + ScrollTrigger (`main.js`)**
- Reveal em scroll (fade + translateY, stagger) para cardápio/ambiente/localização.
- Pontinhos de ingrediente flutuantes (CSS + glow, não WebGL) repetidos como acento decorativo de fundo em todas as seções, com leve parallax de mouse — mesmo padrão visual do hero, mas leve.
- Menu mobile (abrir/fechar) com timeline GSAP simples.

### Dados (`assets/data/menu.json`)

Formato:
```json
[
  { "categoria": "Pizzas", "itens": [
    { "nome": "Margherita", "descricao": "molho, mussarela, manjericão", "preco": "45,00" }
  ]}
]
```
Placeholder com 6-8 itens fictícios nesta fase, cobrindo mais de uma categoria (ex: Pizzas + Bebidas/Sobremesas, já que o nome é "restaurante e pizzaria", não só pizzaria); cliente edita depois sem mexer no HTML/JS.

### Deploy

- Novo repositório GitHub público `quintal-pizzaria`.
- `.github/workflows/pages.yml` (mesmo padrão do jessica-machado): build via `actions/upload-pages-artifact` apontando pra `src/`, deploy via `actions/deploy-pages`.
- `.claude/launch.json`: `python -m http.server` servindo `src/` pra preview local antes de publicar.

## Fora de escopo (nesta fase)

- Pedido online / delivery / integração iFood
- Blog, eventos, depoimentos de clientes
- Fotografia real, cardápio real
- **Confirmação** de WhatsApp/endereço/horário exatos — os campos aparecem normalmente na UI com os dados encontrados; só a validação final desses dados fica pendente (marcada com comentário HTML), não a omissão dos campos
- Logo digital oficial (usamos wordmark recriada a partir do letreiro)

## Testes / verificação

Após implementação: abrir no preview do navegador e verificar scroll completo, parallax/hover do mouse, responsividade mobile (público-alvo acessa majoritariamente por celular/4G), e o fallback sem WebGL.
