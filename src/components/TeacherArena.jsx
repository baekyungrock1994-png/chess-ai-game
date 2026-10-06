import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import confetti from 'canvas-confetti';
import ChessBoard, { ChessPieceIcon } from './ChessBoard';
import { getBestMove, evaluateBoard, getGamePhase } from '../engine/chessEngine';
import { sound } from '../utils/soundEffects';
import {
  Trophy,
  Play,
  Pause,
  SkipForward,
  FastForward,
  RotateCcw,
  Users,
  Award,
  Crown,
  Tv,
  ListOrdered,
  Flame,
  Shield,
  Zap,
  Swords,
  ChevronRight,
  PlusCircle,
  X
} from 'lucide-react';

export default function TeacherArena({ botPool, onAddNewBot }) {
  // 모드: 'tournament' (토너먼트 브래킷) | 'league' (풀 리그전)
  const [arenaMode, setArenaMode] = useState('tournament');

  // 토너먼트 상태 (8강 기준)
  // 8강: matches[0..3], 4강: matches[4..5], 결승: matches[6]
  const [tournamentMatches, setTournamentMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [tournamentChampion, setTournamentChampion] = useState(null);

  // 실시간 대국 상태
  const [game, setGame] = useState(() => new Chess());
  const [whiteBot, setWhiteBot] = useState(null);
  const [blackBot, setBlackBot] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(900); // ms per move (400, 900, 1600)
  const [lastMove, setLastMove] = useState(null);
  const [evalScore, setEvalScore] = useState(0); // White 기준 점수
  const [capturedByWhite, setCapturedByWhite] = useState([]);
  const [capturedByBlack, setCapturedByBlack] = useState([]);
  const [whiteDialogue, setWhiteDialogue] = useState('');
  const [blackDialogue, setBlackDialogue] = useState('');
  const [matchResultText, setMatchResultText] = useState(null);

  // 신규 봇 수동 추가 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBotJson, setNewBotJson] = useState('');
  const [jsonError, setJsonError] = useState('');

  const timerRef = useRef(null);

  // 초기 토너먼트 대진표 세팅 (참가 풀에서 상위 8개 선택)
  useEffect(() => {
    initTournament();
  }, [botPool]);

  const initTournament = () => {
    const participants = [...botPool].slice(0, 8);
    // 8명이 안 되면 복사해서 8명 채우기
    while (participants.length < 8) {
      participants.push({
        ...botPool[participants.length % botPool.length],
        id: `bot-clone-${Date.now()}-${participants.length}`,
        name: `${botPool[participants.length % botPool.length].name} (B군)`
      });
    }

    const matches = [
      // 8강 (Quarterfinals)
      { id: 0, round: 'quarter', p1: participants[0], p2: participants[1], winner: null },
      { id: 1, round: 'quarter', p1: participants[2], p2: participants[3], winner: null },
      { id: 2, round: 'quarter', p1: participants[4], p2: participants[5], winner: null },
      { id: 3, round: 'quarter', p1: participants[6], p2: participants[7], winner: null },
      // 4강 (Semifinals)
      { id: 4, round: 'semi', p1: null, p2: null, winner: null },
      { id: 5, round: 'semi', p1: null, p2: null, winner: null },
      // 결승 (Finals)
      { id: 6, round: 'final', p1: null, p2: null, winner: null }
    ];

    setTournamentMatches(matches);
    setCurrentMatchIndex(0);
    setTournamentChampion(null);
    loadMatch(matches[0]);
  };

  const loadMatch = (match) => {
    if (!match || !match.p1 || !match.p2) return;
    setIsPlaying(false);
    const newG = new Chess();
    setGame(newG);
    setWhiteBot(match.p1);
    setBlackBot(match.p2);
    setLastMove(null);
    setEvalScore(0);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setMatchResultText(null);
    setWhiteDialogue(match.p1.persona?.dialogues?.matchStart || '정정당당히 겨뤄보자!');
    setBlackDialogue(match.p2.persona?.dialogues?.matchStart || '내 전략을 꺾을 순 없을 거다!');
  };

  // 자동 진행 루프
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setTimeout(() => {
        executeOneMove();
      }, playSpeed);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, game, playSpeed]);

  // 1수 실행
  const executeOneMove = () => {
    if (game.isGameOver()) {
      handleMatchEnd();
      return;
    }

    const turn = game.turn();
    const currentBot = turn === 'w' ? whiteBot : blackBot;
    const opponentBot = turn === 'w' ? blackBot : whiteBot;

    if (!currentBot) return;

    const result = getBestMove(game, currentBot, 2);
    if (!result || !result.move) {
      handleMatchEnd();
      return;
    }

    const moveRes = game.move(result.move);
    if (moveRes) {
      // 효과음 및 캡처 처리
      if (moveRes.captured) {
        sound.playCapture();
        if (turn === 'w') {
          setCapturedByWhite((prev) => [...prev, moveRes.captured]);
          setWhiteDialogue(currentBot.persona?.dialogues?.onCapture || '기물 하나 접수 완료!');
        } else {
          setCapturedByBlack((prev) => [...prev, moveRes.captured]);
          setBlackDialogue(currentBot.persona?.dialogues?.onCapture || '빈틈을 파고들었다!');
        }
      } else {
        sound.playMove();
      }

      if (game.inCheck()) {
        sound.playCheck();
        if (turn === 'w') {
          setWhiteDialogue(currentBot.persona?.dialogues?.onCheck || '체크! 길을 비켜라.');
        } else {
          setBlackDialogue(currentBot.persona?.dialogues?.onCheck || '체크! 위기가 닥쳤군.');
        }
      }

      setLastMove({ from: result.move.from, to: result.move.to });

      // 유불리 Eval 점수 계산
      const currentEval = evaluateBoard(game, whiteBot, 'w');
      setEvalScore(currentEval);

      setGame(new Chess(game.fen()));

      if (game.isGameOver()) {
        handleMatchEnd();
      }
    }
  };

  // 경기 종료 처리
  const handleMatchEnd = () => {
    setIsPlaying(false);
    let winnerBot = null;
    let resultMsg = '';

    if (game.isCheckmate()) {
      const winnerColor = game.turn() === 'w' ? '흑(Black)' : '백(White)';
      winnerBot = game.turn() === 'w' ? blackBot : whiteBot;
      const loserBot = game.turn() === 'w' ? whiteBot : blackBot;
      resultMsg = `체크메이트! [${winnerBot.name}] 승리!`;

      sound.playVictory();

      // 우승 봇 대사
      if (winnerBot === whiteBot) {
        setWhiteDialogue(winnerBot.persona?.dialogues?.onVictory || '체크메이트! 설계의 승리다!');
      } else {
        setBlackDialogue(winnerBot.persona?.dialogues?.onVictory || '체크메이트! 완벽한 승부였다!');
      }
    } else {
      // 무승부인 경우 기물 점수나 평가치로 우세승 결정
      resultMsg = '무승부 판정 (기물/포지션 판정승)';
      winnerBot = evalScore >= 0 ? whiteBot : blackBot;
    }

    setMatchResultText(resultMsg);

    // 토너먼트 결과 반영
    advanceTournament(currentMatchIndex, winnerBot);
  };

  // 토너먼트 진출 처리
  const advanceTournament = (matchIdx, winner) => {
    const updated = [...tournamentMatches];
    updated[matchIdx].winner = winner;

    // 8강 승자 -> 4강 진출
    if (matchIdx === 0) updated[4].p1 = winner;
    if (matchIdx === 1) updated[4].p2 = winner;
    if (matchIdx === 2) updated[5].p1 = winner;
    if (matchIdx === 3) updated[5].p2 = winner;

    // 4강 승자 -> 결승 진출
    if (matchIdx === 4) updated[6].p1 = winner;
    if (matchIdx === 5) updated[6].p2 = winner;

    // 결승 승자 -> 최종 챔피언 등극!
    if (matchIdx === 6) {
      setTournamentChampion(winner);
      triggerConfetti();
    }

    setTournamentMatches(updated);
  };

  // 화려한 승리 폭죽 세리머니
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 70,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 70,
          origin: { x: 1 }
        });
      }, 350);
    } catch (e) {
      // Fallback
    }
  };

  // 다음 경기 선택
  const selectMatch = (idx) => {
    const targetMatch = tournamentMatches[idx];
    if (!targetMatch || !targetMatch.p1 || !targetMatch.p2) return;
    setCurrentMatchIndex(idx);
    loadMatch(targetMatch);
  };

  // 경기 즉시 결말 시뮬레이션
  const fastForwardMatch = () => {
    setIsPlaying(false);
    let count = 0;
    while (!game.isGameOver() && count < 80) {
      const turn = game.turn();
      const currentBot = turn === 'w' ? whiteBot : blackBot;
      const res = getBestMove(game, currentBot, 1);
      if (!res || !res.move) break;
      game.move(res.move);
      count++;
    }
    setGame(new Chess(game.fen()));
    handleMatchEnd();
  };

  // 새 봇 수동 등록
  const handleAddNewBotSubmit = () => {
    try {
      const parsed = JSON.parse(newBotJson);
      if (!parsed.name || !parsed.pieceSettings) {
        setJsonError('올바른 체스 AI 설정 JSON 규격이 아닙니다.');
        return;
      }
      onAddNewBot({ ...parsed, id: `custom-${Date.now()}` });
      setShowAddModal(false);
      setNewBotJson('');
      setJsonError('');
    } catch (err) {
      setJsonError('JSON 파싱 오류: 올바른 JSON 문자열을 입력해주세요.');
    }
  };

  // Eval Bar 게이지 비율 계산 (-1500 ~ +1500)
  const evalPercent = Math.min(95, Math.max(5, 50 + (evalScore / 25)));

  return (
    <div className="arena-container">
      {/* 챔피언 우승 축하 모달 */}
      {tournamentChampion && (
        <div className="champion-modal-backdrop">
          <div className="champion-modal glass-card">
            <Crown size={64} className="trophy-gold-glow animate-bounce" />
            <h2 className="champion-title">🏆 최종 토너먼트 챔피언 탄생!</h2>
            <div className="champion-card">
              <span className="champ-avatar">{tournamentChampion.avatar}</span>
              <h3>{tournamentChampion.name}</h3>
              <p className="champ-creator">설계자: {tournamentChampion.creator}</p>
              <p className="champ-desc">"{tournamentChampion.description}"</p>
            </div>
            <div className="champion-dialogue-box">
              <span className="quote-mark">“</span>
              {tournamentChampion.persona?.dialogues?.onVictory || '모든 수읽기가 계획대로 맞아떨어졌다!'}
              <span className="quote-mark">”</span>
            </div>
            <div className="champion-actions">
              <button className="btn btn-primary" onClick={triggerConfetti}>
                🎉 축하 폭죽 다시 쏘기
              </button>
              <button className="btn btn-accent" onClick={initTournament}>
                새 토너먼트 시작하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상단 헤더 & 모드 선택바 */}
      <div className="arena-header glass-card">
        <div className="arena-brand">
          <Tv size={26} className="text-accent" />
          <div>
            <h3>체스 AI 마스터즈 아레나 (Teacher Broadcast)</h3>
            <span className="arena-sub">학생들이 설계한 AI들의 실시간 라이브 중계 & 토너먼트</span>
          </div>
        </div>

        <div className="arena-header-controls">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddModal(true)}
          >
            <PlusCircle size={15} /> 학생 AI 추가 등록
          </button>
          <button className="btn btn-secondary btn-sm" onClick={initTournament}>
            <RotateCcw size={15} /> 대진표 리셋
          </button>
        </div>
      </div>

      <div className="arena-grid">
        {/* 좌측: 토너먼트 대진표(Bracket) */}
        <div className="bracket-panel glass-card">
          <div className="panel-header">
            <h4><Award size={18} /> 8강 토너먼트 브래킷</h4>
            <span className="badge-live">LIVE 대진표</span>
          </div>

          <div className="bracket-tree">
            {/* 8강 라운드 */}
            <div className="bracket-round">
              <span className="round-label">8강전 (Quarterfinals)</span>
              {[0, 1, 2, 3].map((mIdx) => {
                const match = tournamentMatches[mIdx];
                if (!match) return null;
                const isSelected = currentMatchIndex === mIdx;
                return (
                  <div
                    key={mIdx}
                    className={`match-slot ${isSelected ? 'active-match' : ''} ${match.winner ? 'finished' : ''}`}
                    onClick={() => selectMatch(mIdx)}
                  >
                    <div className={`participant-row ${match.winner?.id === match.p1?.id ? 'winner' : ''}`}>
                      <span>{match.p1?.avatar || '❓'} {match.p1?.name || '미정'}</span>
                      {match.winner?.id === match.p1?.id && <Crown size={12} className="crown-icon" />}
                    </div>
                    <div className={`participant-row ${match.winner?.id === match.p2?.id ? 'winner' : ''}`}>
                      <span>{match.p2?.avatar || '❓'} {match.p2?.name || '미정'}</span>
                      {match.winner?.id === match.p2?.id && <Crown size={12} className="crown-icon" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4강 라운드 */}
            <div className="bracket-round">
              <span className="round-label">4강전 (Semifinals)</span>
              {[4, 5].map((mIdx) => {
                const match = tournamentMatches[mIdx];
                if (!match) return null;
                const isSelected = currentMatchIndex === mIdx;
                return (
                  <div
                    key={mIdx}
                    className={`match-slot ${isSelected ? 'active-match' : ''} ${match.winner ? 'finished' : ''}`}
                    onClick={() => selectMatch(mIdx)}
                  >
                    <div className={`participant-row ${match.winner?.id === match.p1?.id ? 'winner' : ''}`}>
                      <span>{match.p1?.avatar || '❓'} {match.p1?.name || '8강 승자'}</span>
                      {match.winner?.id === match.p1?.id && <Crown size={12} className="crown-icon" />}
                    </div>
                    <div className={`participant-row ${match.winner?.id === match.p2?.id ? 'winner' : ''}`}>
                      <span>{match.p2?.avatar || '❓'} {match.p2?.name || '8강 승자'}</span>
                      {match.winner?.id === match.p2?.id && <Crown size={12} className="crown-icon" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 결승 라운드 */}
            <div className="bracket-round final-round">
              <span className="round-label">결승전 (Finals)</span>
              {tournamentMatches[6] && (
                <div
                  className={`match-slot final-slot ${currentMatchIndex === 6 ? 'active-match' : ''}`}
                  onClick={() => selectMatch(6)}
                >
                  <div className={`participant-row ${tournamentMatches[6].winner?.id === tournamentMatches[6].p1?.id ? 'winner' : ''}`}>
                    <span>{tournamentMatches[6].p1?.avatar || '❓'} {tournamentMatches[6].p1?.name || '4강 승자'}</span>
                    {tournamentMatches[6].winner?.id === tournamentMatches[6].p1?.id && <Crown size={14} className="crown-icon" />}
                  </div>
                  <div className={`participant-row ${tournamentMatches[6].winner?.id === tournamentMatches[6].p2?.id ? 'winner' : ''}`}>
                    <span>{tournamentMatches[6].p2?.avatar || '❓'} {tournamentMatches[6].p2?.name || '4강 승자'}</span>
                    {tournamentMatches[6].winner?.id === tournamentMatches[6].p2?.id && <Crown size={14} className="crown-icon" />}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 중앙: 대형 메인 중계 체스판 & AI 배틀 카드 */}
        <div className="broadcast-panel glass-card">
          {/* 양측 AI 상태 카드 & 실시간 대사 */}
          <div className="fighters-bar">
            {/* 백(White) 플레이어 카드 */}
            <div className={`fighter-card white-fighter ${game.turn() === 'w' ? 'turn-active' : ''}`}>
              <div className="fighter-header">
                <span className="fighter-avatar">{whiteBot?.avatar || '⚪'}</span>
                <div>
                  <h4 className="fighter-name">{whiteBot?.name || '대기 중'}</h4>
                  <span className="fighter-creator">{whiteBot?.creator || '설계자 미정'}</span>
                </div>
              </div>
              {/* 잡은 기물 트레이 */}
              <div className="captured-tray">
                {capturedByWhite.map((p, i) => (
                  <span key={i} className="captured-mini piece-b">
                    <ChessPieceIcon type={p} color="b" size={18} />
                  </span>
                ))}
              </div>
              {/* 실시간 말풍선 */}
              {whiteDialogue && (
                <div className="fighter-bubble left-bubble">
                  "{whiteDialogue}"
                </div>
              )}
            </div>

            {/* VS 마크 및 턴 표시 */}
            <div className="vs-center">
              <span className="vs-badge">VS</span>
              <span className="turn-indicator">
                {game.turn() === 'w' ? '백(White) 턴' : '흑(Black) 턴'}
              </span>
            </div>

            {/* 흑(Black) 플레이어 카드 */}
            <div className={`fighter-card black-fighter ${game.turn() === 'b' ? 'turn-active' : ''}`}>
              <div className="fighter-header">
                <span className="fighter-avatar">{blackBot?.avatar || '⚫'}</span>
                <div>
                  <h4 className="fighter-name">{blackBot?.name || '대기 중'}</h4>
                  <span className="fighter-creator">{blackBot?.creator || '설계자 미정'}</span>
                </div>
              </div>
              {/* 잡은 기물 트레이 */}
              <div className="captured-tray">
                {capturedByBlack.map((p, i) => (
                  <span key={i} className="captured-mini piece-w">
                    <ChessPieceIcon type={p} color="w" size={18} />
                  </span>
                ))}
              </div>
              {/* 실시간 말풍선 */}
              {blackDialogue && (
                <div className="fighter-bubble right-bubble">
                  "{blackDialogue}"
                </div>
              )}
            </div>
          </div>

          {/* 실시간 유불리 Eval Bar */}
          <div className="eval-bar-container">
            <div className="eval-bar-track">
              <div className="eval-fill-white" style={{ width: `${evalPercent}%` }} />
            </div>
            <div className="eval-labels">
              <span>백 유리 ({evalScore > 0 ? `+${(evalScore/100).toFixed(1)}` : '0.0'})</span>
              <span>형세 게이지</span>
              <span>흑 유리 ({evalScore < 0 ? `${(evalScore/100).toFixed(1)}` : '0.0'})</span>
            </div>
          </div>

          {/* 대형 체스판 */}
          <div className="main-board-wrapper">
            <ChessBoard
              game={game}
              selectedSquare={null}
              validMoves={[]}
              lastMove={lastMove}
              orientation="w"
              isThinking={isPlaying}
            />

            {matchResultText && (
              <div className="match-result-banner animate-fade-in">
                <h3>{matchResultText}</h3>
              </div>
            )}
          </div>

          {/* 경기 중계 조작 콘솔 */}
          <div className="broadcast-controls">
            <button
              className={`btn ${isPlaying ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              {isPlaying ? '일시정지' : '경기 재생'}
            </button>

            <button className="btn btn-secondary" onClick={executeOneMove} disabled={isPlaying}>
              <SkipForward size={18} /> 1수 진행
            </button>

            <button className="btn btn-secondary" onClick={fastForwardMatch}>
              <FastForward size={18} /> 결과 즉시 판정
            </button>

            <div className="speed-selector">
              <span className="speed-label">재생 속도:</span>
              <button
                className={`speed-chip ${playSpeed === 1600 ? 'active' : ''}`}
                onClick={() => setPlaySpeed(1600)}
              >
                1.6초
              </button>
              <button
                className={`speed-chip ${playSpeed === 900 ? 'active' : ''}`}
                onClick={() => setPlaySpeed(900)}
              >
                0.9초
              </button>
              <button
                className={`speed-chip ${playSpeed === 400 ? 'active' : ''}`}
                onClick={() => setPlaySpeed(400)}
              >
                0.4초
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 신규 학생 AI 추가 모달 */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card glass-card">
            <div className="modal-header">
              <h4>학생 AI JSON 등록</h4>
              <button className="btn-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <p className="modal-desc">
              학생이 'JSON 내보내기'로 복사하거나 다운로드한 체스 AI 설정 JSON 코드를 붙여넣어주세요.
            </p>
            <textarea
              className="modal-json-input"
              rows="8"
              value={newBotJson}
              onChange={(e) => setNewBotJson(e.target.value)}
              placeholder='{ "name": "학생 봇", "pieceSettings": { ... } }'
            />
            {jsonError && <p className="error-text">{jsonError}</p>}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleAddNewBotSubmit}>
                참가자 명단에 등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
