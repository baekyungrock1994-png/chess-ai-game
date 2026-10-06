import React from 'react';

// 고품질 체스 기물 SVG 렌더러
export function ChessPieceIcon({ type, color, size = 48 }) {
  const isWhite = color === 'w';
  const fill = isWhite ? '#FFFFFF' : '#1A1D20';
  const stroke = isWhite ? '#2C3E50' : '#E2E8F0';
  const accent = isWhite ? '#E2E8F0' : '#4A5568';

  // 클래식 체스 SVG 경로
  const renderPath = () => {
    switch (type) {
      case 'p': // Pawn
        return (
          <g>
            <path
              d="M22 9c-2.2 0-4 1.8-4 4 0 1.2.5 2.2 1.3 3-1.6 1.3-2.3 3.4-2.3 5.5 0 2.2 1.1 4.1 2.8 5.2-.8.5-1.5 1.1-2.1 1.8-2 2.2-2.7 5.5-2.7 8.5h18c0-3-.7-6.3-2.7-8.5-.6-.7-1.3-1.3-2.1-1.8 1.7-1.1 2.8-3 2.8-5.2 0-2.1-.7-4.2-2.3-5.5.8-.8 1.3-1.8 1.3-3 0-2.2-1.8-4-4-4-1 0-2 .4-2.7 1.1-.7-.7-1.7-1.1-2.7-1.1z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
            />
            <path d="M16 33h12" stroke={stroke} strokeWidth="1.5" />
          </g>
        );
      case 'n': // Knight
        return (
          <g>
            <path
              d="M22 10c-3 0-5 2-6 5-1 3-1 6-3 8-1 1-2 2-2 4 0 2 1.5 3 3 3 1 0 2-.5 3-1 1 2 2 3 4 3 2 0 3-1 4-3 1.5.8 3 1 4 1 2 0 3.5-1 4-3 0-3-2-6-4-8-1-1-1-3-1-5 0-3-2-5-5-5z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
            />
            <circle cx="18" cy="16" r="1.5" fill={stroke} />
            <path d="M14 33h16" stroke={stroke} strokeWidth="1.5" />
          </g>
        );
      case 'b': // Bishop
        return (
          <g>
            <path
              d="M22 8c-1.5 0-2.5 1-2.5 2.5 0 .5.2 1 .5 1.5-2 1.5-3 4-3 7 0 3 1.5 5.5 3.5 7-1 .8-2 2-2.5 3.5h11c-.5-1.5-1.5-2.7-2.5-3.5 2-1.5 3.5-4 3.5-7 0-3-1-5.5-3-7 .3-.5.5-1 .5-1.5 0-1.5-1-2.5-2.5-2.5z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
            />
            <circle cx="22" cy="7" r="1.5" fill={accent} stroke={stroke} />
            <path d="M22 14v6M19 17h6" stroke={stroke} strokeWidth="1.2" />
            <path d="M15 33h14" stroke={stroke} strokeWidth="1.5" />
          </g>
        );
      case 'r': // Rook
        return (
          <g>
            <path
              d="M14 12h3v3h4v-3h4v3h4v-3h3v6c0 2-1 3.5-2 4.5v6.5h3v4H13v-4h3V22.5c-1-1-2-2.5-2-4.5v-6z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
            />
            <path d="M16 26h12" stroke={stroke} strokeWidth="1.2" />
          </g>
        );
      case 'q': // Queen
        return (
          <g>
            <path
              d="M12 14l3 10h14l3-10-5 5-5-8-5 8-5-5z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
            />
            <path
              d="M15 24h14v5c0 1.5-1 2.5-2.5 2.5h-9c-1.5 0-2.5-1-2.5-2.5v-5z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
            />
            <circle cx="12" cy="13" r="1.5" fill={accent} stroke={stroke} />
            <circle cx="17" cy="11" r="1.5" fill={accent} stroke={stroke} />
            <circle cx="22" cy="10" r="1.5" fill={accent} stroke={stroke} />
            <circle cx="27" cy="11" r="1.5" fill={accent} stroke={stroke} />
            <circle cx="32" cy="13" r="1.5" fill={accent} stroke={stroke} />
            <path d="M14 33h16" stroke={stroke} strokeWidth="1.5" />
          </g>
        );
      case 'k': // King
        return (
          <g>
            <path d="M22 7v5M19.5 9.5h5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
            <path
              d="M15 15c0-1.5 1-2.5 2.5-2.5h9c1.5 0 2.5 1 2.5 2.5 0 3-1.5 5.5-3.5 7v4.5h2v3h-13v-3h2V22c-2-1.5-3.5-4-3.5-7z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
            />
            <path d="M17 19h10" stroke={stroke} strokeWidth="1.2" />
            <path d="M14 33h16" stroke={stroke} strokeWidth="1.5" />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="6 4 32 32"
      className="chess-piece-svg"
      style={{ filter: isWhite ? 'drop-shadow(0 2px 3px rgba(0,0,0,0.45))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}
    >
      {renderPath()}
    </svg>
  );
}

export default function ChessBoard({
  game,
  onSquareClick,
  selectedSquare,
  validMoves = [],
  lastMove = null,
  orientation = 'w',
  isThinking = false
}) {
  const board = game ? game.board() : [];
  const inCheck = game && game.inCheck();
  const currentTurn = game ? game.turn() : 'w';

  // 랭크와 파일 생성
  const ranks = orientation === 'w' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const files = orientation === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  const getSquareName = (r, f) => {
    const fileChar = String.fromCharCode(97 + f);
    const rankNum = 8 - r;
    return `${fileChar}${rankNum}`;
  };

  return (
    <div className="chess-board-wrapper">
      <div className="chess-board-frame">
        <div className="chess-board-grid">
          {ranks.map((r) =>
            files.map((f) => {
              const squareName = getSquareName(r, f);
              const piece = board[r]?.[f];
              const isDark = (r + f) % 2 === 1;
              const isSelected = selectedSquare === squareName;
              const isValidTarget = validMoves.includes(squareName);
              const isLastMoveFrom = lastMove?.from === squareName;
              const isLastMoveTo = lastMove?.to === squareName;
              const isCheckSquare = inCheck && piece?.type === 'k' && piece?.color === currentTurn;

              return (
                <div
                  key={squareName}
                  className={`board-square ${isDark ? 'square-dark' : 'square-light'} ${
                    isSelected ? 'square-selected' : ''
                  } ${isLastMoveFrom || isLastMoveTo ? 'square-last-move' : ''} ${
                    isCheckSquare ? 'square-check' : ''
                  }`}
                  onClick={() => onSquareClick && onSquareClick(squareName)}
                  data-square={squareName}
                >
                  {/* 좌표 표시 (외곽 칸) */}
                  {((orientation === 'w' && f === 0) || (orientation === 'b' && f === 7)) && (
                    <span className="coord-rank">{8 - r}</span>
                  )}
                  {((orientation === 'w' && r === 7) || (orientation === 'b' && r === 0)) && (
                    <span className="coord-file">{String.fromCharCode(97 + f)}</span>
                  )}

                  {/* 유효 이동 목적지 인디케이터 */}
                  {isValidTarget && (
                    <div className={`move-indicator ${piece ? 'capture-ring' : 'dot-marker'}`} />
                  )}

                  {/* 기물 아이콘 */}
                  {piece && (
                    <div className={`piece-wrapper ${piece.color === 'w' ? 'piece-w' : 'piece-b'}`}>
                      <ChessPieceIcon type={piece.type} color={piece.color} size={42} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {isThinking && (
        <div className="board-thinking-overlay">
          <div className="thinking-pulse-dot"></div>
          <span>AI 수읽기 계산 중...</span>
        </div>
      )}
    </div>
  );
}
