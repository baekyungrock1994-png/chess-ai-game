import { Chess } from 'chess.js';

// 기본 Piece-Square Tables (White 기준, Black은 상하반전 적용)
const PST_PAWN = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const PST_KNIGHT = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const PST_BISHOP = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const PST_ROOK = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
];

const PST_QUEEN = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const PST_KING_MID = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
];

const PST_KING_END = [
  -50,-40,-30,-20,-20,-30,-40,-50,
  -30,-20,-10,  0,  0,-10,-20,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-30,  0,  0,  0,  0,-30,-30,
  -50,-30,-30,-30,-30,-30,-30,-50
];

// 게임 단계(Phase) 판별
export function getGamePhase(game) {
  const moveCount = game.history().length;
  // 남은 주요 기물 점수 계산 (퀸=9, 룩=5, 나이트/비숍=3)
  const board = game.board();
  let majorMaterial = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type !== 'p' && piece.type !== 'k') {
        if (piece.type === 'q') majorMaterial += 9;
        else if (piece.type === 'r') majorMaterial += 5;
        else majorMaterial += 3;
      }
    }
  }

  if (moveCount <= 16 && majorMaterial >= 26) {
    return 'opening';
  } else if (majorMaterial <= 14 || moveCount >= 50) {
    return 'endgame';
  } else {
    return 'middlegame';
  }
}

// 스퀘어 인덱스 변환 ('e4' -> 0~63)
function squareToIndex(square) {
  const file = square.charCodeAt(0) - 97; // a-h -> 0-7
  const rank = 8 - parseInt(square[1], 10); // 8-1 -> 0-7
  return rank * 8 + file;
}

// 보드 평가 함수 (지정된 AI 관점에서 채점)
export function evaluateBoard(game, botConfig, color) {
  if (game.isCheckmate()) {
    return game.turn() === color ? -999999 : 999999;
  }
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
    return 0;
  }

  const board = game.board();
  const currentPhase = getGamePhase(game);
  const isWhite = color === 'w';

  // 기물 가중치 가져오기
  const pieceWeights = {
    p: botConfig.pieceSettings?.pawn?.weight || 100,
    n: botConfig.pieceSettings?.knight?.weight || 320,
    b: botConfig.pieceSettings?.bishop?.weight || 330,
    r: botConfig.pieceSettings?.rook?.weight || 500,
    q: botConfig.pieceSettings?.queen?.weight || 950,
    k: 20000
  };

  // 100포인트 스탯 계수 (기본 1.0)
  const stats = botConfig.stats || { attack: 25, defense: 25, control: 25, mobility: 25 };
  const attackBonus = (stats.attack - 25) * 1.5;
  const defenseBonus = (stats.defense - 25) * 1.5;
  const controlBonus = (stats.control - 25) * 1.5;
  const mobilityBonus = (stats.mobility - 25) * 1.5;

  let myScore = 0;
  let opponentScore = 0;
  let centerControlCount = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const isMyPiece = piece.color === color;
      const baseValue = pieceWeights[piece.type] || 100;
      let posValue = 0;

      // PST 위치 평가 인덱스 계산 (화이트는 원래대로, 블랙은 상하 반전)
      const sqIndex = piece.color === 'w' ? r * 8 + c : (7 - r) * 8 + c;

      if (piece.type === 'p') posValue = PST_PAWN[sqIndex];
      else if (piece.type === 'n') posValue = PST_KNIGHT[sqIndex];
      else if (piece.type === 'b') posValue = PST_BISHOP[sqIndex];
      else if (piece.type === 'r') posValue = PST_ROOK[sqIndex];
      else if (piece.type === 'q') posValue = PST_QUEEN[sqIndex];
      else if (piece.type === 'k') {
        posValue = currentPhase === 'endgame' ? PST_KING_END[sqIndex] : PST_KING_MID[sqIndex];
      }

      // 중앙 4칸(d4, d5, e4, e5) 가산점
      if ((r === 3 || r === 4) && (c === 3 || c === 4)) {
        if (isMyPiece) {
          centerControlCount++;
          posValue += 25 + controlBonus;
        }
      }

      // 기물별 공격성 반영
      const pSetting = botConfig.pieceSettings?.[getPieceKey(piece.type)];
      if (pSetting && isMyPiece) {
        const aggr = pSetting.aggression || 50;
        // 폰과 전진 기물에 대해 상대 진영 쪽으로 나아갈수록 추가 점수
        const forwardProgress = piece.color === 'w' ? (7 - r) : r;
        posValue += (forwardProgress * (aggr - 50) * 0.4);
      }

      const totalPieceVal = baseValue + posValue;
      if (isMyPiece) {
        myScore += totalPieceVal;
      } else {
        opponentScore += totalPieceVal;
      }
    }
  }

  // 기동성(Mobility) 점수 반영
  const currentLegalMoves = game.moves().length;
  if (game.turn() === color) {
    myScore += currentLegalMoves * (4 + mobilityBonus * 0.1);
  } else {
    opponentScore += currentLegalMoves * 4;
  }

  // 페이즈별 특수 전략 보너스
  if (currentPhase === 'opening') {
    const opGoal = botConfig.phases?.opening?.primaryGoal;
    if (opGoal === 'center_control') {
      myScore += centerControlCount * 30;
    } else if (opGoal === 'king_safety') {
      // 캐슬링 여부 체크
      const history = game.history();
      if (history.includes('O-O') || history.includes('O-O-O')) {
        myScore += 80 + defenseBonus;
      }
    }
  } else if (currentPhase === 'middlegame') {
    const midStrat = botConfig.phases?.middlegame?.strategy;
    if (midStrat === 'tactical_assault') {
      myScore += attackBonus * 2;
      if (game.inCheck()) {
        if (game.turn() !== color) myScore += 45; // 상대에게 체크 건 상태
      }
    }
  } else if (currentPhase === 'endgame') {
    const endPlan = botConfig.phases?.endgame?.victoryPlan;
    if (endPlan === 'speed_mate') {
      myScore += attackBonus * 3;
    }
  }

  // 시그니처 전술 보너스
  if (botConfig.signatureTactic === 'iron_fortress') {
    myScore += defenseBonus * 1.5;
  } else if (botConfig.signatureTactic === 'pawn_storm') {
    // 전진된 폰 보너스
    myScore += 20;
  }

  return myScore - opponentScore;
}

