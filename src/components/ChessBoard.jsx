import React from 'react';

// Chess.com / Lichess 표준 Cburnett 고해상도 벡터 체스 기물
export function ChessPieceIcon({ type, color, size = 48 }) {
  const isWhite = color === 'w';

  // White 기물: 깨끗한 흰색 바디(#FFFFFF) + 또렷한 검은색 윤곽선(#000000)
  // Black 기물: Chess.com 특유의 차콜 블랙 바디(#262421 / #222) + 선명한 검은색 스트로크 + 밝은 내부 디테일 라인
  const renderPiece = () => {
    if (isWhite) {
      switch (type) {
        case 'p': // White Pawn
          return (
            <g fill="#FFFFFF" stroke="#000000" strokeWidth="1.5" strokeLinecap="round">
              <path d="M 22.5,9 C 20.29,9 18.5,10.79 18.5,13 C 18.5,13.89 18.79,14.71 19.28,15.38 C 17.33,16.5 16,18.59 16,21 C 16,23.03 16.94,24.84 18.41,26.03 C 15.41,27.09 11,31.58 11,39.5 L 34,39.5 C 34,31.58 29.59,27.09 26.59,26.03 C 28.06,24.84 29,23.03 29,21 C 29,18.59 27.67,16.5 25.72,15.38 C 26.21,14.71 26.5,13.89 26.5,13 C 26.5,10.79 24.71,9 22.5,9 z" />
            </g>
          );
        case 'n': // White Knight
          return (
            <g fill="#FFFFFF" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
              <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10 z" />
              <circle cx="9.5" cy="25.5" r="1" fill="#000000" stroke="none" />
              <path d="M 15,15.5 A 0.5,1.5 0 1 1 14,15.5 A 0.5,1.5 0 1 1 15,15.5 z" fill="#000000" stroke="none" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" />
            </g>
          );
        case 'b': // White Bishop
          return (
            <g fill="#FFFFFF" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z" />
              <path d="M 12,36 C 12.27,34.81 12.29,33.15 13,30 C 14,24.5 20,20.5 20,13 C 20,8.5 17.5,7.5 17.5,7.5 C 17.5,7.5 20.5,6.5 22.5,10 C 24.5,6.5 27.5,7.5 27.5,7.5 C 27.5,7.5 25,8.5 25,13 C 25,20.5 31,24.5 32,30 C 32.71,33.15 32.73,34.81 33,36" />
              <circle cx="22.5" cy="5" r="1.75" />
              <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" stroke="#000000" strokeWidth="1.2" />
            </g>
          );
        case 'r': // White Rook
          return (
            <g fill="#FFFFFF" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 9,39 L 36,39 L 36,36 L 9,36 z" />
              <path d="M 12,36 L 12,32 L 33,32 L 33,36 z" />
              <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 z" />
              <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
              <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
              <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
              <path d="M 11,14 L 34,14" />
            </g>
          );
        case 'q': // White Queen
          return (
            <g fill="#FFFFFF" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.5 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.5 L 14,25 L 6.5,13.5 z" />
              <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26" />
              <circle cx="6" cy="12" r="2" />
              <circle cx="14" cy="9" r="2" />
              <circle cx="22.5" cy="8" r="2" />
              <circle cx="31" cy="9" r="2" />
              <circle cx="39" cy="12" r="2" />
              <path d="M 11.5,30 C 15,29 30,29 33.5,30 M 12,33.5 C 18,32.5 27,32.5 33,33.5" fill="none" stroke="#000000" strokeWidth="1.2" />
            </g>
          );
        case 'k': // White King
          return (
            <g fill="#FFFFFF" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 22.5,11.5 L 22.5,6 M 20,8 L 25,8" stroke="#000000" strokeWidth="1.8" />
              <path d="M 9,26 C 17.5,27 30,27 36,26 L 38.5,14.5 C 35,16.5 31,18.5 31,24 C 29,19 25,18 22.5,21.5 C 20,18 16,19 14,24 C 14,18.5 10,16.5 6.5,14.5 z" />
              <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26" />
              <circle cx="22.5" cy="15.5" r="3.5" />
              <path d="M 11.5,30 C 15,29 30,29 33.5,30 M 12,33.5 C 18,32.5 27,32.5 33,33.5" fill="none" stroke="#000000" strokeWidth="1.2" />
            </g>
          );
        default:
          return null;
      }
    } else {
      // Black 기물 (어둡고 또렷한 형태)
      switch (type) {
        case 'p': // Black Pawn
          return (
            <g fill="#262421" stroke="#000000" strokeWidth="1.5" strokeLinecap="round">
              <path d="M 22.5,9 C 20.29,9 18.5,10.79 18.5,13 C 18.5,13.89 18.79,14.71 19.28,15.38 C 17.33,16.5 16,18.59 16,21 C 16,23.03 16.94,24.84 18.41,26.03 C 15.41,27.09 11,31.58 11,39.5 L 34,39.5 C 34,31.58 29.59,27.09 26.59,26.03 C 28.06,24.84 29,23.03 29,21 C 29,18.59 27.67,16.5 25.72,15.38 C 26.21,14.71 26.5,13.89 26.5,13 C 26.5,10.79 24.71,9 22.5,9 z" />
              <path d="M 16,21 C 18.5,23 26.5,23 29,21" fill="none" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
            </g>
          );
        case 'n': // Black Knight
          return (
            <g fill="#262421" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
              <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10 z" />
              <circle cx="9.5" cy="25.5" r="1" fill="#FFFFFF" stroke="none" />
              <path d="M 15,15.5 A 0.5,1.5 0 1 1 14,15.5 A 0.5,1.5 0 1 1 15,15.5 z" fill="#FFFFFF" stroke="none" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" />
              <path d="M 24.55,10.4 C 24.9,13.5 22.3,16 20.3,16" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
            </g>
          );
        case 'b': // Black Bishop
          return (
            <g fill="#262421" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z" />
              <path d="M 12,36 C 12.27,34.81 12.29,33.15 13,30 C 14,24.5 20,20.5 20,13 C 20,8.5 17.5,7.5 17.5,7.5 C 17.5,7.5 20.5,6.5 22.5,10 C 24.5,6.5 27.5,7.5 27.5,7.5 C 27.5,7.5 25,8.5 25,13 C 25,20.5 31,24.5 32,30 C 32.71,33.15 32.73,34.81 33,36" />
              <circle cx="22.5" cy="5" r="1.75" />
              <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" stroke="#FFFFFF" strokeWidth="1.2" />
            </g>
          );
        case 'r': // Black Rook
          return (
            <g fill="#262421" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 9,39 L 36,39 L 36,36 L 9,36 z" />
              <path d="M 12,36 L 12,32 L 33,32 L 33,36 z" />
              <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 z" />
              <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
              <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
              <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
              <path d="M 11,14 L 34,14" />
              <path d="M 14,29.5 L 31,29.5 M 14,17 L 31,17" stroke="#FFFFFF" strokeWidth="1.2" />
            </g>
          );
        case 'q': // Black Queen
          return (
            <g fill="#262421" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.5 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.5 L 14,25 L 6.5,13.5 z" />
              <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26" />
              <circle cx="6" cy="12" r="2" />
              <circle cx="14" cy="9" r="2" />
              <circle cx="22.5" cy="8" r="2" />
              <circle cx="31" cy="9" r="2" />
              <circle cx="39" cy="12" r="2" />
              <path d="M 11.5,30 C 15,29 30,29 33.5,30 M 12,33.5 C 18,32.5 27,32.5 33,33.5" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
            </g>
          );
        case 'k': // Black King
          return (
            <g fill="#262421" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 22.5,11.5 L 22.5,6 M 20,8 L 25,8" stroke="#000000" strokeWidth="1.8" />
              <path d="M 9,26 C 17.5,27 30,27 36,26 L 38.5,14.5 C 35,16.5 31,18.5 31,24 C 29,19 25,18 22.5,21.5 C 20,18 16,19 14,24 C 14,18.5 10,16.5 6.5,14.5 z" />
              <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26" />
              <circle cx="22.5" cy="15.5" r="3.5" />
              <path d="M 11.5,30 C 15,29 30,29 33.5,30 M 12,33.5 C 18,32.5 27,32.5 33,33.5" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
            </g>
          );
        default:
          return null;
      }
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 45 45"
      className="chess-piece-svg"
      style={{
        filter: isWhite
          ? 'drop-shadow(0 2px 2px rgba(0,0,0,0.35))'
          : 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))'
      }}
    >
      {renderPiece()}
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
                    <span className={`coord-rank ${isDark ? 'coord-dark' : 'coord-light'}`}>
                      {8 - r}
                    </span>
                  )}
                  {((orientation === 'w' && r === 7) || (orientation === 'b' && r === 0)) && (
                    <span className={`coord-file ${isDark ? 'coord-dark' : 'coord-light'}`}>
                      {String.fromCharCode(97 + f)}
                    </span>
                  )}

                  {/* 유효 이동 목적지 인디케이터 */}
                  {isValidTarget && (
                    <div className={`move-indicator ${piece ? 'capture-ring' : 'dot-marker'}`} />
                  )}

                  {/* 기물 아이콘 */}
                  {piece && (
                    <div className={`piece-wrapper ${piece.color === 'w' ? 'piece-w' : 'piece-b'}`}>
                      <ChessPieceIcon type={piece.type} color={piece.color} size={46} />
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
