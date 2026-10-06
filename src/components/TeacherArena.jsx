import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import confetti from 'canvas-confetti';
import ChessBoard, { ChessPieceIcon } from './ChessBoard';
import { getBestMove, evaluateBoard, getGamePhase, checkPieceRepetitionDraw } from '../engine/chessEngine';
import { DEFAULT_BOT_CONFIG } from '../data/presetBots';
import { sound } from '../utils/soundEffects';
import { startRpsSession, decideRpsSession, closeRpsSession } from '../firebase';
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
  GraduationCap,
  Bot,
  FastForward as FastForwardIcon,
  Layers,
  Trash2
} from 'lucide-react';

// 부전승(BYE) 객체 정의
export const BYE_BOT = {
  id: 'bye-player',
  name: '부전승 (BYE)',
  creator: '시스템',
  avatar: '⏩',
  isBye: true,
  description: '부전승으로 상대 선수가 다음 라운드로 자동 진출합니다.'
};

// 연습용 봇 생성기
const createPracticeBot = (idx) => ({
  ...DEFAULT_BOT_CONFIG,
  id: `practice-bot-${idx}`,
  name: `연습 봇 ${idx}호`,
  creator: '아레나 AI',
  avatar: '🤖',
  isPractice: true,
  description: '토너먼트 빈자리를 채우기 위한 인공지능 연습 봇'
});

// 토너먼트 크기별 매치 생성 헬퍼
function generateMatchesForSize(size) {
  // size: 8, 16, 32
  let rounds = [];
  if (size === 32) {
    rounds = [
      { name: '32강전', count: 16, key: 'r32' },
      { name: '16강전', count: 8, key: 'r16' },
      { name: '8강전', count: 4, key: 'qf' },
      { name: '4강전', count: 2, key: 'sf' },
      { name: '결승전', count: 1, key: 'final' }
    ];
  } else if (size === 16) {
    rounds = [
      { name: '16강전', count: 8, key: 'r16' },
      { name: '8강전', count: 4, key: 'qf' },
      { name: '4강전', count: 2, key: 'sf' },
      { name: '결승전', count: 1, key: 'final' }
    ];
  } else {
    // 8강 기본
    rounds = [
      { name: '8강전', count: 4, key: 'qf' },
      { name: '4강전', count: 2, key: 'sf' },
      { name: '결승전', count: 1, key: 'final' }
    ];
  }

  const matches = [];
  let currentId = 0;

  rounds.forEach((roundInfo, rIndex) => {
    for (let i = 0; i < roundInfo.count; i++) {
      matches.push({
        id: currentId,
        roundIndex: rIndex,
        roundName: roundInfo.name,
        roundKey: roundInfo.key,
        matchIndexInRound: i,
        p1: null,
        p2: null,
        winner: null
      });
      currentId++;
    }
  });

  return { matches, rounds };
}

