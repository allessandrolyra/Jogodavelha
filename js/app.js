// Estado da Aplicação
const state = {
    board: Array(9).fill(null),
    currentPlayer: 'X',
    playerNames: { x: 'Jogador 1', o: 'Jogador 2' },
    gameMode: 'ai', // 'ai' ou 'pvp'
    isGameOver: false,
    scores: { x: 0, o: 0, draw: 0 },
    difficulty: 'unbeatable'
};

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
    tutorialDialog: document.getElementById('tutorial-dialog'),
    btnTutorialOpen: document.getElementById('btn-tutorial'),
    btnTutorialClose: document.getElementById('btn-tutorial-close'),
    btnReset: document.getElementById('btn-reset'),
    btnClearScore: document.getElementById('btn-clear-score'),
    scoreX: document.getElementById('score-val-x'),
    scoreO: document.getElementById('score-val-o'),
    scoreDraw: document.getElementById('score-val-draw'),
    scoreLabelX: document.getElementById('score-label-x'),
    scoreLabelO: document.querySelector('.score-o span'),
    difficulty: document.getElementById('difficulty'),
    difficultyGroup: document.getElementById('difficulty-group'),
    modeDialog: document.getElementById('mode-dialog'),
    btnModeAI: document.getElementById('btn-mode-ai'),
    btnModePvP: document.getElementById('btn-mode-pvp'),
    modeSelectionStep: document.getElementById('mode-selection-step'),
    nameInputStep: document.getElementById('name-input-step'),
    nameX: document.getElementById('name-x'),
    nameO: document.getElementById('name-o'),
    groupNameO: document.getElementById('group-name-o'),
    btnStartGame: document.getElementById('btn-start-game'),
    btnBackToMode: document.getElementById('btn-back-to-mode'),
    canvas: document.getElementById('win-canvas'),
    boardContainer: document.querySelector('.board-container')
};

// Web Worker para IA
let aiWorker;

// Linhas de vitória
const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Linhas
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colunas
    [0, 4, 8], [2, 4, 6]             // Diagonais
];

// Inicialização
function init() {
    loadLocalData();
    updateScoreView();
    setupEventListeners();
    setupCanvas();
    initAudio();
    initWorker();
    renderBoard();
    
    // Inicia solicitando o modo se não estiver no meio de um jogo
    if (!state.board.some(c => c !== null) && !state.isGameOver) {
        elements.modeDialog.showModal();
    }
}

function initWorker() {
    if (window.Worker) {
        aiWorker = new Worker('js/ai-worker.js');
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

// Emissão de som sintético via HTML5 Web Audio API (Sons Suaves)
function playSound(type) {
    if (!audioCtx) return;
    
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;

    if (type === 'clickX') {
        // Um som de gota d'agua suave
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now); 
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02); // Ataque suave
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15); // Fade out suave
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'clickO') {
        // Um som mais grave mas arredondado
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now); 
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } else if (type === 'win') {
        // Melodia suave de vitória (Arpejo)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.1);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
    } else if (type === 'draw') {
        // Som melancólico e suave
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.5);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
        
        osc.start(now);
        osc.stop(now + 0.5);
    }
}

// Configura o tamanho do canvas para corresponder ao tabuleiro
function setupCanvas() {
    const resizeObserver = new ResizeObserver(() => {
        const rect = elements.boardContainer.getBoundingClientRect();
        elements.canvas.width = rect.width;
        elements.canvas.height = rect.height;
        // Redesenha a linha se o jogo acabou com vitória
        if (state.isGameOver) {
            const winInfo = checkWin(state.board);
            if (winInfo) drawWinLineHTML5(winInfo.line);
        }
    });
    resizeObserver.observe(elements.boardContainer);
}

