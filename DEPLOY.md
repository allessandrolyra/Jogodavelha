# Checklist para Publicar no GitHub

## Antes de publicar

- [x] Arquivos não utilizados removidos (`audio.js`, `game.js`)
- [x] README atualizado com funcionalidades atuais
- [x] `.gitignore` configurado
- [x] Estrutura do projeto limpa

## Arquivos que serão publicados

```
├── .gitignore
├── index.html
├── manifest.json
├── sw.js
├── README.md
├── DEPLOY.md
├── css/
│   └── styles.css
└── js/
    ├── app.js
    └── ai-worker.js
```

## Comandos para publicar

```powershell
# 1. Navegar até a pasta do projeto
cd "c:\01. Foursys\03. Jogo da Velha"

# 2. Verificar status
git status

# 3. Adicionar todos os arquivos
git add .

# 4. Criar commit
git commit -m "Jogo da Velha HTML5 - versão completa para GitHub"

# 5. Definir branch principal
git branch -M main

# 6. Adicionar repositório remoto (substitua SEU-USUARIO pelo seu usuário do GitHub)
git remote add origin https://github.com/SEU-USUARIO/jogo-da-velha.git

# 7. Enviar para o GitHub
git push -u origin main
```

## Após o push

1. Acesse o repositório no GitHub
2. Vá em **Settings** → **Pages**
3. Em **Source**, selecione **Deploy from a branch**
4. **Branch**: `main`
5. **Folder**: `/ (root)`
6. Clique em **Save**

Aguarde 1-2 minutos. O jogo estará em:

**https://SEU-USUARIO.github.io/jogo-da-velha/**

## Observações

- O projeto usa **ES Modules** – deve ser servido via HTTP (não abra `index.html` diretamente)
- O **Service Worker** funciona em HTTPS (GitHub Pages fornece HTTPS)
- **LocalStorage** persiste dados no navegador do usuário
