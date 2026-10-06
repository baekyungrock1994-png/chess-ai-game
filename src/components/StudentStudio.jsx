import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from './ChessBoard';
import { getBestMove, evaluateBoard, getGamePhase } from '../engine/chessEngine';
import { DEFAULT_BOT_CONFIG, PRESET_BOTS } from '../data/presetBots';
import { sound } from '../utils/soundEffects';
import {
  Sparkles,
  Swords,
  Shield,
  RotateCcw,
  Play,
  Pause,
  Bot,
  User,
  HelpCircle,
  Save,
  Download,
  Share2,
  Sliders,
  MessageSquare,
  Award,
  Zap,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export default function StudentStudio({ currentBot, currentUser, onSaveBot, onRegisterToTournament, onOpenAuthModal }) {
  // 봇 설정 상태
  const [bot, setBot] = useState(() => {
    const base = currentBot || DEFAULT_BOT_CONFIG;
    if (currentUser?.name && !base.creator) {
      return { ...base, creator: currentUser.name };
    }
    return base;
  });
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'pieces' | 'phases' | 'persona'
  const [saveToast, setSaveToast] = useState('');

  // 로그인 상태 동기화
  useEffect(() => {
    if (currentUser?.name) {
      setBot((prev) => ({ ...prev, creator: currentUser.name }));
    }
  }, [currentUser]);

  // 샌드박스 게임 상태
  const [game, setGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [playerColor, setPlayerColor] = useState('w'); // 'w' (학생 백) or 'b' (학생 흑)
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [gameMode, setGameMode] = useState('human_vs_ai'); // 'human_vs_ai' | 'ai_vs_ai'
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [thinkingLog, setThinkingLog] = useState([]);
  const [speechBubble, setSpeechBubble] = useState('');
  const [gameResult, setGameResult] = useState(null);

  const autoPlayTimerRef = useRef(null);

  // 스탯 총합 계산 (100포인트 제한 검증)
  const totalStats =
    (bot.stats.attack || 0) +
    (bot.stats.defense || 0) +
    (bot.stats.control || 0) +
    (bot.stats.mobility || 0);

  // AI 턴 처리
  useEffect(() => {
    if (game.isGameOver()) {
      handleGameOver();
      return;
    }

    const currentTurn = game.turn();
    const isAiTurn =
      (gameMode === 'human_vs_ai' && currentTurn !== playerColor) ||
      (gameMode === 'ai_vs_ai' && isAutoPlaying);

    if (isAiTurn && !isAiThinking) {
      makeAiMove();
    }
  }, [game, playerColor, gameMode, isAutoPlaying]);

  const handleGameOver = () => {
    setIsAutoPlaying(false);
    if (game.isCheckmate()) {
      const winner = game.turn() === 'w' ? '흑(Black)' : '백(White)';
      const isAiWinner =
        (winner.startsWith('흑') && playerColor === 'w') ||
        (winner.startsWith('백') && playerColor === 'b');

      setGameResult(`체크메이트! ${winner} 승리!`);
      if (isAiWinner) {
        sound.playVictory();
        setSpeechBubble(bot.persona?.dialogues?.onVictory || '체크메이트! 완벽한 승리다!');
      } else {
        sound.playVictory();
        setSpeechBubble(bot.persona?.dialogues?.onCrisis || '훌륭한 승부였다! 다시 한 번 붙어보자.');
      }
    } else if (game.isDraw()) {
      setGameResult('무승부! 승부를 가리기 위해 재경기를 진행할 수 있습니다.');
      setSpeechBubble('팽팽한 접전 끝에 무승부로 끝났군! 재경기로 진짜 승부를 가려보자.');
    }
  };

  const makeAiMove = () => {
    setIsAiThinking(true);
    const delay = gameMode === 'ai_vs_ai' ? 400 : 600;

    setTimeout(() => {
      const best = getBestMove(game, bot, 2);
      if (best && best.move) {
        const moveRes = game.move(best.move);
        if (moveRes) {
          if (moveRes.captured) sound.playCapture();
          else sound.playMove();

          if (game.inCheck()) {
            sound.playCheck();
            setSpeechBubble(bot.persona?.dialogues?.onCheck || '체크! 압박을 견딜 수 있겠나?');
          } else if (moveRes.captured) {
            setSpeechBubble(bot.persona?.dialogues?.onCapture || '기물을 포획했다!');
          }

          setLastMove({ from: best.move.from, to: best.move.to });
          setThinkingLog((prev) => [
            {
              turn: game.history().length,
              san: best.move.san,
              piece: best.move.piece,
              eval: best.evalScore,
              reason: best.reasoning.text,
              tag: best.reasoning.tag,
              time: new Date().toLocaleTimeString().slice(3, 8)
            },
            ...prev.slice(0, 19)
          ]);

          setGame(new Chess(game.fen()));
        }
      }
      setIsAiThinking(false);
    }, delay);
  };

  // 플레이어 칸 클릭 핸들러
  const handleSquareClick = (square) => {
    if (isAiThinking || (gameMode === 'human_vs_ai' && game.turn() !== playerColor)) {
      return;
    }
    if (game.isGameOver()) return;

    sound.playClick();

    // 1. 이미 선택된 칸이 있고 유효한 목표 지점을 클릭한 경우 -> 이동 실행
    if (selectedSquare && validMoves.includes(square)) {
      try {
        const moveRes = game.move({
          from: selectedSquare,
          to: square,
          promotion: 'q' // 기본 퀸 승급
        });

        if (moveRes) {
          if (moveRes.captured) sound.playCapture();
          else sound.playMove();

          if (game.inCheck()) sound.playCheck();

          setLastMove({ from: selectedSquare, to: square });
          setSelectedSquare(null);
          setValidMoves([]);
          setGame(new Chess(game.fen()));
          return;
        }
      } catch (e) {
        // 유효하지 않은 이동인 경우 무시
      }
    }

    // 2. 기물 선택
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true }).map((m) => m.to);
      setValidMoves(moves);
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  // 게임 제어 함수들
  const resetGame = () => {
    setIsAutoPlaying(false);
    const newG = new Chess();
    setGame(newG);
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setGameResult(null);
    setThinkingLog([]);
    setSpeechBubble(bot.persona?.dialogues?.matchStart || '새로운 대국을 시작해보자!');
    sound.playClick();
  };

  const undoMove = () => {
    if (game.history().length === 0) return;
    setIsAutoPlaying(false);
    // 사람 vs AI 모드일 경우 사람 수와 AI 수를 모두 2수 무르기
    if (gameMode === 'human_vs_ai' && game.history().length >= 2) {
      game.undo();
      game.undo();
    } else {
      game.undo();
    }
    setGame(new Chess(game.fen()));
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setGameResult(null);
    sound.playClick();
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying((prev) => !prev);
  };

  // 스탯 조정 함수 (100포인트 총합 유지 또는 경고)
  const handleStatChange = (key, value) => {
    const num = Math.max(0, Math.min(80, parseInt(value, 10) || 0));
    setBot((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [key]: num
      }
    }));
  };

  // 기물 설정 변경
  const handlePieceChange = (pieceKey, field, value) => {
    setBot((prev) => ({
      ...prev,
      pieceSettings: {
        ...prev.pieceSettings,
        [pieceKey]: {
          ...prev.pieceSettings[pieceKey],
          [field]: value
        }
      }
    }));
  };

  // 페이즈 설정 변경
  const handlePhaseChange = (phaseKey, field, value) => {
    setBot((prev) => ({
      ...prev,
      phases: {
        ...prev.phases,
        [phaseKey]: {
          ...prev.phases[phaseKey],
          [field]: value
        }
      }
    }));
  };

  // 템플릿 불러오기
  const applyPreset = (presetBot) => {
    setBot({ ...presetBot, id: `bot-${Date.now()}` });
    showToast(`'${presetBot.name}' 프리셋 템플릿을 불러왔습니다!`);
  };

  // 저장 및 제출
  const handleSave = () => {
    if (onSaveBot) onSaveBot(bot);
    showToast('AI 설계가 성공적으로 저장되었습니다!');
  };

  const handleRegister = () => {
    const studentBot = {
      ...bot,
      id: bot.id?.startsWith('student-') ? bot.id : `student-${Date.now()}`,
      isStudent: true,
      registeredAt: Date.now()
    };
    handleSave();
    if (onRegisterToTournament) {
      onRegisterToTournament(studentBot);
      showToast(`'${studentBot.name}' AI가 교사 토너먼트 명단에 성공적으로 등록되었습니다! 🏆`);
    }
  };

  const showToast = (msg) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(''), 3000);
  };

  const downloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bot, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `${bot.name}_chess_ai.json`);
    dlAnchor.click();
  };

  return (
    <div className="studio-container">
      {/* 토스트 알림 */}
      {saveToast && (
        <div className="toast-banner">
          <CheckCircle2 size={18} />
          <span>{saveToast}</span>
        </div>
      )}

      {/* 상단 프로필 헤더 */}
      <div className="studio-topbar glass-card">
        <div className="bot-profile-preview">
          <span className="bot-avatar-badge">{bot.avatar}</span>
          <div className="bot-title-group">
            <div className="bot-name-row">
              <input
                type="text"
                className="bot-name-input"
                value={bot.name}
                onChange={(e) => setBot({ ...bot, name: e.target.value })}
                placeholder="AI 봇 이름 입력"
              />
              <span className="creator-tag">설계자: {bot.creator}</span>
            </div>
            <input
              type="text"
              className="bot-desc-input"
              value={bot.description}
              onChange={(e) => setBot({ ...bot, description: e.target.value })}
              placeholder="한 줄 전략 소개 (예: 맹렬한 나이트 공격과 중앙 장악형)"
            />
          </div>
        </div>

        <div className="studio-actions">
          <button className="btn btn-secondary" onClick={downloadJson} title="JSON 파일로 다운로드">
            <Download size={16} /> JSON 내보내기
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={16} /> 내 AI 저장
          </button>
          <button className="btn btn-accent" onClick={handleRegister}>
            <Award size={16} /> 토너먼트 참가 등록
          </button>
        </div>
      </div>

      <div className="studio-main-grid">
        {/* 좌측: AI 설계 패널 */}
        <div className="studio-left-panel glass-card">
          {/* 네비게이션 탭 */}
          <div className="studio-tabs">
            <button
              className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              <Zap size={16} /> 100P 스탯 배분
            </button>
            <button
              className={`tab-btn ${activeTab === 'pieces' ? 'active' : ''}`}
              onClick={() => setActiveTab('pieces')}
            >
              <Sliders size={16} /> 기물별 성향
            </button>
            <button
              className={`tab-btn ${activeTab === 'phases' ? 'active' : ''}`}
              onClick={() => setActiveTab('phases')}
            >
              <Sparkles size={16} /> 초·중·후반 프롬프트
            </button>
            <button
              className={`tab-btn ${activeTab === 'persona' ? 'active' : ''}`}
              onClick={() => setActiveTab('persona')}
            >
              <MessageSquare size={16} /> 대사 & 시그니처
            </button>
          </div>

          <div className="tab-content-area">
            {/* 탭 1: 100포인트 스탯 분배 */}
            {activeTab === 'stats' && (
              <div className="tab-pane stats-pane">
                <div className="pane-header">
                  <div>
                    <h4>100포인트 밸런스 스탯 시스템</h4>
                    <p className="pane-desc">
                      공격, 수비, 공간장악, 기동성에 총 100포인트를 지혜롭게 분배하세요.
                    </p>
                  </div>
                  <div className={`point-counter ${totalStats === 100 ? 'valid' : 'invalid'}`}>
                    <span>사용 포인트: {totalStats} / 100</span>
                    {totalStats !== 100 && (
                      <span className="point-warning">
                        {totalStats < 100 ? `(${100 - totalStats}P 남음)` : `(${totalStats - 100}P 초과!)`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="stats-slider-grid">
                  <div className="stat-card">
                    <div className="stat-label-row">
                      <span className="stat-name">⚔️ 공격성 (Attack)</span>
                      <span className="stat-val">{bot.stats.attack}P</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="70"
                      value={bot.stats.attack}
                      onChange={(e) => handleStatChange('attack', e.target.value)}
                    />
                    <span className="stat-hint">상대 기물 포획 및 킹 공격 시 적극적인 가산점</span>
                  </div>

                  <div className="stat-card">
                    <div className="stat-label-row">
                      <span className="stat-name">🛡️ 방어력 (Defense)</span>
                      <span className="stat-val">{bot.stats.defense}P</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="70"
                      value={bot.stats.defense}
                      onChange={(e) => handleStatChange('defense', e.target.value)}
                    />
                    <span className="stat-hint">캐슬링 및 아군 기물 보호, 폰 체인 유지 우선</span>
                  </div>

                  <div className="stat-card">
                    <div className="stat-label-row">
                      <span className="stat-name">🌐 중앙 지배 (Control)</span>
                      <span className="stat-val">{bot.stats.control}P</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="70"
                      value={bot.stats.control}
                      onChange={(e) => handleStatChange('control', e.target.value)}
                    />
                    <span className="stat-hint">중앙 4칸(d4, d5, e4, e5) 점령 및 대각선 확보</span>
                  </div>

                  <div className="stat-card">
                    <div className="stat-label-row">
                      <span className="stat-name">⚡ 기동성 (Mobility)</span>
                      <span className="stat-val">{bot.stats.mobility}P</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="70"
                      value={bot.stats.mobility}
                      onChange={(e) => handleStatChange('mobility', e.target.value)}
                    />
                    <span className="stat-hint">기물들의 이동 가능한 선택지의 폭(활동 반경) 중시</span>
                  </div>
                </div>

                {/* 전략 설계 가이드 팁 */}
                <div className="strategy-tips-card">
                  <h5>💡 100포인트 배분 전략 가이드</h5>
                  <div className="strategy-tip-grid">
                    <div className="tip-box">
                      <strong>⚔️ 속공 공격형</strong>
                      <p>공격 55P + 기동성 25P + 중앙 15P + 방어 5P</p>
                    </div>
                    <div className="tip-box">
                      <strong>🛡️ 철벽 요새형</strong>
                      <p>방어 55P + 중앙 25P + 공격 10P + 기동성 10P</p>
                    </div>
                    <div className="tip-box">
                      <strong>🌐 정통 밸런스형</strong>
                      <p>공격 30P + 방어 30P + 중앙 25P + 기동성 15P</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 탭 2: 기물별 공격성향 및 가치관 */}
            {activeTab === 'pieces' && (
              <div className="tab-pane pieces-pane">
                <div className="pane-header">
                  <div>
                    <h4>체스 기물별 성향 & 가치 설정</h4>
                    <p className="pane-desc">각 기물의 가치 가중치와 공격성을 조절하여 AI만의 기물 운용 스타일을 만드세요.</p>
                  </div>
                </div>

                <div className="pieces-list">
                  {Object.entries(bot.pieceSettings || {}).map(([key, setting]) => (
                    <div key={key} className="piece-setting-item">
                      <div className="piece-item-top">
                        <span className="piece-item-name">{setting.label}</span>
                        <div className="piece-role-selector">
                          <label>운용 역할: </label>
                          <select
                            value={setting.role}
                            onChange={(e) => handlePieceChange(key, 'role', e.target.value)}
                          >
                            {key === 'pawn' && (
                              <>
                                <option value="breakthrough">중앙 돌파형</option>
                                <option value="shield">견고한 방패형</option>
                                <option value="storm">폰 쓰나미형</option>
                              </>
                            )}
                            {key === 'knight' && (
                              <>
                                <option value="fork_hunter">기습 포크 사냥꾼</option>
                                <option value="center_invader">중앙 침투형</option>
                                <option value="guardian">아군 호위형</option>
                              </>
                            )}
                            {key === 'bishop' && (
                              <>
                                <option value="sniper">장거리 스나이퍼</option>
                                <option value="pin_master">핀(Pin) 유도형</option>
                                <option value="diagonal_controller">대각선 지배자</option>
                              </>
                            )}
                            {key === 'rook' && (
                              <>
                                <option value="open_file">오픈 파일 장악형</option>
                                <option value="battery">관통 배터리형</option>
                                <option value="backrank">백랭크 수비형</option>
                              </>
                            )}
                            {key === 'queen' && (
                              <>
                                <option value="striker">단독 돌격 대장</option>
                                <option value="finisher">결정적 피니셔</option>
                                <option value="tactician">만능 전술가</option>
                              </>
                            )}
                            {key === 'king' && (
                              <>
                                <option value="castle_bunker">철벽 캐슬링형</option>
                                <option value="commander">전선 지휘형</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="piece-sliders-row">
                        <div className="slider-box">
                          <div className="sub-label">
                            <span>공격 적극성</span>
                            <span className="val-text">{setting.aggression} / 100</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={setting.aggression}
                            onChange={(e) =>
                              handlePieceChange(key, 'aggression', parseInt(e.target.value, 10))
                            }
                          />
                        </div>

                        {key !== 'king' && (
                          <div className="slider-box">
                            <div className="sub-label">
                              <span>가치 가중치</span>
                              <span className="val-text">{setting.weight} 점</span>
                            </div>
                            <input
                              type="range"
                              min={key === 'pawn' ? 50 : 200}
                              max={key === 'queen' ? 1400 : 700}
                              step="10"
                              value={setting.weight}
                              onChange={(e) =>
                                handlePieceChange(key, 'weight', parseInt(e.target.value, 10))
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 탭 3: 초·중·후반 흐름 & 자연어 프롬프트 */}
            {activeTab === 'phases' && (
              <div className="tab-pane phases-pane">
                <div className="pane-header">
                  <div>
                    <h4>초반·중반·후반 흐름 전략 프롬프트</h4>
                    <p className="pane-desc">
                      각 국면별 핵심 지침과 AI에게 부여할 자연어 프롬프트를 작성하세요.
                    </p>
                  </div>
                </div>

                {/* 1. 오프닝 */}
                <div className="phase-card">
                  <div className="phase-card-title">
                    <span className="phase-badge phase-open">1단계: 오프닝 (초반 1~16수)</span>
                    <select
                      className="phase-select"
                      value={bot.phases.opening.primaryGoal}
                      onChange={(e) => handlePhaseChange('opening', 'primaryGoal', e.target.value)}
                    >
                      <option value="center_control">중앙(e4/d4) 강력 지배</option>
                      <option value="rapid_dev">초고속 마이너 기물 전개</option>
                      <option value="king_safety">초반 빠른 캐슬링(킹 안전)</option>
                    </select>
                  </div>
                  <label className="prompt-label">AI에게 내릴 자연어 지시 프롬프트:</label>
                  <textarea
                    className="prompt-textarea"
                    rows="2"
                    value={bot.phases.opening.prompt}
                    onChange={(e) => handlePhaseChange('opening', 'prompt', e.target.value)}
                    placeholder="예) 초반 폰을 중앙에 배치하고 빠르게 마이너 기물을 전개하여 캐슬링을 준비하라."
                  />
                </div>

                {/* 2. 미들게임 */}
                <div className="phase-card">
                  <div className="phase-card-title">
                    <span className="phase-badge phase-mid">2단계: 미들게임 (중반 전면전)</span>
                    <select
                      className="phase-select"
                      value={bot.phases.middlegame.strategy}
                      onChange={(e) => handlePhaseChange('middlegame', 'strategy', e.target.value)}
                    >
                      <option value="tactical_assault">적극적 전술 공격 & 체크 위협</option>
                      <option value="positional_squeeze">진형 유지 & 상대 실수 유도</option>
                      <option value="piece_exchange">적절한 기물 교환 & 단순화</option>
                    </select>
                  </div>
                  <label className="prompt-label">AI에게 내릴 자연어 지시 프롬프트:</label>
                  <textarea
                    className="prompt-textarea"
                    rows="2"
                    value={bot.phases.middlegame.prompt}
                    onChange={(e) => handlePhaseChange('middlegame', 'prompt', e.target.value)}
                    placeholder="예) 나이트와 비숍의 협공으로 핀과 포크를 노리고, 기회가 오면 상대 킹을 향해 전면 공격하라."
                  />
                </div>

                {/* 3. 엔드게임 */}
                <div className="phase-card">
                  <div className="phase-card-title">
                    <span className="phase-badge phase-end">3단계: 엔드게임 (후반 마무리)</span>
                    <select
                      className="phase-select"
                      value={bot.phases.endgame.victoryPlan}
                      onChange={(e) => handlePhaseChange('endgame', 'victoryPlan', e.target.value)}
                    >
                      <option value="pawn_promotion">폰 프로모션(승급) 최우선</option>
                      <option value="speed_mate">최단거리 체크메이트</option>
                      <option value="cleanup">상대 잔여 기물 소탕</option>
                    </select>
                  </div>
                  <label className="prompt-label">AI에게 내릴 자연어 지시 프롬프트:</label>
                  <textarea
                    className="prompt-textarea"
                    rows="2"
                    value={bot.phases.endgame.prompt}
                    onChange={(e) => handlePhaseChange('endgame', 'prompt', e.target.value)}
                    placeholder="예) 아군 폰을 호위하여 빠르게 퀸으로 승급시키고 확실한 체크메이트를 완성하라."
                  />
                </div>
              </div>
            )}

            {/* 탭 4: 대사 & 시그니처 전술 */}
            {activeTab === 'persona' && (
              <div className="tab-pane persona-pane">
                <div className="pane-header">
                  <div>
                    <h4>시그니처 전술 & 페르소나 대사</h4>
                    <p className="pane-desc">AI의 대표 필살기 전술과 경기 중 말풍선으로 외칠 대사를 설정하세요.</p>
                  </div>
                </div>

                <div className="persona-grid">
                  <div className="field-group">
                    <label>대표 시그니처 전술 (필살기)</label>
                    <select
                      value={bot.signatureTactic}
                      onChange={(e) => setBot({ ...bot, signatureTactic: e.target.value })}
                    >
                      <option value="fork_master">🐎 포크 마스터 (나이트 다중 타격 우선)</option>
                      <option value="queen_battery">👑 퀸-룩 관통 배터리 (일직선 돌파)</option>
                      <option value="pawn_storm">♟️ 폰 쓰나미 (폰 연쇄 전진으로 방어선 붕괴)</option>
                      <option value="gambit_rush">⚡ 갬빗 러시 (기물 희생 감수 공격)</option>
                      <option value="iron_fortress">🛡️ 강철 요새 (철벽 방어 및 카운터)</option>
                    </select>
                  </div>

                  <div className="field-group">
                    <div className="sub-label">
                      <span>갬빗/리스크 허용도</span>
                      <span className="val-text">{bot.riskTolerance}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="90"
                      value={bot.riskTolerance}
                      onChange={(e) =>
                        setBot({ ...bot, riskTolerance: parseInt(e.target.value, 10) })
                      }
                    />
                    <span className="stat-hint">높을수록 과감한 기물 희생과 기습 묘수를 시도합니다.</span>
                  </div>

                  <div className="field-group full-width">
                    <label>아바타 이모지</label>
                    <div className="avatar-picker">
                      {['⚔️', '🛡️', '🧙‍♂️', '🐎', '🎯', '👑', '⚡', '♟️', '🔥', '🐲', '🤖', '🦅'].map(
                        (emo) => (
                          <button
                            key={emo}
                            type="button"
                            className={`avatar-choice-btn ${bot.avatar === emo ? 'active' : ''}`}
                            onClick={() => setBot({ ...bot, avatar: emo })}
                          >
                            {emo}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="field-group full-width">
                    <label>경기 시작 시 대사</label>
                    <input
                      type="text"
                      value={bot.persona?.dialogues?.matchStart || ''}
                      onChange={(e) =>
                        setBot({
                          ...bot,
                          persona: {
                            ...bot.persona,
                            dialogues: { ...bot.persona?.dialogues, matchStart: e.target.value }
                          }
                        })
                      }
                      placeholder="경기 시작 시 외칠 대사"
                    />
                  </div>

                  <div className="field-group full-width">
                    <label>상대 기물 포획 시 대사</label>
                    <input
                      type="text"
                      value={bot.persona?.dialogues?.onCapture || ''}
                      onChange={(e) =>
                        setBot({
                          ...bot,
                          persona: {
                            ...bot.persona,
                            dialogues: { ...bot.persona?.dialogues, onCapture: e.target.value }
                          }
                        })
                      }
                      placeholder="기물을 잡았을 때 도발 대사"
                    />
                  </div>

                  <div className="field-group full-width">
                    <label>체크 걸었을 때 대사</label>
                    <input
                      type="text"
                      value={bot.persona?.dialogues?.onCheck || ''}
                      onChange={(e) =>
                        setBot({
                          ...bot,
                          persona: {
                            ...bot.persona,
                            dialogues: { ...bot.persona?.dialogues, onCheck: e.target.value }
                          }
                        })
                      }
                      placeholder="체크 공격 시 대사"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 우측: 샌드박스 자체 플레이 테스트 보드 */}
        <div className="studio-right-panel glass-card">
          <div className="sandbox-header">
            <div className="sandbox-title-row">
              <h4>🎯 자체 테스트 샌드박스 (Self-Play)</h4>
              <span className="phase-pill">
                국면: {getGamePhase(game) === 'opening' ? '초반 오프닝' : getGamePhase(game) === 'middlegame' ? '중반 미들게임' : '후반 엔드게임'}
              </span>
            </div>

            {/* 모드 선택 및 진영 설정 */}
            <div className="sandbox-controls-bar">
              <div className="btn-group">
                <button
                  className={`btn-toggle ${gameMode === 'human_vs_ai' ? 'active' : ''}`}
                  onClick={() => {
                    setGameMode('human_vs_ai');
                    setIsAutoPlaying(false);
                  }}
                >
                  <User size={14} /> 학생 vs 내 AI
                </button>
                <button
                  className={`btn-toggle ${gameMode === 'ai_vs_ai' ? 'active' : ''}`}
                  onClick={() => {
                    setGameMode('ai_vs_ai');
                  }}
                >
                  <Bot size={14} /> AI vs 미러 AI 자동
                </button>
              </div>

              {gameMode === 'human_vs_ai' && (
                <button
                  className="btn-flip"
                  onClick={() => setPlayerColor(playerColor === 'w' ? 'b' : 'w')}
                  title="학생 진영 전환"
                >
                  진영: {playerColor === 'w' ? '백(선공)' : '흑(후공)'}
                </button>
              )}
            </div>
          </div>

          {/* AI 실시간 대사 말풍선 */}
          {speechBubble && (
            <div className="ai-speech-bubble">
              <span className="bubble-avatar">{bot.avatar}</span>
              <div className="bubble-content">
                <strong>{bot.name}:</strong> "{speechBubble}"
              </div>
            </div>
          )}

          {/* 체스판 */}
          <div className="board-center-wrapper">
            <ChessBoard
              game={game}
              onSquareClick={handleSquareClick}
              selectedSquare={selectedSquare}
              validMoves={validMoves}
              lastMove={lastMove}
              orientation={playerColor}
              isThinking={isAiThinking}
            />

            {gameResult && (
              <div className="game-result-overlay">
                <h3>{gameResult}</h3>
                <button className="btn btn-primary" onClick={resetGame}>
                  다시 대국하기
                </button>
              </div>
            )}
          </div>

          {/* 하단 보드 조작 버튼들 */}
          <div className="board-actions-row">
            <button className="btn btn-secondary btn-sm" onClick={resetGame}>
              <RefreshCw size={14} /> 판 초기화
            </button>
            <button className="btn btn-secondary btn-sm" onClick={undoMove}>
              <RotateCcw size={14} /> 수 무르기(Undo)
            </button>

            {gameMode === 'ai_vs_ai' && (
              <button
                className={`btn btn-sm ${isAutoPlaying ? 'btn-danger' : 'btn-accent'}`}
                onClick={toggleAutoPlay}
              >
                {isAutoPlaying ? <Pause size={14} /> : <Play size={14} />}
                {isAutoPlaying ? '일시정지' : '자동 대결 시작'}
              </button>
            )}
          </div>

          {/* 실시간 AI 사고 로그 (Thinking Log) */}
          <div className="thinking-log-card">
            <div className="log-header">
              <h5>🧠 AI 실시간 의사결정 해설 (Thinking Log)</h5>
              <span className="log-count">{thinkingLog.length}개 기록</span>
            </div>
            <div className="log-scroll-area">
              {thinkingLog.length === 0 ? (
                <div className="log-empty">
                  수를 두면 AI가 학생의 프롬프트와 기물 성향을 어떻게 반영했는지 여기에 해설이 표시됩니다.
                </div>
              ) : (
                thinkingLog.map((item, idx) => (
                  <div key={idx} className="log-entry">
                    <div className="log-meta">
                      <span className="log-tag">{item.tag}</span>
                      <span className="log-san">#{item.turn}수 {item.san}</span>
                      <span className="log-time">{item.time}</span>
                    </div>
                    <p className="log-text">{item.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