export default function TeacherArena({
  botPool = [],
  currentUser,
  onAddNewBot,
  onDeleteBot,
  onOpenAuthModal,
  activeRpsSession = null
}) {
  // 토너먼트 규모: 8 | 16 | 32
  const [tournamentSize, setTournamentSize] = useState(8);
  const [tournamentData, setTournamentData] = useState(() => generateMatchesForSize(8));
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [tournamentChampion, setTournamentChampion] = useState(null);

  // 실시간 대국 상태
  const [game, setGame] = useState(() => new Chess());
  const [whiteBot, setWhiteBot] = useState(null);
  const [blackBot, setBlackBot] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(900); // ms
  const [lastMove, setLastMove] = useState(null);
  const [evalScore, setEvalScore] = useState(0);
  const [capturedByWhite, setCapturedByWhite] = useState([]);
  const [capturedByBlack, setCapturedByBlack] = useState([]);
  const [whiteDialogue, setWhiteDialogue] = useState('');
  const [blackDialogue, setBlackDialogue] = useState('');
  const [matchResultText, setMatchResultText] = useState(null);

  // 무승부 & 재경기 관리
  const [drawState, setDrawState] = useState({
    isDraw: false,
    rematchCount: 0,
    message: ''
  });

  // 드래그 앤 드롭
  const [draggedBotId, setDraggedBotId] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);

  // 수동 추가 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBotJson, setNewBotJson] = useState('');
  const [jsonError, setJsonError] = useState('');

  const timerRef = useRef(null);

  // 가위바위보 (RPS) 흑/백 진영 결정전 모달 상태
  const [showRpsModal, setShowRpsModal] = useState(false);
  const [rpsP1Choice, setRpsP1Choice] = useState(null); // 'scissors' | 'rock' | 'paper'
  const [rpsP2Choice, setRpsP2Choice] = useState(null);
  const [rpsResult, setRpsResult] = useState(null); // { winner: 'p1'|'p2'|'tie', text: '', winnerBot: null }

  // 규모 변경 핸들러
  const handleSizeChange = (newSize) => {
    const sizeNum = parseInt(newSize, 10);
    setTournamentSize(sizeNum);
    const newTournament = generateMatchesForSize(sizeNum);
    setTournamentData(newTournament);
    setCurrentMatchIndex(0);
    setTournamentChampion(null);
    setMatchResultText(null);
    loadMatch(newTournament.matches[0]);
  };

  // 1라운드 첫 매치 로드
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
      if (match.p1.isBye || match.p2.isBye) {
        setWhiteDialogue('부전승 매치입니다. 승자 진출을 확인하세요.');
        setBlackDialogue('');
      } else {
        setWhiteDialogue(match.p1.persona?.dialogues?.matchStart || '정정당당히 겨뤄보자!');
        setBlackDialogue(match.p2.persona?.dialogues?.matchStart || '내 전략을 꺾을 순 없을 거다!');
      }
    } else {
      setWhiteDialogue('');
      setBlackDialogue('');
    }
  };

  // 대진표 무작위 자동 채우기
  const fillRandomMatches = () => {
    const pool = [...botPool];
    if (pool.length === 0) return;

    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const firstRoundCount = tournamentSize / 2;
    const updatedMatches = [...tournamentData.matches];

    for (let i = 0; i < firstRoundCount; i++) {
      updatedMatches[i].p1 = shuffled[i * 2] || null;
      updatedMatches[i].p2 = shuffled[i * 2 + 1] || null;
      updatedMatches[i].winner = null;
    }

    setTournamentData((prev) => ({ ...prev, matches: updatedMatches }));
    setCurrentMatchIndex(0);
    setTournamentChampion(null);
    loadMatch(updatedMatches[0]);
  };

  // 빈 슬롯을 연습 봇으로 모두 채우기 (Filler Bots)
  const fillEmptyWithPracticeBots = () => {
    const firstRoundCount = tournamentSize / 2;
    const updatedMatches = [...tournamentData.matches];
    let practiceIdx = 1;

    for (let i = 0; i < firstRoundCount; i++) {
      if (!updatedMatches[i].p1) {
        updatedMatches[i].p1 = createPracticeBot(practiceIdx++);
      }
      if (!updatedMatches[i].p2) {
        updatedMatches[i].p2 = createPracticeBot(practiceIdx++);
      }
    }

    setTournamentData((prev) => ({ ...prev, matches: updatedMatches }));
    if (currentMatchIndex === 0) {
      loadMatch(updatedMatches[0]);
    }
    sound.playClick();
  };

  // 대진표 전체 비우기
  const clearMatches = () => {
    setIsPlaying(false);
    const newTournament = generateMatchesForSize(tournamentSize);
    setTournamentData(newTournament);
    setWhiteBot(null);
    setBlackBot(null);
    setMatchResultText(null);
    setTournamentChampion(null);
    setDrawState({ isDraw: false, rematchCount: 0, message: '' });
  };

  // 부전승(BYE) 승자 자동 진출 처리
  const advanceByeWinner = (matchIdx, winner) => {
    setMatchResultText(`부전승 인정: [${winner.name}] 다음 라운드 진출!`);
    sound.playVictory();
    advanceTournament(matchIdx, winner);
  };

  // 다음 라운드 다음 매치 인덱스 계산 헬퍼
  const getNextMatchInfo = (currentMatch) => {
    const { roundIndex, matchIndexInRound } = currentMatch;
    const currentRoundInfo = tournamentData.rounds[roundIndex];
    if (roundIndex >= tournamentData.rounds.length - 1) return null; // 결승전

    // 이전 라운드 경기들의 총 합산 수
    let priorMatchesCount = 0;
    for (let r = 0; r <= roundIndex; r++) {
      priorMatchesCount += tournamentData.rounds[r].count;
    }

    const nextMatchInNextRound = Math.floor(matchIndexInRound / 2);
    const nextMatchId = priorMatchesCount + nextMatchInNextRound;
    const nextSlot = matchIndexInRound % 2 === 0 ? 'p1' : 'p2';

    return { nextMatchId, nextSlot };
  };

  // 토너먼트 진출 처리
  const advanceTournament = (matchIdx, winner) => {
    const updated = [...tournamentData.matches];
    const match = updated[matchIdx];
    match.winner = winner;

    const nextInfo = getNextMatchInfo(match);
    if (nextInfo) {
      const nextMatch = updated[nextInfo.nextMatchId];
      if (nextMatch) {
        if (nextInfo.nextSlot === 'p1') nextMatch.p1 = winner;
        else nextMatch.p2 = winner;
      }
    } else {
      // 결승전 승자 = 최종 챔피언
      setTournamentChampion(winner);
      triggerConfetti();
    }

    setTournamentData((prev) => ({ ...prev, matches: updated }));
  };

  // 실시간 게임 1수 진행
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setTimeout(() => {
        executeOneMove();
      }, playSpeed);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, game, playSpeed]);

  const executeOneMove = () => {
    const repetition = checkPieceRepetitionDraw(game);
    if (game.isGameOver() || repetition) {
      handleMatchEnd(repetition);
      return;
    }

    const turn = game.turn();
    const currentBot = turn === 'w' ? whiteBot : blackBot;

    if (!currentBot) return;

    // 만약 한쪽이 부전승(BYE)인 경우 즉시 승자 처리
    if (whiteBot?.isBye) {
      advanceByeWinner(currentMatchIndex, blackBot);
      return;
    }
    if (blackBot?.isBye) {
      advanceByeWinner(currentMatchIndex, whiteBot);
      return;
    }

    const result = getBestMove(game, currentBot, 2);
    if (!result || !result.move) {
      handleMatchEnd();
      return;
    }

    const moveRes = game.move(result.move);
    if (moveRes) {
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
      const currentEval = evaluateBoard(game, whiteBot, 'w');
      setEvalScore(currentEval);
      setGame(new Chess(game.fen()));

      const nextRepetition = checkPieceRepetitionDraw(game);
      if (game.isGameOver() || nextRepetition) {
        handleMatchEnd(nextRepetition);
      }
    }
  };

  const handleMatchEnd = (repetitionInfo = null) => {
    setIsPlaying(false);

    if (game.isCheckmate()) {
      const winner = game.turn() === 'w' ? blackBot : whiteBot;
      const resultMsg = `체크메이트! [${winner.name}] 승리!`;
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

    if (game.isDraw() || repetitionInfo) {
      const nextCount = drawState.rematchCount + 1;
      const drawMsg = repetitionInfo
        ? `🤝 5회 반복 이동 무승부 (${repetitionInfo.description})! 1차 재경기를 진행합니다.`
        : nextCount === 1
          ? '🤝 무승부 발생! 규정에 따라 1차 재경기(Rematch)를 진행합니다.'
          : `🤝 ${nextCount}차 연속 무승부! 재경기 또는 형세 판정승을 선택할 수 있습니다.`;

      setDrawState({
        isDraw: true,
        rematchCount: nextCount,
        message: drawMsg
      });
      setMatchResultText(drawMsg);
      setWhiteDialogue(
        repetitionInfo
          ? '기물이 5회 이상 반복 이동하여 무승부 처리되었군! 재경기다!'
          : '무승부라니, 재경기에서 승부를 내겠다!'
      );
      setBlackDialogue(
        repetitionInfo
          ? '반복되는 수로 무승부군. 재경기에서 진짜 승자를 가리자!'
          : '재경기에서 진짜 승자를 가리자!'
      );
    }
  };

  // 교사 경기 취소 핸들러
  const handleCancelMatch = () => {
    if (
      !window.confirm(
        `매치 #${currentMatchIndex + 1} 경기를 취소하시겠습니까?\n진행 중인 보드와 대진 결과가 초기화됩니다.`
      )
    ) {
      return;
    }
    setIsPlaying(false);
    const newG = new Chess();
    setGame(newG);
    setLastMove(null);
    setEvalScore(0);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setMatchResultText(null);
    setDrawState({ isDraw: false, rematchCount: 0, message: '' });

    // 토너먼트 대진표의 현재 매치 승자 기록 초기화
    setTournamentData((prev) => {
      const updated = [...prev.matches];
      if (updated[currentMatchIndex]) {
        updated[currentMatchIndex].winner = null;
      }
      return { ...prev, matches: updated };
    });

    if (whiteBot && blackBot) {
      setWhiteDialogue('경기가 취소되었습니다.');
      setBlackDialogue('경기가 취소되었습니다.');
    }
    sound.playClick();
  };

  // 가위바위보 (RPS) 흑/백 결정전 함수들 (학생 실시간 참여 연동)
  const openRpsModal = async () => {
    setShowRpsModal(true);
    setRpsResult(null);

    const isP1Bot = !whiteBot?.isStudent || whiteBot?.isPractice || whiteBot?.creator === '아레나 AI';
    const isP2Bot = !blackBot?.isStudent || blackBot?.isPractice || blackBot?.creator === '아레나 AI';
    const randomCard = () => ['scissors', 'rock', 'paper'][Math.floor(Math.random() * 3)];

    const initialP1 = isP1Bot ? randomCard() : null;
    const initialP2 = isP2Bot ? randomCard() : null;

    setRpsP1Choice(initialP1);
    setRpsP2Choice(initialP2);

    // Firebase에 실시간 세션 시작 알림 전송 -> 매칭된 학생 화면에 즉시 10초 선택 팝업 발생!
    try {
      await startRpsSession({
        matchId: currentMatchIndex,
        p1Creator: whiteBot?.creator,
        p2Creator: blackBot?.creator,
        p1Name: whiteBot?.name,
        p2Name: blackBot?.name,
        timeLimitSeconds: 10,
        p1Choice: initialP1,
        p2Choice: initialP2
      });
    } catch (e) {
      console.warn('Firebase RPS 세션 시작 에러:', e);
    }
  };

  // 교사의 [📢 결정!] 버튼 클릭 핸들러 (학생들의 선택을 취합하여 최종 결과 공개)
  const handleTeacherDecide = async () => {
    const randomCard = () => ['scissors', 'rock', 'paper'][Math.floor(Math.random() * 3)];

    // 학생이 10초 내에 선택하지 않았거나 실시간 DB 세션 값이 있는 경우 취합
    const p1Final = activeRpsSession?.p1Choice || rpsP1Choice || randomCard();
    const p2Final = activeRpsSession?.p2Choice || rpsP2Choice || randomCard();

    setRpsP1Choice(p1Final);
    setRpsP2Choice(p2Final);

    const winsAgainst = {
      rock: 'scissors',
      scissors: 'paper',
      paper: 'rock'
    };

    let winnerKey = 'tie';
    let outcomeText = '';

    if (p1Final === p2Final) {
      winnerKey = 'tie';
      outcomeText = '🤝 비겼습니다! 다시 가위, 바위, 보 재대결을 시작해주세요!';
      sound.playClick();
    } else if (winsAgainst[p1Final] === p2Final) {
      winnerKey = 'p1';
      outcomeText = `🎉 [${whiteBot?.name}] (${whiteBot?.creator}) 학생 승리! ⚪ 백(선공)을 잡습니다!`;
      try {
        confetti({ particleCount: 80, spread: 70 });
      } catch (e) {}
      sound.playVictory();
    } else {
      winnerKey = 'p2';
      outcomeText = `🎉 [${blackBot?.name}] (${blackBot?.creator}) 학생 승리! ⚪ 백(선공)을 잡습니다!`;
      try {
        confetti({ particleCount: 80, spread: 70 });
      } catch (e) {}
      sound.playVictory();
    }

    const resObj = {
      winner: winnerKey,
      winnerBot: winnerKey === 'p1' ? whiteBot : winnerKey === 'p2' ? blackBot : null,
      loserBot: winnerKey === 'p1' ? blackBot : winnerKey === 'p2' ? whiteBot : null,
      text: outcomeText
    };

    setRpsResult(resObj);

    // Firebase 세션을 'decided'로 갱신하여 학생 화면에도 최종 결과 및 상대 선택이 공개되도록 함!
    try {
      await decideRpsSession({
        matchId: currentMatchIndex,
        p1Creator: whiteBot?.creator,
        p2Creator: blackBot?.creator,
        p1Name: whiteBot?.name,
        p2Name: blackBot?.name,
        p1Choice: p1Final,
        p2Choice: p2Final,
        winner: winnerKey,
        text: outcomeText
      });
    } catch (e) {
      console.warn('Firebase RPS 세션 결정 에러:', e);
    }
  };

  const applyRpsWinner = async () => {
    if (!rpsResult || rpsResult.winner === 'tie') return;

    if (rpsResult.winner === 'p2') {
      // P2가 승리했으므로 P1과 P2의 자리를 맞바꿔서 P2가 White가 되도록 함
      const updatedMatches = [...tournamentData.matches];
      const curr = updatedMatches[currentMatchIndex];
      if (curr) {
        const temp = curr.p1;
        curr.p1 = curr.p2;
        curr.p2 = temp;
        setTournamentData((prev) => ({ ...prev, matches: updatedMatches }));
        loadMatch(curr);
      }
    } else {
      // P1이 승리했으므로 이미 White임. 보드 초기 상태로 재로드
      const curr = tournamentData.matches[currentMatchIndex];
      if (curr) loadMatch(curr);
    }

    setShowRpsModal(false);
    setRpsResult(null);

    // Firebase 세션 종료
    try {
      await closeRpsSession();
    } catch (e) {
      // ignore
    }
  };

  const handleCloseRpsModal = async () => {
    setShowRpsModal(false);
    setRpsResult(null);
    try {
      await closeRpsSession();
    } catch (e) {
      // ignore
    }
  };

  // 재경기 시작
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
    setWhiteDialogue(`[재경기 ${drawState.rematchCount}차전] 승부다!`);
    setBlackDialogue(`[재경기 ${drawState.rematchCount}차전] 받아쳐주마!`);
    sound.playClick();
  };

  // 형세 판정승
  const resolveDrawByEval = () => {
    const winner = evalScore >= 0 ? whiteBot : blackBot;
    setMatchResultText(`형세 판정승: [${winner.name}] 승리 진출!`);
    setDrawState({ isDraw: false, rematchCount: 0, message: '' });
    sound.playVictory();
    advanceTournament(currentMatchIndex, winner);
  };

  const triggerConfetti = () => {
    try {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
      setTimeout(() => {
        confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0 } });
        confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1 } });
      }, 350);
    } catch (e) {
      // ignore
    }
  };

  // 드래그 앤 드롭
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

  const handleDrop = (e, matchIdx, slot) => {
    e.preventDefault();
    setDragOverTarget(null);
    const botId = e.dataTransfer.getData('text/plain') || draggedBotId;
    if (!botId) return;

    let botObj = null;
    if (botId === 'bye-player') {
      botObj = BYE_BOT;
    } else {
      botObj = botPool.find((b) => b.id === botId);
    }

    if (!botObj) return;

    const updated = [...tournamentData.matches];
    if (slot === 'p1') updated[matchIdx].p1 = botObj;
    else updated[matchIdx].p2 = botObj;

    setTournamentData((prev) => ({ ...prev, matches: updated }));

    if (currentMatchIndex === matchIdx) {
      if (slot === 'p1') setWhiteBot(botObj);
      else setBlackBot(botObj);
    }
    sound.playClick();
  };

  const setSlotAsBye = (matchIdx, slot) => {
    const updated = [...tournamentData.matches];
    if (slot === 'p1') updated[matchIdx].p1 = BYE_BOT;
    else updated[matchIdx].p2 = BYE_BOT;

    setTournamentData((prev) => ({ ...prev, matches: updated }));
    if (currentMatchIndex === matchIdx) {
      if (slot === 'p1') setWhiteBot(BYE_BOT);
      else setBlackBot(BYE_BOT);
    }
    sound.playClick();
  };

  const removePlayerFromSlot = (matchIdx, slot, e) => {
    e.stopPropagation();
    const updated = [...tournamentData.matches];
    if (slot === 'p1') updated[matchIdx].p1 = null;
    else updated[matchIdx].p2 = null;
    updated[matchIdx].winner = null;

    setTournamentData((prev) => ({ ...prev, matches: updated }));
    if (currentMatchIndex === matchIdx) {
      if (slot === 'p1') setWhiteBot(null);
      else setBlackBot(null);
    }
  };

  const selectMatch = (idx) => {
    const target = tournamentData.matches[idx];
    if (!target) return;
    setCurrentMatchIndex(idx);
    loadMatch(target);
  };

  const fastForwardMatch = () => {
    setIsPlaying(false);
    if (whiteBot?.isBye) {
      advanceByeWinner(currentMatchIndex, blackBot);
      return;
    }
    if (blackBot?.isBye) {
      advanceByeWinner(currentMatchIndex, whiteBot);
      return;
    }

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

  const evalPercent = Math.min(95, Math.max(5, 50 + evalScore / 25));
  const currentMatch = tournamentData.matches[currentMatchIndex];

  return (
    <div className="arena-container">
      {/* 챔피언 우승 모달 */}
      {tournamentChampion && (
        <div className="champion-modal-backdrop">
          <div className="champion-modal glass-card">
            <Crown size={64} className="trophy-gold-glow animate-bounce" />
            <h2 className="champion-title">🏆 {tournamentSize}강 토너먼트 최종 우승!</h2>
            <div className="champion-card">
              <span className="champ-avatar">{tournamentChampion.avatar}</span>
              <h3>{tournamentChampion.name}</h3>
              <p className="champ-creator">
                {tournamentChampion.isStudent ? '🎓 학생 출품: ' : '설계자: '}
                {tournamentChampion.creator}
              </p>
              <p className="champ-desc">"{tournamentChampion.description}"</p>
            </div>
            <div className="champion-actions">
              <button className="btn btn-primary" onClick={triggerConfetti}>
                🎉 축하 폭죽 다시 쏘기
              </button>
              <button className="btn btn-accent" onClick={clearMatches}>
                새 토너먼트 준비
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상단 헤더 & 컨트롤 */}
      <div className="arena-header glass-card">
        <div className="arena-brand">
          <Tv size={26} className="text-accent" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3>체스 AI 마스터즈 아레나 (Teacher Studio)</h3>
              {currentUser?.role === 'teacher' ? (
                <span className="badge-admin-crown">
                  <Crown size={12} /> 관리자 인증됨 ({currentUser.name})
                </span>
              ) : (
                <button className="badge-admin-login-btn" onClick={onOpenAuthModal}>
                  🔑 교사 구글 로그인 필요
                </button>
              )}
            </div>
            <span className="arena-sub">
              토너먼트 규모(8/16/32강)를 설정하고, 부전승과 연습 봇으로 완벽한 대진표를 만드세요
            </span>
          </div>
        </div>

        <div className="arena-header-controls">
          {/* 규모 선택기 */}
          <div className="size-selector-group">
            <span className="size-label"><Layers size={14} /> 토너먼트 규모:</span>
            {[8, 16, 32].map((sz) => (
              <button
                key={sz}
                className={`size-chip ${tournamentSize === sz ? 'active' : ''}`}
                onClick={() => handleSizeChange(sz)}
              >
                {sz}강전
              </button>
            ))}
          </div>

          <button className="btn btn-secondary btn-sm" onClick={fillRandomMatches}>
            <Shuffle size={14} /> 🎲 자동 랜덤배치
          </button>
          <button className="btn btn-secondary btn-sm" onClick={fillEmptyWithPracticeBots}>
            <Bot size={14} /> 🤖 빈자리 연습봇 채우기
          </button>
          <button className="btn btn-secondary btn-sm" onClick={clearMatches}>
            <RotateCcw size={14} /> 대진표 리셋
          </button>
        </div>
      </div>

      {/* 플레이어 풀 & 부전승 카드 */}
      <div className="player-roster-panel glass-card">
        <div className="roster-header">
          <div className="roster-title">
            <Users size={18} className="text-accent" />
            <h4>참가 플레이어 풀 ({botPool.length}명)</h4>
            <span className="roster-guide">
              👉 플레이어 카드 또는 <strong>부전승(BYE)</strong> 카드를 대진표로 드래그하세요!
            </span>
          </div>
        </div>

        <div className="roster-carousel">
          {/* 부전승(BYE) 전용 드래그 카드 */}
          <div
            className="roster-bot-card bye-card"
            draggable="true"
            onDragStart={(e) => handleDragStart(e, 'bye-player')}
            title="대진표 슬롯에 드래그하여 부전승으로 지정"
          >
            <div className="roster-bot-top">
              <span className="roster-avatar">⏩</span>
              <div className="roster-bot-info">
                <span className="roster-name">부전승 (BYE)</span>
                <span className="roster-creator">시스템 패스</span>
              </div>
            </div>
            <div className="roster-bot-stats">
              <span>상대 선수 자동 진출</span>
            </div>
          </div>

          {botPool.length === 0 ? (
            <div className="roster-empty-notice">
              <span>🌱 아직 등록된 학생 AI가 없습니다. 우측 상단의 <strong>[🤖 빈자리 연습봇 채우기]</strong>를 누르거나 학생들이 등록하면 실시간 표시됩니다.</span>
            </div>
          ) : (
            botPool.map((b) => (
              <div
                key={b.id}
                className={`roster-bot-card ${b.isStudent ? 'student-bot' : ''}`}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, b.id)}
              >
                {/* 교사 관리자용 삭제 버튼 */}
                <button
                  type="button"
                  className="roster-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDeleteBot) onDeleteBot(b.id, b.name);
                  }}
                  title="참가자 명단 및 DB에서 완전히 삭제"
                >
                  <Trash2 size={12} />
                </button>

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
            ))
          )}
        </div>
      </div>

      <div className="arena-grid">
        {/* 좌측: 동적 대진표 (Bracket Panel) */}
        <div className="bracket-panel glass-card">
          <div className="panel-header">
            <h4>
              <Award size={18} /> {tournamentSize}강 토너먼트 대진표
            </h4>
            <span className="badge-live">매치 클릭하여 중계</span>
          </div>

          <div className="bracket-tree scrollable-bracket">
            {tournamentData.rounds.map((roundInfo, rIdx) => {
              const roundMatches = tournamentData.matches.filter((m) => m.roundIndex === rIdx);
              return (
                <div key={roundInfo.key} className="bracket-round">
                  <span className="round-label">{roundInfo.name} ({roundMatches.length}경기)</span>
                  {roundMatches.map((match) => {
                    const isSelected = currentMatchIndex === match.id;
                    const isFirstRound = rIdx === 0;

                    return (
                      <div
                        key={match.id}
                        className={`match-slot ${isSelected ? 'active-match' : ''} ${
                          match.winner ? 'finished' : ''
                        }`}
                        onClick={() => selectMatch(match.id)}
                      >
                        <div className="match-num-tag">매치 #{match.id + 1}</div>

                        {/* P1 슬롯 */}
                        <div
                          className={`participant-drop-slot ${
                            dragOverTarget === `m${match.id}-p1` ? 'slot-hover' : ''
                          } ${match.winner?.id === match.p1?.id ? 'winner' : ''} ${
                            match.p1?.isBye ? 'bye-slot' : ''
                          }`}
                          onDragOver={isFirstRound ? (e) => handleDragOver(e, `m${match.id}-p1`) : undefined}
                          onDragLeave={handleDragLeave}
                          onDrop={isFirstRound ? (e) => handleDrop(e, match.id, 'p1') : undefined}
                        >
                          {match.p1 ? (
                            <div className="slot-assigned">
                              <span className="slot-name">
                                {match.p1.avatar} {match.p1.name}
                                {match.p1.isStudent && <span className="mini-stu-tag">학생</span>}
                              </span>
                              {isFirstRound && (
                                <button
                                  className="slot-remove-btn"
                                  onClick={(e) => removePlayerFromSlot(match.id, 'p1', e)}
                                  title="슬롯 비우기"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          ) : isFirstRound ? (
                            <div className="slot-empty-row">
                              <span className="slot-empty-placeholder">⚪ 선수 드래그</span>
                              <button
                                className="btn-set-bye"
                                onClick={(e) => { e.stopPropagation(); setSlotAsBye(match.id, 'p1'); }}
                              >
                                부전승
                              </button>
                            </div>
                          ) : (
                            <span className="slot-empty-placeholder">이전 라운드 승자 대기</span>
                          )}
                        </div>

                        {/* P2 슬롯 */}
                        <div
                          className={`participant-drop-slot ${
                            dragOverTarget === `m${match.id}-p2` ? 'slot-hover' : ''
                          } ${match.winner?.id === match.p2?.id ? 'winner' : ''} ${
                            match.p2?.isBye ? 'bye-slot' : ''
                          }`}
                          onDragOver={isFirstRound ? (e) => handleDragOver(e, `m${match.id}-p2`) : undefined}
                          onDragLeave={handleDragLeave}
                          onDrop={isFirstRound ? (e) => handleDrop(e, match.id, 'p2') : undefined}
                        >
                          {match.p2 ? (
                            <div className="slot-assigned">
                              <span className="slot-name">
                                {match.p2.avatar} {match.p2.name}
                                {match.p2.isStudent && <span className="mini-stu-tag">학생</span>}
                              </span>
                              {isFirstRound && (
                                <button
                                  className="slot-remove-btn"
                                  onClick={(e) => removePlayerFromSlot(match.id, 'p2', e)}
                                  title="슬롯 비우기"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          ) : isFirstRound ? (
                            <div className="slot-empty-row">
                              <span className="slot-empty-placeholder">⚫ 선수 드래그</span>
                              <button
                                className="btn-set-bye"
                                onClick={(e) => { e.stopPropagation(); setSlotAsBye(match.id, 'p2'); }}
                              >
                                부전승
                              </button>
                            </div>
                          ) : (
                            <span className="slot-empty-placeholder">이전 라운드 승자 대기</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* 중앙: 대형 메인 중계 체스판 & 조작 패널 */}
        <div className="broadcast-panel glass-card">
          {/* 양측 AI 상태 카드 */}
          <div className="fighters-bar">
            {/* 백 */}
            <div
              className={`fighter-card white-fighter ${
                game.turn() === 'w' ? 'turn-active' : ''
              } ${whiteBot?.isBye ? 'bye-fighter' : ''}`}
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
              <div className="captured-tray">
                {capturedByWhite.map((p, i) => (
                  <span key={i} className="captured-mini piece-b">
                    <ChessPieceIcon type={p} color="b" size={18} />
                  </span>
                ))}
              </div>
              {whiteDialogue && <div className="fighter-bubble left-bubble">"{whiteDialogue}"</div>}
            </div>

            {/* VS */}
            <div className="vs-center">
              <span className="vs-badge">VS</span>
              <span className="turn-indicator">
                {currentMatch?.roundName} #{currentMatchIndex + 1}
              </span>
              {whiteBot && blackBot && !whiteBot.isBye && !blackBot.isBye && !matchResultText && (
                <button
                  className="btn-rps-trigger"
                  onClick={openRpsModal}
                  title="가위바위보를 통해 이긴 학생이 ⚪ 백(선공)을 잡습니다"
                >
                  ✌️ 흑/백 결정 가위바위보
                </button>
              )}
            </div>

            {/* 흑 */}
            <div
              className={`fighter-card black-fighter ${
                game.turn() === 'b' ? 'turn-active' : ''
              } ${blackBot?.isBye ? 'bye-fighter' : ''}`}
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
              <div className="captured-tray">
                {capturedByBlack.map((p, i) => (
                  <span key={i} className="captured-mini piece-w">
                    <ChessPieceIcon type={p} color="w" size={18} />
                  </span>
                ))}
              </div>
              {blackDialogue && <div className="fighter-bubble right-bubble">"{blackDialogue}"</div>}
            </div>
          </div>

          {/* 형세 Eval Bar */}
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

          {/* 메인 체스판 */}
          <div className="main-board-wrapper">
            <ChessBoard
              game={game}
              selectedSquare={null}
              validMoves={[]}
              lastMove={lastMove}
              orientation="w"
              isThinking={isPlaying}
            />

            {/* 부전승 즉시 패스 버튼 안내 */}
            {(whiteBot?.isBye || blackBot?.isBye) && !matchResultText && (
              <div className="bye-action-banner animate-fade-in">
                <h4>⏩ 부전승 매치입니다</h4>
                <p>
                  {whiteBot?.isBye ? `[${blackBot?.name}]` : `[${whiteBot?.name}]`} 선수가 다음 라운드로 진출합니다.
                </p>
                <button
                  className="btn btn-accent btn-lg"
                  onClick={() =>
                    advanceByeWinner(
                      currentMatchIndex,
                      whiteBot?.isBye ? blackBot : whiteBot
                    )
                  }
                >
                  <FastForwardIcon size={18} /> 부전승 확정 및 다음 라운드 진출
                </button>
              </div>
            )}

            {/* 경기 결과 및 무승부 재경기 */}
            {matchResultText && (
              <div className="match-result-banner animate-fade-in">
                <h3>{matchResultText}</h3>
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

          {/* 중계 조작 콘솔 */}
          <div className="broadcast-controls">
            <button
              className={`btn ${isPlaying ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={
                !whiteBot ||
                !blackBot ||
                whiteBot.isBye ||
                blackBot.isBye ||
                Boolean(matchResultText)
              }
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              {isPlaying ? '일시정지' : '경기 재생'}
            </button>

            <button
              className="btn btn-secondary"
              onClick={executeOneMove}
              disabled={
                isPlaying ||
                !whiteBot ||
                !blackBot ||
                whiteBot.isBye ||
                blackBot.isBye ||
                Boolean(matchResultText)
              }
            >
              <SkipForward size={18} /> 1수 진행
            </button>

            <button
              className="btn btn-secondary"
              onClick={fastForwardMatch}
              disabled={!whiteBot || !blackBot || Boolean(matchResultText)}
            >
              <FastForward size={18} /> 결과 즉시 판정
            </button>

            <button
              className="btn btn-danger"
              onClick={handleCancelMatch}
              disabled={!whiteBot && !blackBot}
              title="진행 중인 경기를 취소하고 보드를 초기 상태로 되돌립니다"
            >
              <RotateCcw size={18} /> 경기 취소
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

      {/* 흑/백 결정 가위바위보 모달 (교사 컨트롤 화면) */}
      {showRpsModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog glass-card rps-modal">
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon">✌️</span>
                <div>
                  <h3>흑/백 진영 결정전: 가위! 바위! 보!</h3>
                  <p className="modal-desc">
                    학생들 화면에 <strong>10초 카운트다운 선택창</strong>이 팝업되었습니다.
                    <br />
                    학생들이 카드를 고른 후 아래 <strong>[결정!]</strong> 버튼을 눌러주세요.
                  </p>
                </div>
              </div>
              <button className="btn-close" onClick={handleCloseRpsModal}>
                <X size={18} />
              </button>
            </div>

            {/* 실시간 10초 타이머 알림 바 */}
            <div className="teacher-rps-timer-banner">
              <div className="t-timer-info">
                <span>⏱️ 학생 제한 시간: 10초 (10초 경과 시 무작위 자동 제출)</span>
                <span className="t-session-badge">
                  {activeRpsSession?.status === 'decided' ? '판정 완료' : '학생 입력 대기 중'}
                </span>
              </div>
            </div>

            <div className="rps-arena-grid">
              {/* 선수 1 */}
              <div className={`rps-player-card ${rpsResult?.winner === 'p1' ? 'winner' : ''}`}>
                <div className="rps-player-header">
                  <span className="rps-player-avatar">{whiteBot?.avatar || '⚪'}</span>
                  <div>
                    <h4 className="rps-player-name">{whiteBot?.name}</h4>
                    <span className="rps-player-creator">설계자: {whiteBot?.creator} 학생</span>
                  </div>
                </div>

                <div className="rps-card-status-box">
                  {rpsResult ? (
                    <div className="rps-revealed-card">
                      <span className="revealed-icon">
                        {rpsP1Choice === 'scissors' ? '✌️' : rpsP1Choice === 'paper' ? '✋' : '✊'}
                      </span>
                      <span className="revealed-label">
                        {rpsP1Choice === 'scissors' ? '가위' : rpsP1Choice === 'paper' ? '보' : '바위'}
                      </span>
                    </div>
                  ) : (
                    <div className="rps-secret-card">
                      <span className="secret-icon">
                        {activeRpsSession?.p1Choice || rpsP1Choice ? '🎴' : '⏳'}
                      </span>
                      <span className="secret-status-text">
                        {activeRpsSession?.p1Choice || rpsP1Choice ? '카드 제출 완료 (비공개)' : '학생 선택 대기 중...'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* VS */}
              <div className="rps-vs-divider">
                <span className="rps-vs-text">VS</span>
              </div>

              {/* 선수 2 */}
              <div className={`rps-player-card ${rpsResult?.winner === 'p2' ? 'winner' : ''}`}>
                <div className="rps-player-header">
                  <span className="rps-player-avatar">{blackBot?.avatar || '⚫'}</span>
                  <div>
                    <h4 className="rps-player-name">{blackBot?.name}</h4>
                    <span className="rps-player-creator">설계자: {blackBot?.creator} 학생</span>
                  </div>
                </div>

                <div className="rps-card-status-box">
                  {rpsResult ? (
                    <div className="rps-revealed-card">
                      <span className="revealed-icon">
                        {rpsP2Choice === 'scissors' ? '✌️' : rpsP2Choice === 'paper' ? '✋' : '✊'}
                      </span>
                      <span className="revealed-label">
                        {rpsP2Choice === 'scissors' ? '가위' : rpsP2Choice === 'paper' ? '보' : '바위'}
                      </span>
                    </div>
                  ) : (
                    <div className="rps-secret-card">
                      <span className="secret-icon">
                        {activeRpsSession?.p2Choice || rpsP2Choice ? '🎴' : '⏳'}
                      </span>
                      <span className="secret-status-text">
                        {activeRpsSession?.p2Choice || rpsP2Choice ? '카드 제출 완료 (비공개)' : '학생 선택 대기 중...'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 승부 결과 배너 */}
            {rpsResult && (
              <div className={`rps-result-banner ${rpsResult.winner}`}>
                <h4>{rpsResult.text}</h4>
              </div>
            )}

            <div className="modal-actions rps-modal-actions">
              {!rpsResult ? (
                <button
                  className="btn btn-accent btn-lg btn-decide-rps"
                  type="button"
                  onClick={handleTeacherDecide}
                >
                  📢 결정! (학생 선택 결과 공개)
                </button>
              ) : rpsResult.winner === 'tie' ? (
                <button
                  className="btn btn-accent btn-lg"
                  type="button"
                  onClick={openRpsModal}
                >
                  🔄 10초 재대결 시작
                </button>
              ) : (
                <button
                  className="btn btn-accent-success btn-lg"
                  type="button"
                  onClick={applyRpsWinner}
                >
                  ✅ ⚪ 백(선공) 배정 확정하고 대국 준비
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
