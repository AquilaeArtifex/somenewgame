// ─────────────────────────────────────────────
//  GRANDMASTER CHESS  –  chess.js
//  Full chess engine + simple minimax AI
// ─────────────────────────────────────────────

const PIECES = {
  wK:'♔', wQ:'♕', wR:'♖', wB:'♗', wN:'♘', wP:'♙',
  bK:'♚', bQ:'♛', bR:'♜', bB:'♝', bN:'♞', bP:'♟'
};

const PIECE_VALUES = { K:20000, Q:900, R:500, B:330, N:320, P:100 };

// Piece-square tables for AI evaluation (white perspective)
const PST = {
  P: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
  ],
  N: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
  ],
  B: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
  ],
  R: [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     0,  0,  0,  5,  5,  0,  0,  0
  ],
  Q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
  ],
  K: [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20
  ]
};

// ─── GAME STATE ────────────────────────────────
let board = [];
let turn = 'w';
let selected = null;
let legalMoves = [];
let history = [];
let capturedByWhite = [];
let capturedByBlack = [];
let flipped = false;
let gameMode = 'pvp'; // 'pvp' | 'pve'
let aiDepth = 1;
let gameOver = false;
let moveLog = [];
let timers = { w: 600, b: 600 };
let timerInterval = null;

const FILES = ['a','b','c','d','e','f','g','h'];

function initBoard() {
  const layout = ['R','N','B','Q','K','B','N','R'];
  board = [];
  for (let r = 0; r < 8; r++) {
    board[r] = [];
    for (let c = 0; c < 8; c++) {
      if (r === 0) board[r][c] = 'b' + layout[c];
      else if (r === 1) board[r][c] = 'bP';
      else if (r === 6) board[r][c] = 'wP';
      else if (r === 7) board[r][c] = 'w' + layout[c];
      else board[r][c] = null;
    }
  }
}

// ─── MOVE GENERATION ───────────────────────────
function getPieceMoves(b, r, c, forCheck) {
  const piece = b[r][c];
  if (!piece) return [];
  const color = piece[0];
  const type  = piece[1];
  const moves = [];

  const add = (nr, nc) => {
    if (nr < 0 || nr > 7 || nc < 0 || nc > 7) return false;
    if (b[nr][nc] && b[nr][nc][0] === color) return false;
    moves.push([nr, nc]);
    return !b[nr][nc];
  };

  const slide = (dr, dc) => {
    let nr = r+dr, nc = c+dc;
    while (add(nr, nc)) { nr += dr; nc += dc; }
  };

  if (type === 'P') {
    const dir = color === 'w' ? -1 : 1;
    const start = color === 'w' ? 6 : 1;
    if (!b[r+dir]?.[c]) {
      moves.push([r+dir, c]);
      if (r === start && !b[r+2*dir]?.[c]) moves.push([r+2*dir, c]);
    }
    for (const dc of [-1, 1]) {
      const ep = getEnPassant();
      if (b[r+dir]?.[c+dc] && b[r+dir][c+dc][0] !== color) moves.push([r+dir, c+dc]);
      else if (ep && ep[0] === r+dir && ep[1] === c+dc) moves.push([r+dir, c+dc]);
    }
  }
  else if (type === 'N') {
    for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(r+dr, c+dc);
  }
  else if (type === 'B') { for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) slide(dr,dc); }
  else if (type === 'R') { for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,dc); }
  else if (type === 'Q') { for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]) slide(dr,dc); }
  else if (type === 'K') {
    for (const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) add(r+dr, c+dc);
    if (!forCheck) {
      // Castling
      const castling = getCastling();
      const backR = color === 'w' ? 7 : 0;
      if (r === backR && c === 4) {
        if (castling[color].K && !b[backR][5] && !b[backR][6] && b[backR][7]?.[1] === 'R' && b[backR][7][0] === color &&
            !isSquareAttacked(b, backR, 4, color) && !isSquareAttacked(b, backR, 5, color) && !isSquareAttacked(b, backR, 6, color))
          moves.push([backR, 6]);
        if (castling[color].Q && !b[backR][3] && !b[backR][2] && !b[backR][1] && b[backR][0]?.[1] === 'R' && b[backR][0][0] === color &&
            !isSquareAttacked(b, backR, 4, color) && !isSquareAttacked(b, backR, 3, color) && !isSquareAttacked(b, backR, 2, color))
          moves.push([backR, 2]);
      }
    }
  }
  return moves;
}