function getPieceKey(type) {
  switch (type) {
    case 'p': return 'pawn';
    case 'n': return 'knight';
    case 'b': return 'bishop';
    case 'r': return 'rook';
    case 'q': return 'queen';
    case 'k': return 'king';
    default: return 'pawn';
  }
}

// Alpha-Beta Minimax 탐색
function minimax(game, depth, alpha, beta, isMaximizing, botConfig, color) {
  if (depth === 0 || game.isGameOver()) {
    return { score: evaluateBoard(game, botConfig, color) };
  }

  const moves = game.moves({ verbose: true });
  // 탐색 효율을 위한 수 정렬 (캡처/체크 수 우선 탐색)
  moves.sort((a, b) => {
    let scoreA = (a.captured ? 10 : 0) + (a.san.includes('+') ? 5 : 0);
    let scoreB = (b.captured ? 10 : 0) + (b.san.includes('+') ? 5 : 0);
    return scoreB - scoreA;
  });

  let bestMove = null;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, false, botConfig, color).score;
      game.undo();

      if (evaluation > maxEval) {
        maxEval = evaluation;
        bestMove = move;
      }
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, true, botConfig, color).score;
      game.undo();

      if (evaluation < minEval) {
        minEval = evaluation;
        bestMove = move;
      }
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return { score: minEval, move: bestMove };
  }
}

// AI의 최적 수 계산 및 의사결정 이유(Reasoning) 생성
export function getBestMove(game, botConfig, depth = 2) {
  const color = game.turn();
  const legalMoves = game.moves({ verbose: true });

  if (legalMoves.length === 0) return null;

  // 리스크 허용도(Gambit/Blunder 허용) 반영
  const risk = botConfig.riskTolerance || 40;
  // 가끔씩 학생의 리스크 설정에 따라 2순위 공격수를 과감하게 두는 모험 시도
  const takeRiskChance = Math.random() * 100 < (risk * 0.25);

  const result = minimax(game, depth, -Infinity, Infinity, true, botConfig, color);
  let chosenMove = result.move || legalMoves[Math.floor(Math.random() * legalMoves.length)];

  if (takeRiskChance && legalMoves.length > 1) {
    // 공격적인 캡처나 체크 수가 있다면 과감하게 선택
    const aggressiveMoves = legalMoves.filter(m => m.captured || m.san.includes('+'));
    if (aggressiveMoves.length > 0) {
      chosenMove = aggressiveMoves[Math.floor(Math.random() * aggressiveMoves.length)];
    }
  }

  // 수 선택 이유 및 해설 생성
  const reasoning = generateMoveReasoning(chosenMove, game, botConfig, color);

  return {
    move: chosenMove,
    evalScore: result.score,
    reasoning
  };
}