// Desenha a linha da vitória cruzando as células no Canvas
function drawWinLineHTML5(lineIndices) {
    const ctx = elements.canvas.getContext('2d');
    const rect = elements.boardContainer.getBoundingClientRect();
    const cell0 = elements.cells[lineIndices[0]].getBoundingClientRect();
    const cell2 = elements.cells[lineIndices[2]].getBoundingClientRect();

    // Calcula coordenadas relativas ao boardContainer
    const startX = cell0.left + cell0.width / 2 - rect.left;
    const startY = cell0.top + cell0.height / 2 - rect.top;
    const endX = cell2.left + cell2.width / 2 - rect.left;
    const endY = cell2.top + cell2.height / 2 - rect.top;

    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    
    // Animação da linha
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffffff';

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
            progress += 0.04;
            requestAnimationFrame(animate);
        }
    }
    requestAnimationFrame(animate);
}

// Event Listeners
function setupEventListeners() {
    elements.cells.forEach(cell => {
        cell.addEventListener('click', () => {
            const index = parseInt(cell.getAttribute('data-index'));
            const isPlayerTurn = state.gameMode === 'ai' ? state.currentPlayer === 'X' : true;
            
            if (state.board[index] === null && !state.isGameOver && isPlayerTurn) {
                makeMove(index, state.currentPlayer);
            }
        });
    });


    elements.difficulty.addEventListener('change', (e) => {
        state.difficulty = e.target.value;
        saveLocalData();
    });

    elements.btnTutorialOpen.addEventListener('click', () => {
        elements.tutorialDialog.showModal();
    });
    
    elements.btnTutorialClose.addEventListener('click', () => {
        elements.tutorialDialog.close();
    });

    elements.btnReset.addEventListener('click', fullReset);
    elements.btnClearScore.addEventListener('click', clearScores);
    
    elements.btnModeAI.addEventListener('click', () => {
        showSetupStep('names', 'ai');
    });

    elements.btnModePvP.addEventListener('click', () => {
        showSetupStep('names', 'pvp');
    });

    elements.btnBackToMode.addEventListener('click', () => {
        showSetupStep('mode');
    });

    elements.btnStartGame.addEventListener('click', () => {
        const nameX = elements.nameX.value.trim() || 'Jogador 1';
        const nameO = state.gameMode === 'ai' ? 'A.I.' : (elements.nameO.value.trim() || 'Jogador 2');
        
        state.playerNames.x = nameX;
        state.playerNames.y = nameO; // Nota: Aqui era .o, mantive conforme planejado abaixo
        state.playerNames.o = nameO;

        elements.scoreLabelX.innerText = nameX;
        elements.scoreLabelO.innerText = nameO;

        elements.modeDialog.close();
        updateGameStatus();
        saveLocalData();
    });

    elements.btnDialogClose.addEventListener('click', () => {
        elements.dialog.close();
        resetBoard();
    });

}

// Execução de jogada
function makeMove(index, player) {
    state.board[index] = player;
    elements.cells[index].innerText = player;
    elements.cells[index].setAttribute('data-marker', player);
    
    playSound(player === 'X' ? 'clickX' : 'clickO');

    if (checkEndGame()) {
        return;
    }

    state.currentPlayer = player === 'X' ? 'O' : 'X';
    elements.status.innerText = state.currentPlayer === 'X' ? `Sua vez, ${state.playerName} (X)!` : 'IA (O) pensando...';
    
    saveLocalData();

    if (state.gameMode === 'ai' && state.currentPlayer === 'O') {
        // Envia estado para o Worker calcular
        if (aiWorker) {
            aiWorker.postMessage({
                board: state.board,
                difficulty: state.difficulty
            });
        }
    }
}