function getLegalMoves(b, r, c) {
  const piece = b[r][c];
  if (!piece) return [];
  const color = piece[0];
  const candidates = getPieceMoves(b, r, c, false);
  return candidates.filter(([nr, nc]) => {
    const nb = applyMove(b, r, c, nr, nc);
    return !isInCheck(nb, color);
  });
}

function isInCheck(b, color) {
  let kr = -1, kc = -1;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++)
    if (b[r][c] === color+'K') { kr = r; kc = c; }
  return isSquareAttacked(b, kr, kc, color);
}

function isSquareAttacked(b, r, c, byDefender) {
  const opp = byDefender === 'w' ? 'b' : 'w';
  for (let sr = 0; sr < 8; sr++) for (let sc = 0; sc < 8; sc++) {
    if (b[sr][sc]?.[0] !== opp) continue;
    const m = getPieceMoves(b, sr, sc, true);
    if (m.some(([mr,mc]) => mr === r && mc === c)) return true;
  }
  return false;
}

function applyMove(b, fr, fc, tr, tc, promo) {
  const nb = b.map(row => [...row]);
  const piece = nb[fr][fc];
  const type = piece[1];
  const color = piece[0];

  // En passant capture
  const ep = getEnPassant();
  if (type === 'P' && ep && tr === ep[0] && tc === ep[1]) {
    const dir = color === 'w' ? 1 : -1;
    nb[tr + dir][tc] = null;
  }

  // Castling rook move
  if (type === 'K') {
    if (tc - fc === 2) { nb[tr][5] = nb[tr][7]; nb[tr][7] = null; }
    if (fc - tc === 2) { nb[tr][3] = nb[tr][0]; nb[tr][0] = null; }
  }

  nb[tr][tc] = promo ? color + promo : piece;
  nb[fr][fc] = null;
  return nb;
}

// ─── CASTLING & EN PASSANT STATE ──────────────
// Stored in history stack
function getCastling() {
  if (history.length === 0) return { w: {K:true, Q:true}, b: {K:true, Q:true} };
  return history[history.length-1].castling;
}
function getEnPassant() {
  if (history.length === 0) return null;
  return history[history.length-1].enPassant;
}
function computeNewCastling(castling, piece, fr, fc) {
  const c = JSON.parse(JSON.stringify(castling));
  if (piece === 'wK') { c.w.K = false; c.w.Q = false; }
  if (piece === 'bK') { c.b.K = false; c.b.Q = false; }
  if (piece === 'wR' && fc === 7) c.w.K = false;
  if (piece === 'wR' && fc === 0) c.w.Q = false;
  if (piece === 'bR' && fc === 7) c.b.K = false;
  if (piece === 'bR' && fc === 0) c.b.Q = false;
  return c;
}
function computeEnPassant(piece, fr, fc, tr, tc) {
  if (piece[1] === 'P' && Math.abs(tr - fr) === 2) return [(fr+tr)>>1, fc];
  return null;
}

