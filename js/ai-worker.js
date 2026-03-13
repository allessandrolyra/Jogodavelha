// ai-worker.js - IA com níveis de dificuldade
// Fácil, Médio, Difícil, Muito Difícil

const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

self.onmessage = function(e) {
    const { board, difficulty } = e.data;

    const delay = difficulty === 'easy' ? 300 : difficulty === 'medium' ? 400 : 600;

    setTimeout(() => {
        let bestMove;

        switch (difficulty) {
            case 'easy':
                bestMove = getRandomMove(board);
                break;
            case 'medium':
                bestMove = Math.random() < 0.5 ? getRandomMove(board) : getBestMoveMinimax(board);
                break;
            case 'hard':
                bestMove = Math.random() < 0.2 ? getRandomMove(board) : getBestMoveMinimax(board);
                break;
            case 'very_hard':
            default:
                bestMove = getBestMoveMinimax(board);
        }

        self.postMessage({ bestMove });
    }, delay);
};

function getRandomMove(board) {
    const available = [];
    for (let i = 0; i < board.length; i++) {
        if (board[i] === null) available.push(i);
    }
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
}

function getBestMoveMinimax(board) {
    let bestScore = -Infinity;
    let move = -1;

    for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
            board[i] = 'O';
            let score = minimax(board, 0, false);
            board[i] = null;

            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

function minimax(board, depth, isMaximizing) {
    const result = checkWin(board);
    if (result === 'O') return 10 - depth;
    if (result === 'X') return depth - 10;
    if (!board.includes(null)) return 0;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === null) {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = null;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === null) {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = null;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function checkWin(board) {
    for (let i = 0; i < WIN_LINES.length; i++) {
        const [a, b, c] = WIN_LINES[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}