function showSetupStep(step, mode = null) {
    if (step === 'mode') {
        elements.modeSelectionStep.style.display = 'block';
        elements.nameInputStep.style.display = 'none';
    } else if (step === 'names') {
        state.gameMode = mode;
        elements.modeSelectionStep.style.display = 'none';
        elements.nameInputStep.style.display = 'block';
        
        elements.groupNameO.style.display = mode === 'pvp' ? 'block' : 'none';
        elements.difficultyGroup.style.display = mode === 'ai' ? 'flex' : 'none';
        
        if (mode === 'ai') {
            elements.nameX.placeholder = "Seu nome...";
            elements.nameX.value = state.playerNames.x !== 'Jogador 1' ? state.playerNames.x : '';
        } else {
            elements.nameX.placeholder = "Nome do Jogador 1 (X)...";
            elements.nameX.value = state.playerNames.x !== 'Jogador 1' ? state.playerNames.x : '';
            elements.nameO.value = state.playerNames.o !== 'Jogador 2' && state.playerNames.o !== 'A.I.' ? state.playerNames.o : '';
        }
    }
}

function updateGameStatus() {
    if (state.isGameOver) return;

    if (state.gameMode === 'ai') {
        elements.status.innerText = state.currentPlayer === 'X' ? `Sua vez, ${state.playerNames.x} (X)!` : 'IA (O) pensando...';
    } else {
        const currentName = state.currentPlayer === 'X' ? state.playerNames.x : state.playerNames.o;
        elements.status.innerText = `Vez de ${currentName} (${state.currentPlayer})`;
    }
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
        playSound('win');
        
        const winnerName = winInfo.winner === 'X' ? state.playerNames.x : state.playerNames.o;
        if (winInfo.winner === 'X') {
            state.scores.x++;
            showModal('Vitória!', `Parabéns, ${winnerName}! Você venceu.`);
        } else {
            state.scores.o++;
            if (state.gameMode === 'ai') {
                showModal('Você Perdeu!', 'A IA (O) venceu esta partida.');
            } else {
                showModal('Vitória!', `Parabéns, ${winnerName}! Você venceu.`);
            }
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
    
    // Mostra o diálogo de configuração
    showSetupStep('mode');
    elements.modeDialog.showModal();
    
    elements.cells.forEach(cell => {
        cell.innerText = '';
        cell.removeAttribute('data-marker');
    });
    
    // Limpa o canvas
    const ctx = elements.canvas.getContext('2d');
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    
    saveLocalData();
}

function fullReset() {
    // Limpa estado, placares e localStorage
    state.scores = { x: 0, o: 0, draw: 0 };
    localStorage.removeItem('tictactoe-v2');
    updateScoreView();
    resetBoard();
}

function clearScores() {
    state.scores = { x: 0, o: 0, draw: 0 };
    updateScoreView();
    saveLocalData();
}

// LocalStorage Persistence
function saveLocalData() {
    const data = {
        board: state.board,
        currentPlayer: state.currentPlayer,
        playerNames: state.playerNames,
        gameMode: state.gameMode,
        isGameOver: state.isGameOver,
        scores: state.scores,
        difficulty: state.difficulty
    };
    localStorage.setItem('tictactoe-v2', JSON.stringify(data));
}

function loadLocalData() {
    const saved = localStorage.getItem('tictactoe-v2');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            Object.assign(state, data); // Restaura o estado da memória
            
            // Restaura Configurações
            elements.difficulty.value = state.difficulty;
            
            if (state.playerNames) {
                elements.scoreLabelX.innerText = state.playerNames.x;
                elements.scoreLabelO.innerText = state.playerNames.o;
            }
            
            if (state.gameMode) {
                elements.difficultyGroup.style.display = state.gameMode === 'ai' ? 'flex' : 'none';
            }
        } catch (e) {
            console.error('Erro ao ler localStorage', e);
        }
    }
}

function renderBoard() {
    // Caso tenha de carregar do localStorage
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
        }
        elements.status.innerText = 'Fim de Jogo!';
    } else {
        updateGameStatus();
        // Se recarregou e for a vez da IA
        if (state.gameMode === 'ai' && state.currentPlayer === 'O') {
            if (aiWorker) {
                aiWorker.postMessage({ board: state.board, difficulty: state.difficulty });
            }
        }
    }
}

function updateScoreView() {
    elements.scoreX.innerText = state.scores.x;
    elements.scoreO.innerText = state.scores.o;
    elements.scoreDraw.innerText = state.scores.draw;
}

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