// ─── NOTATION ─────────────────────────────────
function toAN(fr, fc, tr, tc, piece, capture, promo, check) {
  const type = piece[1];
  const fc_s = FILES[fc], fr_s = 8 - fr;
  const tc_s = FILES[tc], tr_s = 8 - tr;
  // Castling
  if (type === 'K' && tc - fc === 2) return 'O-O' + check;
  if (type === 'K' && fc - tc === 2) return 'O-O-O' + check;
  const pLetter = type === 'P' ? '' : type;
  const capMark = capture ? 'x' : '';
  const fromFile = type === 'P' && capture ? fc_s : '';
  const promoStr = promo ? '='+promo : '';
  return pLetter + fromFile + capMark + tc_s + tr_s + promoStr + check;
}

// ─── MAIN MOVE HANDLER ────────────────────────
let pendingPromo = null;

function doMove(fr, fc, tr, tc, promoChoice) {
  const piece = board[fr][fc];
  const color = piece[0];
  const type  = piece[1];
  const captured = board[tr][tc];
  const ep = getEnPassant();
  let epCapture = null;
  if (type === 'P' && ep && tr === ep[0] && tc === ep[1]) {
    const dir = color === 'w' ? 1 : -1;
    epCapture = board[tr+dir][tc];
  }

  // Check promotion
  if (type === 'P' && (tr === 0 || tr === 7) && !promoChoice) {
    pendingPromo = [fr, fc, tr, tc];
    showPromotionModal(color);
    return;
  }

  const promo = promoChoice || null;
  const castling = getCastling();
  const newCastling = computeNewCastling(castling, piece, fr, fc);
  const newEP = computeEnPassant(piece, fr, fc, tr, tc);
  const newBoard = applyMove(board, fr, fc, tr, tc, promo);

  // Determine check/checkmate notation
  const opp = color === 'w' ? 'b' : 'w';
  const inCheck = isInCheck(newBoard, opp);
  const hasMoves = getAllLegalMoves(newBoard, opp).length > 0;
  const checkStr = inCheck ? (hasMoves ? '+' : '#') : '';

  const capturedPiece = captured || epCapture;
  const notation = toAN(fr, fc, tr, tc, piece, !!capturedPiece, promo, checkStr);

  history.push({
    board: board.map(r=>[...r]),
    turn, castling: newCastling, enPassant: newEP,
    notation, captured: capturedPiece
  });

  if (capturedPiece) {
    if (color === 'w') capturedByWhite.push(capturedPiece);
    else capturedByBlack.push(capturedPiece);
  }

  board = newBoard;
  turn = opp;
  selected = null;
  legalMoves = [];

  addMoveLog(notation, color);
  render();
  updateCapturedDisplay();

  // Check game over
  if (!hasMoves) {
    if (inCheck) endGame(color === 'w' ? 'White wins by checkmate!' : 'Black wins by checkmate!', '♛');
    else endGame("Stalemate — It's a draw!", '🤝');
    return;
  }

  // Insufficient material
  if (isInsufficientMaterial(board)) { endGame("Draw — Insufficient material", '🤝'); return; }

  updateStatus();
  highlightKingCheck();

  // AI turn
  if (gameMode === 'pve' && turn === 'b' && !gameOver) {
    setTimeout(aiMove, 400);
  }
}

function getAllLegalMoves(b, color) {
  const moves = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++)
    if (b[r][c]?.[0] === color) {
      const m = getLegalMoves(b, r, c);
      m.forEach(([tr,tc]) => moves.push({fr:r, fc:c, tr, tc}));
    }
  return moves;
}

function isInsufficientMaterial(b) {
  const pieces = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (b[r][c]) pieces.push(b[r][c]);
  if (pieces.length === 2) return true; // KK
  if (pieces.length === 3 && pieces.some(p => p[1]==='B' || p[1]==='N')) return true;
  return false;
}

// ─── AI ───────────────────────────────────────
function evaluateBoard(b) {
  let score = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = b[r][c];
    if (!p) continue;
    const color = p[0], type = p[1];
    const val = PIECE_VALUES[type];
    const pstIdx = color === 'w' ? r * 8 + c : (7-r) * 8 + c;
    const pst = PST[type]?.[pstIdx] || 0;
    score += color === 'w' ? (val + pst) : -(val + pst);
  }
  return score;
}

