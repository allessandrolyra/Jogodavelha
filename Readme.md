# Jogo da Velha - HTML5 SPA

Single Page Application de Jogo da Velha desenvolvida com recursos nativos HTML5.

## Recursos HTML5 Utilizados

- **Elementos Semânticos**: header, main, section, article, footer, nav
- **SVG**: Tabuleiro e símbolos X/O vetoriais com animações
- **Web Storage API**: localStorage para estatísticas e preferências
- **Web Audio API**: Sons sintetizados (clique, vitória, empate)
- **Web Workers**: IA com algoritmo Minimax em background
- **History API**: Navegação SPA (#/jogo, #/placar, #/config)
- **Custom Elements**: game-board, game-cell, score-board
- **Dialog**: Modais nativos para fim de jogo e configurações
- **Data Attributes**: data-cell, data-player, data-game-state
- **Template**: Elemento template para símbolos SVG
- **CSS3**: Grid, variáveis, animações, responsividade
- **ARIA**: Acessibilidade para leitores de tela

## Como Executar

1. Instale as dependências (opcional - usa npx):
   ```bash
   npx serve -l 3000
   ```

2. Ou use qualquer servidor HTTP estático na pasta do projeto.

3. Acesse `http://localhost:3000` no navegador.

> **Nota**: O projeto usa ES Modules. É necessário servir via HTTP (não abra o arquivo diretamente com file://).

## Estrutura

```
├── index.html      # Página principal
├── css/styles.css  # Estilos CSS3
├── js/
│   ├── app.js      # Custom Elements, orquestração
│   ├── game.js     # Lógica do jogo
│   ├── ai-worker.js # IA Minimax (Web Worker)
│   └── audio.js    # Web Audio API
└── README.md
```

## Modos de Jogo

- **1 Jogador**: Jogue contra a IA (Fácil ou Difícil)
- **2 Jogadores**: Jogue com outro jogador localmente
