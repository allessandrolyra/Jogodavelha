# Jogo da Velha - HTML5

Jogo da Velha desenvolvido com recursos nativos HTML5: Web Workers, Canvas, Web Audio API, LocalStorage, PWA e mais.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

## Jogar Online

Após publicar no GitHub Pages, acesse:

**https://[seu-usuario].github.io/jogo-da-velha/**

## Recursos

- **2 Jogadores** – Jogue com um amigo no mesmo dispositivo
- **vs Computador** – Jogue contra a IA com 4 níveis de dificuldade:
  - **Fácil** – Jogadas aleatórias
  - **Médio** – 50% aleatório, 50% estratégico
  - **Difícil** – 20% aleatório, 80% estratégico
  - **Muito Difícil** – Minimax completo (imbatível)
- **Nomes personalizados** – Configure os nomes dos jogadores
- **Tema claro e escuro** – Alternância com um clique
- **Cores personalizáveis** para X e O
- **Placar persistente** – Estatísticas salvas no navegador
- **Linha de vitória animada** – Desenhada em Canvas
- **Sons sintetizados** – Web Audio API
- **PWA** – Instalável em dispositivos móveis

## Publicar no GitHub

### 1. Criar repositório

1. Acesse [github.com/new](https://github.com/new)
2. Nome sugerido: `jogo-da-velha`
3. Crie o repositório (público, sem README)

### 2. Enviar os arquivos

```powershell
cd "c:\01. Foursys\03. Jogo da Velha"

git add .
git commit -m "Jogo da Velha HTML5 - versão completa"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/jogo-da-velha.git
git push -u origin main
```

### 3. Ativar GitHub Pages

1. No repositório: **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `main` / **Folder**: `/ (root)`
4. Clique em **Save**

Em alguns minutos: `https://SEU-USUARIO.github.io/jogo-da-velha/`

## Executar localmente

O projeto usa ES Modules – é necessário um servidor HTTP:

```powershell
cd "c:\01. Foursys\03. Jogo da Velha"
npx serve -l 3000
```

Acesse `http://localhost:3000`

## Estrutura do Projeto

```
├── index.html      # Página principal
├── manifest.json   # PWA manifest
├── sw.js           # Service Worker
├── css/
│   └── styles.css  # Estilos (temas claro/escuro)
├── js/
│   ├── app.js      # Lógica principal
│   └── ai-worker.js # IA (Web Worker)
└── README.md
```

## Tecnologias HTML5

- **Web Workers** – IA em background sem travar a interface
- **Canvas API** – Linha de vitória animada
- **Web Audio API** – Sons sintetizados
- **LocalStorage** – Persistência de placar e preferências
- **Dialog** – Modais nativos
- **PWA** – Service Worker + Manifest (instalável)
