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
  X,
  Shuffle,
  RefreshCw,
  Sparkles,
  GraduationCap
} from 'lucide-react';

export default function TeacherArena({ botPool = [], onAddNewBot }) {
  // 토너먼트 매치 상태 (8강: 0..3, 4강: 4..5, 결승: 6)
  const [tournamentMatches, setTournamentMatches] = useState([
    { id: 0, round: 'quarter', p1: null, p2: null, winner: null },
    { id: 1, round: 'quarter', p1: null, p2: null, winner: null },
    { id: 2, round: 'quarter', p1: null, p2: null, winner: null },
    { id: 3, round: 'quarter', p1: null, p2: null, winner: null },
    { id: 4, round: 'semi', p1: null, p2: null, winner: null },
    { id: 5, round: 'semi', p1: null, p2: null, winner: null },
    { id: 6, round: 'final', p1: null, p2: null, winner: null }
  ]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [tournamentChampion, setTournamentChampion] = useState(null);

  // 실시간 대국 상태
  const [game, setGame] = useState(() => new Chess());
  const [whiteBot, setWhiteBot] = useState(null);
  const [blackBot, setBlackBot] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(900); // ms per move
  const [lastMove, setLastMove] = useState(null);
  const [evalScore, setEvalScore] = useState(0); // White 기준 점수
  const [capturedByWhite, setCapturedByWhite] = useState([]);
  const [capturedByBlack, setCapturedByBlack] = useState([]);
  const [whiteDialogue, setWhiteDialogue] = useState('');
  const [blackDialogue, setBlackDialogue] = useState('');
  const [matchResultText, setMatchResultText] = useState(null);

  // 무승부 & 재경기(Rematch) 관리 상태
  const [drawState, setDrawState] = useState({
    isDraw: false,
    rematchCount: 0,
    message: ''
  });

  // 드래그 앤 드롭 상태
  const [draggedBotId, setDraggedBotId] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null); // 'm0-p1' etc

  // 신규 봇 수동 추가 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBotJson, setNewBotJson] = useState('');
  const [jsonError, setJsonError] = useState('');

  const timerRef = useRef(null);

  // 초기 로드 시 봇 풀에서 8강 기본 대진 자동 배치 (슬롯이 비어있을 때만)
  useEffect(() => {
    if (botPool.length > 0 && tournamentMatches[0].p1 === null) {
      fillRandomMatches();
    }
  }, [botPool]);

  // 대진표 자동 무작위 배치 (Random Auto Fill)
  const fillRandomMatches = () => {
    if (botPool.length === 0) return;
    const shuffled = [...botPool].sort(() => 0.5 - Math.random());
    const pool8 = [];
    for (let i = 0; i < 8; i++) {
      pool8.push(shuffled[i % shuffled.length]);
    }

    const updated = [
      { id: 0, round: 'quarter', p1: pool8[0], p2: pool8[1], winner: null },
      { id: 1, round: 'quarter', p1: pool8[2], p2: pool8[3], winner: null },
      { id: 2, round: 'quarter', p1: pool8[4], p2: pool8[5], winner: null },
      { id: 3, round: 'quarter', p1: pool8[6], p2: pool8[7], winner: null },
      { id: 4, round: 'semi', p1: null, p2: null, winner: null },
      { id: 5, round: 'semi', p1: null, p2: null, winner: null },
      { id: 6, round: 'final', p1: null, p2: null, winner: null }
    ];

    setTournamentMatches(updated);
    setCurrentMatchIndex(0);
    setTournamentChampion(null);
    setDrawState({ isDraw: false, rematchCount: 0, message: '' });
    loadMatch(updated[0]);
  };

  // 대진표 전체 비우기 (Clear All)
  const clearMatches = () => {
    setIsPlaying(false);
    const cleared = [
      { id: 0, round: 'quarter', p1: null, p2: null, winner: null },
      { id: 1, round: 'quarter', p1: null, p2: null, winner: null },
      { id: 2, round: 'quarter', p1: null, p2: null, winner: null },
      { id: 3, round: 'quarter', p1: null, p2: null, winner: null },
      { id: 4, round: 'semi', p1: null, p2: null, winner: null },
      { id: 5, round: 'semi', p1: null, p2: null, winner: null },
      { id: 6, round: 'final', p1: null, p2: null, winner: null }
    ];
    setTournamentMatches(cleared);
    setWhiteBot(null);
    setBlackBot(null);
    setMatchResultText(null);
    setTournamentChampion(null);
    setDrawState({ isDraw: false, rematchCount: 0, message: '' });
  };

  // 특정 경기 로드
  const loadMatch = (match) => {
    if (!match) return;
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
    setDrawState({ isDraw: false, rematchCount: 0, message: '' });

    if (match.p1 && match.p2) {
      setWhiteDialogue(match.p1.persona?.dialogues?.matchStart || '정정당당히 겨뤄보자!');
      setBlackDialogue(match.p2.persona?.dialogues?.matchStart || '내 전략을 꺾을 순 없을 거다!');
    } else {
      setWhiteDialogue('');
      setBlackDialogue('');
    }
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

      // Eval 점수 계산
      const currentEval = evaluateBoard(game, whiteBot, 'w');
      setEvalScore(currentEval);

      setGame(new Chess(game.fen()));

      if (game.isGameOver()) {
        handleMatchEnd();
      }
    }
  };

  // 경기 종료 및 무승부/승리 처리
  const handleMatchEnd = () => {
    setIsPlaying(false);

    // 1. 체크메이트 승리
    if (game.isCheckmate()) {
      const winner = game.turn() === 'w' ? blackBot : whiteBot;
      const winnerName = winner?.name || '승자';
      const resultMsg = `체크메이트! [${winnerName}] 승리!`;

      sound.playVictory();
      setMatchResultText(resultMsg);

      if (winner === whiteBot) {
        setWhiteDialogue(winner.persona?.dialogues?.onVictory || '체크메이트! 완벽한 승리다!');
      } else {
        setBlackDialogue(winner.persona?.dialogues?.onVictory || '체크메이트! 설계의 승리다!');
      }

      setDrawState({ isDraw: false, rematchCount: 0, message: '' });
      advanceTournament(currentMatchIndex, winner);
      return;
    }

    // 2. 무승부 (Draw / Stalemate / 3-fold repetition / 50-move rule)
    if (game.isDraw()) {
      const nextCount = drawState.rematchCount + 1;
      const drawMsg =
        nextCount === 1
          ? '🤝 무승부 발생! 규정에 따라 1차 재경기(Rematch)를 진행합니다.'
          : `🤝 ${nextCount}차 연속 무승부! 다시 재경기하거나 포지션 판정승을 선택할 수 있습니다.`;

      setDrawState({
        isDraw: true,
        rematchCount: nextCount,
        message: drawMsg
      });
      setMatchResultText(drawMsg);

      setWhiteDialogue('무승부라니, 재경기에서 반드시 승부를 낸다!');
      setBlackDialogue('쉽게 물러설 생각 마라. 재경기 시작이다!');
    }
  };

  // 🔄 재경기(Rematch) 시작
  const startRematch = () => {
    setIsPlaying(false);
    const newG = new Chess();
    setGame(newG);
    setLastMove(null);
    setEvalScore(0);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setMatchResultText(null);
    setDrawState((prev) => ({ ...prev, isDraw: false }));
    setWhiteDialogue(`[재경기 ${drawState.rematchCount}차전] 이번엔 반드시 끝장낸다!`);
    setBlackDialogue(`[재경기 ${drawState.rematchCount}차전] 각오해라!`);
    sound.playClick();
  };

  // 무승부 시 판정승 결정
  const resolveDrawByEval = () => {
    const winner = evalScore >= 0 ? whiteBot : blackBot;
    setMatchResultText(`형세 판정승: [${winner.name}] 승리 진출!`);
    setDrawState({ isDraw: false, rematchCount: 0, message: '' });
    sound.playVictory();
    advanceTournament(currentMatchIndex, winner);
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
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
      setTimeout(() => {
        confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0 } });
        confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1 } });
      }, 350);
    } catch (e) {
      // Fallback
    }
  };

  // 대진표에서 특정 매치 선택
  const selectMatch = (idx) => {
    const targetMatch = tournamentMatches[idx];
    if (!targetMatch) return;
    setCurrentMatchIndex(idx);
    loadMatch(targetMatch);
  };

  // 경기 즉시 결말 시뮬레이션
  const fastForwardMatch = () => {
    setIsPlaying(false);
    let count = 0;
    while (!game.isGameOver() && count < 90) {
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

  /* ==========================================================================
     드래그 앤 드롭 대진표 매치메이킹 핸들러
     ========================================================================== */
  const handleDragStart = (e, botId) => {
    e.dataTransfer.setData('text/plain', botId);
    setDraggedBotId(botId);
  };

  const handleDragOver = (e, targetKey) => {
    e.preventDefault();
    setDragOverTarget(targetKey);
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDrop = (e, matchIdx, playerSlot) => {
    e.preventDefault();
    setDragOverTarget(null);
    const botId = e.dataTransfer.getData('text/plain') || draggedBotId;
    if (!botId) return;

    const botObj = botPool.find((b) => b.id === botId);
    if (!botObj) return;

    // 대진표에 플레이어 배치
    const updated = [...tournamentMatches];
    if (playerSlot === 'p1') {
      updated[matchIdx].p1 = botObj;
    } else {
      updated[matchIdx].p2 = botObj;
    }

    setTournamentMatches(updated);

    // 현재 선택된 매치인 경우 즉시 반영
    if (currentMatchIndex === matchIdx) {
      if (playerSlot === 'p1') setWhiteBot(botObj);
      else setBlackBot(botObj);
    }

    sound.playClick();
  };

  // 슬롯에서 플레이어 제거
  const removePlayerFromSlot = (matchIdx, playerSlot, e) => {
    e.stopPropagation();
    const updated = [...tournamentMatches];
    if (playerSlot === 'p1') updated[matchIdx].p1 = null;
    else updated[matchIdx].p2 = null;
    updated[matchIdx].winner = null;

    setTournamentMatches(updated);
    if (currentMatchIndex === matchIdx) {
      if (playerSlot === 'p1') setWhiteBot(null);
      else setBlackBot(null);
    }
  };

  // 새 봇 수동 등록
  const handleAddNewBotSubmit = () => {
    try {
      const parsed = JSON.parse(newBotJson);
      if (!parsed.name || !parsed.pieceSettings) {
        setJsonError('올바른 체스 AI 설정 JSON 규격이 아닙니다.');
        return;
      }
      onAddNewBot({ ...parsed, id: `custom-${Date.now()}`, isStudent: true });
      setShowAddModal(false);
      setNewBotJson('');
      setJsonError('');
    } catch (err) {
      setJsonError('JSON 파싱 오류: 올바른 JSON 문자열을 입력해주세요.');
    }
  };

  // Eval Bar 게이지 비율 계산 (-1500 ~ +1500)
  const evalPercent = Math.min(95, Math.max(5, 50 + evalScore / 25));

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
              <p className="champ-creator">
                {tournamentChampion.isStudent ? '🎓 학생 출품작: ' : '설계자: '}
                {tournamentChampion.creator}
              </p>
              <p className="champ-desc">"{tournamentChampion.description}"</p>
            </div>
            <div className="champion-dialogue-box">
              <span className="quote-mark">“</span>
              {tournamentChampion.persona?.dialogues?.onVictory ||
                '모든 수읽기가 계획대로 맞아떨어졌다!'}
              <span className="quote-mark">”</span>
            </div>
            <div className="champion-actions">
              <button className="btn btn-primary" onClick={triggerConfetti}>
                🎉 축하 폭죽 다시 쏘기
              </button>
              <button className="btn btn-accent" onClick={fillRandomMatches}>
                새 토너먼트 시작하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상단 헤더 & 컨트롤바 */}
      <div className="arena-header glass-card">
        <div className="arena-brand">
          <Tv size={26} className="text-accent" />
          <div>
            <h3>체스 AI 마스터즈 아레나 (Teacher Studio)</h3>
            <span className="arena-sub">
              학생들이 설계한 AI를 드래그하여 대진표를 만들고, 실시간 라이브 중계를 진행하세요
            </span>
          </div>
        </div>

        <div className="arena-header-controls">
          <button className="btn btn-secondary btn-sm" onClick={fillRandomMatches}>
            <Shuffle size={15} /> 🎲 8강 랜덤 자동배치
          </button>
          <button className="btn btn-secondary btn-sm" onClick={clearMatches}>
            <RefreshCw size={15} /> 🧹 대진표 비우기
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            <PlusCircle size={15} /> 학생 AI 직접 추가
          </button>
        </div>
      </div>

      {/* 상단 가로 플레이어 풀 (Player Roster - Drag Source) */}
      <div className="player-roster-panel glass-card">
        <div className="roster-header">
          <div className="roster-title">
            <Users size={18} className="text-accent" />
            <h4>참가 가능 플레이어 명단 ({botPool.length}명)</h4>
            <span className="roster-guide">
              👉 플레이어 카드를 아래 8강 대진표 칸으로 <strong>드래그 앤 드롭</strong>하세요!
            </span>
          </div>
        </div>

        <div className="roster-carousel">
          {botPool.map((b) => (
            <div
              key={b.id}
              className={`roster-bot-card ${b.isStudent ? 'student-bot' : ''}`}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, b.id)}
            >
              {b.isStudent && (
                <span className="student-badge">
                  <GraduationCap size={11} /> 학생 등록
                </span>
              )}
              <div className="roster-bot-top">
                <span className="roster-avatar">{b.avatar}</span>
                <div className="roster-bot-info">
                  <span className="roster-name">{b.name}</span>
                  <span className="roster-creator">{b.creator}</span>
                </div>
              </div>
              <div className="roster-bot-stats">
                <span>⚔️ {b.stats?.attack}</span>
                <span>🛡️ {b.stats?.defense}</span>
                <span>🌐 {b.stats?.control}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="arena-grid">
        {/* 좌측: 드래그 앤 드롭 토너먼트 대진표(Bracket) */}
        <div className="bracket-panel glass-card">
          <div className="panel-header">
            <h4>
              <Award size={18} /> 8강 토너먼트 대진표
            </h4>
            <span className="badge-live">드래그 편성 가능</span>
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
                    className={`match-slot ${isSelected ? 'active-match' : ''} ${
                      match.winner ? 'finished' : ''
                    }`}
                    onClick={() => selectMatch(mIdx)}
                  >
                    <div className="match-num-tag">매치 {mIdx + 1}</div>

                    {/* 백(White / P1) 슬롯 */}
                    <div
                      className={`participant-drop-slot ${
                        dragOverTarget === `m${mIdx}-p1` ? 'slot-hover' : ''
                      } ${match.winner?.id === match.p1?.id ? 'winner' : ''}`}
                      onDragOver={(e) => handleDragOver(e, `m${mIdx}-p1`)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, mIdx, 'p1')}
                    >
                      {match.p1 ? (
                        <div className="slot-assigned">
                          <span className="slot-name">
                            {match.p1.avatar} {match.p1.name}
                            {match.p1.isStudent && <span className="mini-stu-tag">학생</span>}
                          </span>
                          <button
                            className="slot-remove-btn"
                            onClick={(e) => removePlayerFromSlot(mIdx, 'p1', e)}
                            title="슬롯 비우기"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="slot-empty-placeholder">
                          ⚪ [백] 플레이어 드래그
                        </span>
                      )}
                    </div>

                    {/* 흑(Black / P2) 슬롯 */}
                    <div
                      className={`participant-drop-slot ${
                        dragOverTarget === `m${mIdx}-p2` ? 'slot-hover' : ''
                      } ${match.winner?.id === match.p2?.id ? 'winner' : ''}`}
                      onDragOver={(e) => handleDragOver(e, `m${mIdx}-p2`)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, mIdx, 'p2')}
                    >
                      {match.p2 ? (
                        <div className="slot-assigned">
                          <span className="slot-name">
                            {match.p2.avatar} {match.p2.name}
                            {match.p2.isStudent && <span className="mini-stu-tag">학생</span>}
                          </span>
                          <button
                            className="slot-remove-btn"
                            onClick={(e) => removePlayerFromSlot(mIdx, 'p2', e)}
                            title="슬롯 비우기"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="slot-empty-placeholder">
                          ⚫ [흑] 플레이어 드래그
                        </span>
                      )}
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
                    className={`match-slot ${isSelected ? 'active-match' : ''} ${
                      match.winner ? 'finished' : ''
                    }`}
                    onClick={() => selectMatch(mIdx)}
                  >
                    <div className="match-num-tag">4강 {mIdx - 3}</div>
                    <div
                      className={`participant-drop-slot ${
                        match.winner?.id === match.p1?.id ? 'winner' : ''
                      }`}
                    >
                      <span className="slot-name">
                        {match.p1?.avatar || '❓'} {match.p1?.name || '8강 승자 대기'}
                      </span>
                      {match.winner?.id === match.p1?.id && (
                        <Crown size={12} className="crown-icon" />
                      )}
                    </div>
                    <div
                      className={`participant-drop-slot ${
                        match.winner?.id === match.p2?.id ? 'winner' : ''
                      }`}
                    >
                      <span className="slot-name">
                        {match.p2?.avatar || '❓'} {match.p2?.name || '8강 승자 대기'}
                      </span>
                      {match.winner?.id === match.p2?.id && (
                        <Crown size={12} className="crown-icon" />
                      )}
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
                  className={`match-slot final-slot ${
                    currentMatchIndex === 6 ? 'active-match' : ''
                  }`}
                  onClick={() => selectMatch(6)}
                >
                  <div className="match-num-tag gold-tag">🏆 챔피언십</div>
                  <div
                    className={`participant-drop-slot ${
                      tournamentMatches[6].winner?.id === tournamentMatches[6].p1?.id
                        ? 'winner'
                        : ''
                    }`}
                  >
                    <span className="slot-name">
                      {tournamentMatches[6].p1?.avatar || '❓'}{' '}
                      {tournamentMatches[6].p1?.name || '4강 승자'}
                    </span>
                    {tournamentMatches[6].winner?.id === tournamentMatches[6].p1?.id && (
                      <Crown size={14} className="crown-icon" />
                    )}
                  </div>
                  <div
                    className={`participant-drop-slot ${
                      tournamentMatches[6].winner?.id === tournamentMatches[6].p2?.id
                        ? 'winner'
                        : ''
                    }`}
                  >
                    <span className="slot-name">
                      {tournamentMatches[6].p2?.avatar || '❓'}{' '}
                      {tournamentMatches[6].p2?.name || '4강 승자'}
                    </span>
                    {tournamentMatches[6].winner?.id === tournamentMatches[6].p2?.id && (
                      <Crown size={14} className="crown-icon" />
                    )}
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
            <div
              className={`fighter-card white-fighter ${
                game.turn() === 'w' ? 'turn-active' : ''
              }`}
            >
              <div className="fighter-header">
                <span className="fighter-avatar">{whiteBot?.avatar || '⚪'}</span>
                <div>
                  <h4 className="fighter-name">{whiteBot?.name || '대기 중 (선수 미지정)'}</h4>
                  <span className="fighter-creator">
                    {whiteBot?.isStudent ? '🎓 ' : ''}
                    {whiteBot?.creator || '설계자 미정'}
                  </span>
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
                <div className="fighter-bubble left-bubble">"{whiteDialogue}"</div>
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
            <div
              className={`fighter-card black-fighter ${
                game.turn() === 'b' ? 'turn-active' : ''
              }`}
            >
              <div className="fighter-header">
                <span className="fighter-avatar">{blackBot?.avatar || '⚫'}</span>
                <div>
                  <h4 className="fighter-name">{blackBot?.name || '대기 중 (선수 미지정)'}</h4>
                  <span className="fighter-creator">
                    {blackBot?.isStudent ? '🎓 ' : ''}
                    {blackBot?.creator || '설계자 미정'}
                  </span>
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
                <div className="fighter-bubble right-bubble">"{blackDialogue}"</div>
              )}
            </div>
          </div>

          {/* 실시간 유불리 Eval Bar */}
          <div className="eval-bar-container">
            <div className="eval-bar-track">
              <div className="eval-fill-white" style={{ width: `${evalPercent}%` }} />
            </div>
            <div className="eval-labels">
              <span>백 유리 ({evalScore > 0 ? `+${(evalScore / 100).toFixed(1)}` : '0.0'})</span>
              <span>형세 게이지</span>
              <span>흑 유리 ({evalScore < 0 ? `${(evalScore / 100).toFixed(1)}` : '0.0'})</span>
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

            {/* 경기 결과 및 무승부 재경기 오버레이 */}
            {matchResultText && (
              <div className="match-result-banner animate-fade-in">
                <h3>{matchResultText}</h3>

                {/* 무승부 시 재경기 컨트롤 */}
                {drawState.isDraw && (
                  <div className="rematch-controls-overlay">
                    <button className="btn btn-accent btn-lg" onClick={startRematch}>
                      <RefreshCw size={18} /> 🔄 {drawState.rematchCount}차 재경기 시작하기
                    </button>
                    {drawState.rematchCount >= 2 && (
                      <button className="btn btn-secondary" onClick={resolveDrawByEval}>
                        ⚖️ 형세 판정승으로 결정
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 경기 중계 조작 콘솔 */}
          <div className="broadcast-controls">
            <button
              className={`btn ${isPlaying ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!whiteBot || !blackBot || Boolean(matchResultText)}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              {isPlaying ? '일시정지' : '경기 재생'}
            </button>

            <button
              className="btn btn-secondary"
              onClick={executeOneMove}
              disabled={isPlaying || !whiteBot || !blackBot || Boolean(matchResultText)}
            >
              <SkipForward size={18} /> 1수 진행
            </button>

            <button
              className="btn btn-secondary"
              onClick={fastForwardMatch}
              disabled={isPlaying || !whiteBot || !blackBot || Boolean(matchResultText)}
            >
              <FastForward size={18} /> 결과 즉시 판정
            </button>

            <div className="speed-selector">
              <span className="speed-label">속도:</span>
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
              학생이 'JSON 내보내기'로 복사하거나 다운로드한 체스 AI 설정 JSON 코드를
              붙여넣어주세요.
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