function minimax(b, depth, alpha, beta, maximizing, castling, ep) {
  const color = maximizing ? 'w' : 'b';
  const moves = getAllLegalMoves(b, color);

  if (depth === 0 || moves.length === 0) {
    if (moves.length === 0 && isInCheck(b, color)) return maximizing ? -99999 : 99999;
    return evaluateBoard(b);
  }

  if (maximizing) {
    let max = -Infinity;
    for (const {fr,fc,tr,tc} of moves) {
      const nb = applyMove(b, fr, fc, tr, tc);
      const newCastling = computeNewCastling(castling, b[fr][fc], fr, fc);
      const newEP = computeEnPassant(b[fr][fc], fr, fc, tr, tc);
      const val = minimax(nb, depth-1, alpha, beta, false, newCastling, newEP);
      max = Math.max(max, val);
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break;
    }
    return max;
  } else {
    let min = Infinity;
    for (const {fr,fc,tr,tc} of moves) {
      const nb = applyMove(b, fr, fc, tr, tc);
      const newCastling = computeNewCastling(castling, b[fr][fc], fr, fc);
      const newEP = computeEnPassant(b[fr][fc], fr, fc, tr, tc);
      const val = minimax(nb, depth-1, alpha, beta, true, newCastling, newEP);
      min = Math.min(min, val);
      beta = Math.min(beta, val);
      if (beta <= alpha) break;
    }
    return min;
  }
}

function aiMove() {
  if (gameOver || turn !== 'b') return;
  const moves = getAllLegalMoves(board, 'b');
  if (!moves.length) return;

  let best = null, bestVal = Infinity;
  const castling = getCastling();
  const ep = getEnPassant();

  // Shuffle for variety at equal scores
  moves.sort(() => Math.random() - 0.5);

  for (const m of moves) {
    const nb = applyMove(board, m.fr, m.fc, m.tr, m.tc);
    const newCastling = computeNewCastling(castling, board[m.fr][m.fc], m.fr, m.fc);
    const newEP = computeEnPassant(board[m.fr][m.fc], m.fr, m.fc, m.tr, m.tc);
    const val = minimax(nb, aiDepth-1, -Infinity, Infinity, true, newCastling, newEP);
    if (val < bestVal) { bestVal = val; best = m; }
  }

  if (best) {
    // Handle AI promotion — always queen
    const piece = board[best.fr][best.fc];
    const promo = (piece === 'bP' && best.tr === 7) ? 'Q' : null;
    doMove(best.fr, best.fc, best.tr, best.tc, promo);
  }
}

// ─── UI ───────────────────────────────────────
function render() {
  const boardEl = document.getElementById('chessboard');
  boardEl.innerHTML = '';

  const [lastFrom, lastTo] = getLastMoveSquares();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const vr = flipped ? 7-r : r;
      const vc = flipped ? 7-c : c;
      const sq = document.createElement('div');
      sq.className = 'square ' + ((vr+vc)%2===0 ? 'light' : 'dark');
      sq.dataset.r = vr;
      sq.dataset.c = vc;

      if (lastFrom && lastFrom[0]===vr && lastFrom[1]===vc) sq.classList.add('last-move');
      if (lastTo   && lastTo[0]===vr   && lastTo[1]===vc)   sq.classList.add('last-move');
      if (selected && selected[0]===vr && selected[1]===vc) sq.classList.add('selected');

      const isLegal = legalMoves.some(([lr,lc]) => lr===vr && lc===vc);
      if (isLegal) {
        if (board[vr][vc]) sq.classList.add('legal-capture');
        else sq.classList.add('legal-move');
      }

      const piece = board[vr][vc];
      if (piece) {
        const span = document.createElement('span');
        span.className = 'piece';
        span.textContent = PIECES[piece];
        sq.appendChild(span);
      }

      sq.addEventListener('click', () => onSquareClick(vr, vc));
      boardEl.appendChild(sq);
    }
  }
  renderLabels();
}

