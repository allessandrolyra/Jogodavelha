// Estado da Aplicação
const state = {
    board: Array(9).fill(null),
    currentPlayer: 'X',
    isGameOver: false,
    scores: { x: 0, o: 0, draw: 0 },
    difficulty: 'very_hard',
    gameMode: 'ai',
    player1Name: 'Jogador 1',
    player2Name: 'Computador',
    isConfigured: false
};

const THEME_KEY = 'jogo-velha-theme';
const CONFIG_KEY = 'jogo-velha-config';

// Web Audio API Context
let audioCtx;

// DOM Elements
const elements = {
    cells: document.querySelectorAll('.cell'),
    status: document.getElementById('game-status'),
    dialog: document.getElementById('result-dialog'),
    dialogTitle: document.getElementById('dialog-title'),
    dialogMessage: document.getElementById('dialog-message'),
    btnDialogClose: document.getElementById('btn-dialog-close'),
    btnReset: document.getElementById('btn-reset'),
    btnClearScore: document.getElementById('btn-clear-score'),
    btnSetup: document.getElementById('btn-setup'),
    scoreX: document.getElementById('score-val-x'),
    scoreO: document.getElementById('score-val-o'),
    scoreDraw: document.getElementById('score-val-draw'),
    player1Label: document.getElementById('player1-label'),
    player2Label: document.getElementById('player2-label'),
    colorX: document.getElementById('color-x'),
    colorO: document.getElementById('color-o'),
    difficulty: document.getElementById('difficulty'),
    difficultySelect: document.getElementById('difficulty-select'),
    difficultyGroup: document.getElementById('difficulty-group'),
    difficultySettings: document.getElementById('difficulty-settings'),
    player2Group: document.getElementById('player2-group'),
    difficultyGroupSetup: document.getElementById('difficulty-group'),
    setupDialog: document.getElementById('setup-dialog'),
    setupForm: document.getElementById('setup-form'),
    player1NameInput: document.getElementById('player1-name'),
    player2NameInput: document.getElementById('player2-name'),
    gameModeSelect: document.getElementById('game-mode'),
    canvas: document.getElementById('win-canvas'),
    boardContainer: document.querySelector('.board-container'),
    themeToggle: document.getElementById('theme-toggle'),
    metaThemeColor: document.getElementById('meta-theme-color')
};

// Web Worker para IA
let aiWorker;

// Linhas de vitória
const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// Inicialização
function init() {
    loadTheme();
    loadConfig();
    loadLocalData();
    updateScoreView();
    setupEventListeners();
    setupCanvas();
    initAudio();
    initWorker();
    updatePlayerLabels();
    updateDifficultyVisibility();

    if (!state.isConfigured) {
        elements.setupDialog?.showModal();
    } else {
        renderBoard();
    }
}

function loadConfig() {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.player1Name = data.player1Name || 'Jogador 1';
            state.player2Name = data.player2Name || 'Computador';
            state.gameMode = data.gameMode || 'ai';
            state.difficulty = data.difficulty || 'very_hard';
            state.isConfigured = data.isConfigured || false;
        } catch (e) {
            console.error('Erro ao carregar config', e);
        }
    }
}

function saveConfig() {
    const data = {
        player1Name: state.player1Name,
        player2Name: state.player2Name,
        gameMode: state.gameMode,
        difficulty: state.difficulty,
        isConfigured: true
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(data));
}

function applySetupForm() {
    state.player1Name = (elements.player1NameInput?.value || 'Jogador 1').trim() || 'Jogador 1';
    state.gameMode = elements.gameModeSelect?.value || 'ai';

    if (state.gameMode === '2p') {
        state.player2Name = (elements.player2NameInput?.value || 'Jogador 2').trim() || 'Jogador 2';
        state.difficulty = 'easy';
    } else {
        state.player2Name = 'Computador';
        state.difficulty = elements.difficulty?.value || elements.difficultySelect?.value || 'very_hard';
    }

    state.isConfigured = true;
    saveConfig();
    updatePlayerLabels();
    updateDifficultyVisibility();
}

function updatePlayerLabels() {
    if (elements.player1Label) elements.player1Label.textContent = `${state.player1Name} (X)`;
    if (elements.player2Label) elements.player2Label.textContent = `${state.player2Name} (O)`;
}

function updateDifficultyVisibility() {
    const isAI = state.gameMode === 'ai';
    elements.difficultyGroupSetup?.classList.toggle('hidden', !isAI);
    elements.player2Group?.classList.toggle('hidden', isAI);
    elements.difficultySettings?.classList.toggle('hidden', !isAI);
}

// Tema claro/escuro
function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateMetaThemeColor(saved);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateMetaThemeColor(theme);
}