// AI가 이 수를 선택한 교육적 이유 설명 생성기
function generateMoveReasoning(move, game, botConfig, color) {
  if (!move) return { text: '가능한 최선의 수를 두었습니다.', tag: '일반' };

  const currentPhase = getGamePhase(game);
  const pieceKey = getPieceKey(move.piece);
  const pieceName = botConfig.pieceSettings?.[pieceKey]?.label || move.piece.toUpperCase();
  const pieceSetting = botConfig.pieceSettings?.[pieceKey];
  const role = pieceSetting?.role || '';
  const aggression = pieceSetting?.aggression || 50;

  let explanation = '';
  let tag = '전략';

  if (move.san === 'O-O' || move.san === 'O-O-O') {
    tag = '킹 안전';
    explanation = `안전 제일 원칙에 따라 캐슬링을 진행하여 킹을 숨기고 룩을 전투에 참여시킵니다.`;
  } else if (move.captured) {
    tag = '기물 포획';
    const capturedName = getPieceKey(move.captured);
    if (aggression > 70) {
      explanation = `${pieceName}의 높은 공격 성향(${aggression}점)에 따라 상대의 ${capturedName} 기물을 과감하게 포획했습니다!`;
    } else {
      explanation = `계산된 교환 이득을 보고 상대의 ${capturedName} 기물을 잡았습니다.`;
    }
  } else if (move.san.includes('+')) {
    tag = '체크 위협';
    explanation = `${botConfig.phases?.middlegame?.prompt ? '미들게임 지침에 따라 ' : ''}상대 킹을 직접 조준하여 체크로 압박을 가했습니다.`;
  } else if (currentPhase === 'opening') {
    tag = '초반 전개';
    if (move.to === 'd4' || move.to === 'e4' || move.to === 'd5' || move.to === 'e5') {
      explanation = `오프닝 전략 '${botConfig.phases?.opening?.primaryGoal || '중앙 장악'}' 지침에 맞춰 중앙 핵심 칸(${move.to})을 점령했습니다.`;
    } else if (move.piece === 'n' || move.piece === 'b') {
      explanation = `${pieceName} (${role})의 신속한 전개 원칙에 따라 ${move.to} 칸으로 기물을 전개했습니다.`;
    } else {
      explanation = `초반 진형 구축을 위해 ${pieceName}을(를) ${move.to} 위치로 이동시켰습니다.`;
    }
  } else if (currentPhase === 'endgame') {
    tag = '엔드게임';
    if (move.piece === 'p') {
      explanation = `엔드게임 목표('${botConfig.phases?.endgame?.victoryPlan || '승급'}')에 따라 폰을 승급선(${move.to})으로 한 발 더 밀어 올렸습니다.`;
    } else if (move.piece === 'k') {
      explanation = `엔드게임 원칙에 따라 킹을 능동적으로 전진시켜 판세를 장악합니다.`;
    } else {
      explanation = `남은 국면을 정리하고 체크메이트 각을 좁히기 위해 ${pieceName}을(를) 재배치했습니다.`;
    }
  } else {
    tag = '포지션 압박';
    explanation = `${pieceName}의 역할을 수행하며 ${move.to} 칸에서 최적의 활동성과 기동성을 확보했습니다.`;
  }

  // 시그니처 전술 연계 언급
  if (botConfig.signatureTactic === 'fork_master' && move.piece === 'n') {
    explanation += ' (시그니처: 나이트 포크 사냥 우선순위 반영)';
  } else if (botConfig.signatureTactic === 'queen_battery' && (move.piece === 'q' || move.piece === 'r')) {
    explanation += ' (시그니처: 퀸-룩 관통 배터리 구축 시도)';
  }

  return { text: explanation, tag };
}