function renderLabels() {
  const ranks = document.getElementById('rankLabels');
  const files = document.getElementById('fileLabels');
  ranks.innerHTML = '';
  files.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const r = document.createElement('span');
    r.textContent = flipped ? i+1 : 8-i;
    ranks.appendChild(r);
    const f = document.createElement('span');
    f.textContent = FILES[flipped ? 7-i : i];
    files.appendChild(f);
  }
}

function onSquareClick(r, c) {
  if (gameOver) return;
  if (gameMode === 'pve' && turn === 'b') return;

  const piece = board[r][c];

  if (selected) {
    const isLegal = legalMoves.some(([lr,lc]) => lr===r && lc===c);
    if (isLegal) {
      doMove(selected[0], selected[1], r, c);
      return;
    }
  }

  if (piece && piece[0] === turn) {
    selected = [r, c];
    legalMoves = getLegalMoves(board, r, c);
  } else {
    selected = null;
    legalMoves = [];
  }
  render();
}

function getLastMoveSquares() {
  if (!history.length) return [null, null];
  const last = history[history.length-1];
  // We don't store fr/fc/tr/tc in history, so we compare boards
  return [null, null]; // simplified — last-move highlighting omitted for brevity
}

function highlightKingCheck() {
  if (isInCheck(board, turn)) {
    const boardEl = document.getElementById('chessboard');
    const squares = boardEl.querySelectorAll('.square');
    squares.forEach(sq => {
      const r = +sq.dataset.r, c = +sq.dataset.c;
      if (board[r][c] === turn+'K') sq.classList.add('in-check');
    });
  }
}

function addMoveLog(notation, color) {
  const log = document.getElementById('moveLog');
  const n = Math.ceil(history.length / 2);

  if (color === 'w') {
    const entry = document.createElement('div');
    entry.className = 'move-entry';
    entry.innerHTML = `<span class="move-num">${n}.</span><span class="move-w">${notation}</span><span class="move-b"></span>`;
    entry.dataset.moveNum = n;
    log.appendChild(entry);
  } else {
    const entries = log.querySelectorAll('.move-entry');
    const last = entries[entries.length-1];
    if (last && +last.dataset.moveNum === n) {
      last.querySelector('.move-b').textContent = notation;
    }
  }
  log.scrollTop = log.scrollHeight;
}

function updateStatus() {
  const msg = document.getElementById('statusMsg');
  const inCheck = isInCheck(board, turn);
  const turnName = turn === 'w' ? 'White' : 'Black';
  msg.textContent = inCheck ? `${turnName} is in check!` : `${turnName}'s turn`;

  document.getElementById('whitePlayer').classList.toggle('active-turn', turn==='w');
  document.getElementById('blackPlayer').classList.toggle('active-turn', turn==='b');
}

function updateCapturedDisplay() {
  document.getElementById('capturedByWhite').textContent =
    capturedByWhite.map(p => PIECES[p]).join('');
  document.getElementById('capturedByBlack').textContent =
    capturedByBlack.map(p => PIECES[p]).join('');
}

function showPromotionModal(color) {
  const modal = document.getElementById('promotionModal');
  const choices = document.getElementById('promoChoices');
  choices.innerHTML = '';
  ['Q','R','B','N'].forEach(type => {
    const btn = document.createElement('button');
    btn.className = 'promo-btn';
    btn.textContent = PIECES[color+type];
    btn.onclick = () => {
      modal.classList.add('hidden');
      if (pendingPromo) {
        const [fr,fc,tr,tc] = pendingPromo;
        pendingPromo = null;
        doMove(fr, fc, tr, tc, type);
      }
    };
    choices.appendChild(btn);
  });
  modal.classList.remove('hidden');
}