function updateMetaThemeColor(theme) {
    if (elements.metaThemeColor) {
        elements.metaThemeColor.content = theme === 'light' ? '#f5f7fa' : '#1a1a2e';
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (state.isGameOver) {
        const winInfo = checkWin(state.board);
        if (winInfo) drawWinLineHTML5(winInfo.line);
    }
}

function initWorker() {
    if (window.Worker) {
        const workerUrl = new URL('./ai-worker.js', import.meta.url).href;
        aiWorker = new Worker(workerUrl);
        aiWorker.onmessage = (e) => {
            const { bestMove } = e.data;
            if (bestMove !== undefined && !state.isGameOver) {
                makeMove(bestMove, 'O');
            }
        };
    } else {
        console.warn('Web Workers não suportados neste navegador.');
    }
}

function initAudio() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    } catch (e) {
        console.warn('Web Audio API não suportada');
    }
}

function playSound(type) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'clickX') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'clickO') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'win') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'draw') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    }
}

function setupCanvas() {
    const resizeObserver = new ResizeObserver(() => {
        const rect = elements.boardContainer.getBoundingClientRect();
        elements.canvas.width = rect.width;
        elements.canvas.height = rect.height;
        if (state.isGameOver) {
            const winInfo = checkWin(state.board);
            if (winInfo) drawWinLineHTML5(winInfo.line);
        }
    });
    resizeObserver.observe(elements.boardContainer);
}

function drawWinLineHTML5(lineIndices) {
    const ctx = elements.canvas.getContext('2d');
    const rect = elements.boardContainer.getBoundingClientRect();
    const cell0 = elements.cells[lineIndices[0]].getBoundingClientRect();
    const cell2 = elements.cells[lineIndices[2]].getBoundingClientRect();

    const startX = cell0.left + cell0.width / 2 - rect.left;
    const startY = cell0.top + cell0.height / 2 - rect.top;
    const endX = cell2.left + cell2.width / 2 - rect.left;
    const endY = cell2.top + cell2.height / 2 - rect.top;

    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    const winColor = getComputedStyle(document.documentElement).getPropertyValue('--win-line').trim() || '#ffffff';

    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.strokeStyle = winColor;
    ctx.shadowBlur = 12;
    ctx.shadowColor = winColor;

    let progress = 0;
    function animate() {
        if (progress > 1) progress = 1;
        ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        const currentX = startX + (endX - startX) * progress;
        const currentY = startY + (endY - startY) * progress;
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        if (progress < 1) {
            progress += 0.05;
            requestAnimationFrame(animate);
        }
    }
    requestAnimationFrame(animate);
}

function setupEventListeners() {
    elements.cells.forEach(cell => {
        cell.addEventListener('click', () => {
            const index = parseInt(cell.getAttribute('data-index'));
            if (state.board[index] !== null || state.isGameOver) return;

            const isAITurn = state.gameMode === 'ai' && state.currentPlayer === 'O';
            if (isAITurn) return;

            if (state.currentPlayer === 'X') {
                makeMove(index, 'X');
            } else {
                makeMove(index, 'O');
            }
        });
    });

    elements.colorX?.addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--color-x', e.target.value);
        saveLocalData();
    });
    elements.colorO?.addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--color-o', e.target.value);
        saveLocalData();
    });

    elements.difficulty?.addEventListener('change', (e) => {
        state.difficulty = e.target.value;
        saveLocalData();
    });
    elements.difficultySelect?.addEventListener('change', (e) => {
        state.difficulty = e.target.value;
        saveLocalData();
    });

    elements.gameModeSelect?.addEventListener('change', () => {
        const isAI = elements.gameModeSelect.value === 'ai';
        elements.player2Group?.classList.toggle('hidden', isAI);
        elements.difficultyGroupSetup?.classList.toggle('hidden', !isAI);
    });

    elements.setupForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        applySetupForm();
        elements.setupDialog?.close();
        resetBoard();
    });

    elements.btnReset?.addEventListener('click', resetBoard);
    elements.btnClearScore?.addEventListener('click', clearScores);
    elements.btnSetup?.addEventListener('click', () => {
        elements.player1NameInput.value = state.player1Name;
        elements.player2NameInput.value = state.player2Name;
        elements.gameModeSelect.value = state.gameMode;
        const diff = state.difficulty;
        if (elements.difficulty) elements.difficulty.value = diff;
        if (elements.difficultySelect) elements.difficultySelect.value = diff;
        elements.player2Group?.classList.toggle('hidden', state.gameMode === 'ai');
        elements.difficultyGroupSetup?.classList.toggle('hidden', state.gameMode !== 'ai');
        elements.setupDialog?.showModal();
    });

    elements.btnDialogClose?.addEventListener('click', () => {
        elements.dialog.close();
        resetBoard();
    });

    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleTheme);
    }

    document.documentElement.style.setProperty('--color-x', elements.colorX?.value || '#00ffcc');
    document.documentElement.style.setProperty('--color-o', elements.colorO?.value || '#ff007f');
}

function getCurrentPlayerName() {
    return state.currentPlayer === 'X' ? state.player1Name : state.player2Name;
}

function makeMove(index, player) {
    state.board[index] = player;
    elements.cells[index].innerText = player;
    elements.cells[index].setAttribute('data-marker', player);

    playSound(player === 'X' ? 'clickX' : 'clickO');

    if (checkEndGame()) return;

    state.currentPlayer = player === 'X' ? 'O' : 'X';
    const nextName = getCurrentPlayerName();

    if (state.gameMode === 'ai' && state.currentPlayer === 'O') {
        elements.status.innerText = `${state.player2Name} pensando...`;
        if (aiWorker) {
            aiWorker.postMessage({
                board: state.board,
                difficulty: state.difficulty
            });
        }
    } else {
        elements.status.innerText = `Vez de ${nextName} (${state.currentPlayer})!`;
    }

    saveLocalData();
}

function checkWin(board) {
    for (let i = 0; i < WIN_LINES.length; i++) {
        const [a, b, c] = WIN_LINES[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], line: WIN_LINES[i] };
        }
    }
    return null;
}

function checkEndGame() {
    const winInfo = checkWin(state.board);
    if (winInfo) {
        state.isGameOver = true;
        drawWinLineHTML5(winInfo.line);
        winInfo.line.forEach(i => elements.cells[i].classList.add('winning'));
        playSound('win');

        const winnerName = winInfo.winner === 'X' ? state.player1Name : state.player2Name;
        if (winInfo.winner === 'X') {
            state.scores.x++;
            showModal(`${state.player1Name} Venceu!`, `Parabéns, ${winnerName}!`);
        } else {
            state.scores.o++;
            showModal(`${state.player2Name} Venceu!`, `${winnerName} ganhou esta partida!`);
        }
        updateScoreView();
        saveLocalData();
        return true;
    }

    if (!state.board.includes(null)) {
        state.isGameOver = true;
        state.scores.draw++;
        playSound('draw');
        showModal('Empate!', 'A partida terminou sem vencedor.');
        updateScoreView();
        saveLocalData();
        return true;
    }

    return false;
}

function showModal(title, msg) {
    elements.dialogTitle.innerText = title;
    elements.dialogMessage.innerText = msg;
    elements.dialog.showModal();
}

function resetBoard() {
    state.board = Array(9).fill(null);
    state.currentPlayer = 'X';
    state.isGameOver = false;

    elements.cells.forEach(cell => {
        cell.innerText = '';
        cell.removeAttribute('data-marker');
        cell.classList.remove('winning');
    });

    const ctx = elements.canvas.getContext('2d');
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);

    elements.status.innerText = `Vez de ${state.player1Name} (X)!`;
    saveLocalData();
}

function clearScores() {
    state.scores = { x: 0, o: 0, draw: 0 };
    updateScoreView();
    saveLocalData();
}

function saveLocalData() {
    const data = {
        board: state.board,
        currentPlayer: state.currentPlayer,
        isGameOver: state.isGameOver,
        scores: state.scores,
        difficulty: state.difficulty,
        colors: {
            x: elements.colorX?.value,
            o: elements.colorO?.value
        }
    };
    localStorage.setItem('tic-tac-toe-html5', JSON.stringify(data));
}

function loadLocalData() {
    const saved = localStorage.getItem('tic-tac-toe-html5');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.board = data.board || Array(9).fill(null);
            state.currentPlayer = data.currentPlayer || 'X';
            state.isGameOver = data.isGameOver || false;
            state.scores = data.scores || { x: 0, o: 0, draw: 0 };
            state.difficulty = data.difficulty || state.difficulty;
            if (data.colors) {
                elements.colorX.value = data.colors.x;
                elements.colorO.value = data.colors.o;
            }
        } catch (e) {
            console.error('Erro ao ler localStorage', e);
        }
    }
}

function renderBoard() {
    state.board.forEach((val, index) => {
        if (val) {
            elements.cells[index].innerText = val;
            elements.cells[index].setAttribute('data-marker', val);
        }
    });

    if (state.isGameOver) {
        const winInfo = checkWin(state.board);
        if (winInfo) {
            drawWinLineHTML5(winInfo.line);
            winInfo.line.forEach(i => elements.cells[i].classList.add('winning'));
        }
        elements.status.innerText = 'Fim de Jogo!';
    } else {
        const nextName = getCurrentPlayerName();
        if (state.gameMode === 'ai' && state.currentPlayer === 'O') {
            elements.status.innerText = `${state.player2Name} pensando...`;
            if (aiWorker) {
                aiWorker.postMessage({ board: state.board, difficulty: state.difficulty });
            }
        } else {
            elements.status.innerText = `Vez de ${nextName} (${state.currentPlayer})!`;
        }
    }
}

function updateScoreView() {
    elements.scoreX.innerText = state.scores.x;
    elements.scoreO.innerText = state.scores.o;
    elements.scoreDraw.innerText = state.scores.draw;
}

document.addEventListener('DOMContentLoaded', init);