function endGame(msg, icon) {
  gameOver = true;
  clearInterval(timerInterval);
  document.getElementById('gameOverTitle').textContent = msg;
  document.getElementById('gameOverMsg').textContent = `${history.length} moves played`;
  document.querySelector('.game-over-icon').textContent = icon;
  document.getElementById('gameOverModal').classList.remove('hidden');
}

// ─── TIMER ────────────────────────────────────
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (gameOver) { clearInterval(timerInterval); return; }
    timers[turn]--;
    updateTimerDisplay();
    if (timers[turn] <= 0) {
      endGame(turn === 'w' ? 'Black wins on time!' : 'White wins on time!', '⏱');
    }
  }, 1000);
}

function updateTimerDisplay() {
  ['w','b'].forEach(color => {
    const el = document.getElementById(color==='w'?'whiteTimer':'blackTimer');
    const t = timers[color];
    const m = Math.floor(t/60), s = t%60;
    el.textContent = `${m}:${s.toString().padStart(2,'0')}`;
    el.classList.toggle('low', t < 30);
  });
}

// ─── NEW GAME ─────────────────────────────────
function newGame() {
  initBoard();
  turn = 'w';
  selected = null;
  legalMoves = [];
  history = [{ board: board.map(r=>[...r]), turn:'w', castling:{w:{K:true,Q:true},b:{K:true,Q:true}}, enPassant:null, notation:'', captured:null }];
  capturedByWhite = [];
  capturedByBlack = [];
  gameOver = false;
  moveLog = [];
  pendingPromo = null;
  timers = { w: 600, b: 600 };

  document.getElementById('moveLog').innerHTML = '';
  document.getElementById('gameOverModal').classList.add('hidden');
  document.getElementById('promotionModal').classList.add('hidden');
  document.getElementById('capturedByWhite').textContent = '';
  document.getElementById('capturedByBlack').textContent = '';
  document.getElementById('whitePlayer').classList.add('active-turn');
  document.getElementById('blackPlayer').classList.remove('active-turn');

  updateTimerDisplay();
  render();
  updateStatus();
  startTimer();
}

// ─── EVENT LISTENERS ─────────────────────────
document.getElementById('newGameBtn').addEventListener('click', newGame);
document.getElementById('playAgainBtn').addEventListener('click', newGame);

document.getElementById('undoBtn').addEventListener('click', () => {
  if (gameOver) return;
  const steps = gameMode === 'pve' ? 2 : 1;
  for (let i = 0; i < steps && history.length > 1; i++) {
    const last = history.pop();
    if (last.captured) {
      const arr = turn === 'w' ? capturedByBlack : capturedByWhite;
      const idx = arr.lastIndexOf(last.captured);
      if (idx > -1) arr.splice(idx, 1);
    }
    turn = turn === 'w' ? 'b' : 'w';
  }
  board = history[history.length-1].board.map(r=>[...r]);
  selected = null; legalMoves = [];

  const log = document.getElementById('moveLog');
  const entries = log.querySelectorAll('.move-entry');
  if (steps === 2) { entries[entries.length-1]?.remove(); }
  else {
    const last = entries[entries.length-1];
    if (last) {
      if (turn === 'w') last.remove();
      else last.querySelector('.move-b').textContent = '';
    }
  }

  updateCapturedDisplay();
  render();
  updateStatus();
});

document.getElementById('flipBtn').addEventListener('click', () => { flipped = !flipped; render(); });

document.getElementById('resignBtn').addEventListener('click', () => {
  if (gameOver) return;
  endGame(turn === 'w' ? 'Black wins — White resigned' : 'White wins — Black resigned', '⚑');
});

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gameMode = btn.dataset.mode;
    document.getElementById('difficultyWrap').style.display = gameMode === 'pve' ? 'block' : 'none';
    newGame();
  });
});

document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    aiDepth = +btn.dataset.depth;
    newGame();
  });
});

// ─── INIT ─────────────────────────────────────
newGame();
