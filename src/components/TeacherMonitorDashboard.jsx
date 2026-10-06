import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from './ChessBoard';
import { getBestMove, evaluateBoard, getGamePhase } from '../engine/chessEngine';
import { sound } from '../utils/soundEffects';
import {
  Users,
  Eye,
  Sparkles,
  Zap,
  Sliders,
  MessageSquare,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  GraduationCap,
  Bot,
  User,
  Shield,
  Swords,
  UserX,
  RotateCcw,
  Trash2,
  ShieldAlert
} from 'lucide-react';

export default function TeacherMonitorDashboard({
  studentList = [],
  botPool = [],
  onSwitchToSoloStudio,
  onKickStudent,
  onUnbanStudent,
  onDeleteStudent
}) {
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 샌드박스 대국 상태 (선택된 학생 AI 테스트용)
  const [testGame, setTestGame] = useState(() => new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [thinkingLog, setThinkingLog] = useState([]);

  // 첫 진입 시 첫 번째 학생 자동 선택
  useEffect(() => {
    if (studentList.length > 0 && !selectedStudentName) {
      setSelectedStudentName(studentList[0].name);
    }
  }, [studentList]);

  // 선택된 학생의 봇 데이터 (draftBot 우선, 없으면 savedBot)
  const currentStudentData = studentList.find((s) => s.name === selectedStudentName);
  const activeBot =
    currentStudentData?.draftBot || currentStudentData?.savedBot || null;

  // 토너먼트에 제출되었는지 확인
  const isRegisteredToTournament = botPool.some(
    (b) => b.creator === selectedStudentName || b.name === activeBot?.name
  );

  // 검색 필터링된 학생 목록
  const filteredStudents = studentList.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 최근 활동 시간 계산
  const formatLastActive = (timestamp) => {
    if (!timestamp) return '기록 없음';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return '🟢 방금 실시간 작성 중';
    if (diffSec < 300) return `🟢 ${Math.floor(diffSec / 60)}분 전 작성`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전 활동`;
    return `${Math.floor(diffSec / 3600)}시간 전 활동`;
  };

  // 학생 변경 시 테스트 체스판 초기화
  useEffect(() => {
    setTestGame(new Chess());
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setThinkingLog([]);
  }, [selectedStudentName]);

  // 교사가 학생 AI와 테스트 대국
  const handleSquareClick = (square) => {
    if (isAiThinking || !activeBot) return;
    if (testGame.isGameOver()) return;

    sound.playClick();

    if (selectedSquare && validMoves.includes(square)) {
      try {
        const moveRes = testGame.move({ from: selectedSquare, to: square, promotion: 'q' });
        if (moveRes) {
          if (moveRes.captured) sound.playCapture();
          else sound.playMove();

          setLastMove({ from: selectedSquare, to: square });
          setSelectedSquare(null);
          setValidMoves([]);
          setTestGame(new Chess(testGame.fen()));

          // 학생 AI 응답 턴
          if (!testGame.isGameOver()) {
            makeAiMove();
          }
          return;
        }
      } catch (e) {
        // ignore
      }
    }

    const piece = testGame.get(square);
    if (piece && piece.color === testGame.turn()) {
      setSelectedSquare(square);
      const moves = testGame.moves({ square, verbose: true }).map((m) => m.to);
      setValidMoves(moves);
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const makeAiMove = () => {
    setIsAiThinking(true);
    setTimeout(() => {
      const best = getBestMove(testGame, activeBot, 2);
      if (best && best.move) {
        const moveRes = testGame.move(best.move);
        if (moveRes) {
          if (moveRes.captured) sound.playCapture();
          else sound.playMove();

          setLastMove({ from: best.move.from, to: best.move.to });
          setThinkingLog((prev) => [
            {
              turn: testGame.history().length,
              san: best.move.san,
              reason: best.reasoning.text,
              tag: best.reasoning.tag
            },
            ...prev.slice(0, 9)
          ]);
          setTestGame(new Chess(testGame.fen()));
        }
      }
      setIsAiThinking(false);
    }, 500);
  };

  return (
    <div className="monitor-container">
      {/* 상단 컨트롤 배너 */}
      <div className="monitor-topbar glass-card">
        <div className="monitor-brand">
          <Eye size={24} className="text-accent" />
          <div>
            <h3>학생 AI 설계 실시간 관제 대시보드</h3>
            <span className="monitor-sub">
              접속한 학생들이 어떤 프롬프트를 쓰고 스탯을 어떻게 변경하고 있는지 실시간으로 모니터링합니다
            </span>
          </div>
        </div>

        <div className="monitor-top-actions">
          <button className="btn btn-secondary btn-sm" onClick={onSwitchToSoloStudio}>
            <Bot size={15} /> 직접 AI 제작해보기
          </button>
        </div>
      </div>

      <div className="monitor-grid">
        {/* 좌측: 학생 목록 패널 */}
        <div className="monitor-roster-panel glass-card">
          <div className="monitor-panel-header">
            <h4>
              <Users size={16} className="text-accent" /> 접속 학생 목록 ({studentList.length}명)
            </h4>
          </div>

          <div className="student-search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="학생 이름 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="student-roster-scroll">
            {filteredStudents.length === 0 ? (
              <div className="roster-empty-notice">
                {studentList.length === 0
                  ? '🌱 아직 접속한 학생이 없습니다. 학생들이 이름과 비번으로 로그인하면 여기에 실시간으로 뜹니다.'
                  : '검색 결과가 없습니다.'}
              </div>
            ) : (
              filteredStudents.map((s) => {
                const isSelected = s.name === selectedStudentName;
                const isOnline = s.lastActiveAt && (Date.now() - s.lastActiveAt < 120000);
                const hasBot = Boolean(s.draftBot || s.savedBot);
                const isKicked = Boolean(s.isKicked);

                return (
                  <div
                    key={s.name}
                    className={`student-roster-item ${isSelected ? 'selected' : ''} ${isKicked ? 'kicked-item' : ''}`}
                    onClick={() => setSelectedStudentName(s.name)}
                  >
                    <div className="student-item-top">
                      <div className="student-item-avatar-group">
                        <span className="student-item-avatar">
                          {isKicked ? '🚫' : (s.draftBot?.avatar || s.savedBot?.avatar || '🎓')}
                        </span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="student-item-name">{s.name}</span>
                            {isKicked && <span className="mini-badge-kicked">추방됨</span>}
                          </div>
                          <span className="student-bot-name">
                            {isKicked ? '접속 차단됨' : (s.draftBot?.name || s.savedBot?.name || 'AI 미작성')}
                          </span>
                        </div>
                      </div>

                      <div className="roster-item-right-tools">
                        {isKicked ? (
                          <button
                            type="button"
                            className="roster-action-btn unban"
                            title="추방 해제"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnbanStudent?.(s.name);
                            }}
                          >
                            <RotateCcw size={12} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="roster-action-btn kick"
                            title="학생 강제 추방"
                            onClick={(e) => {
                              e.stopPropagation();
                              onKickStudent?.(s.name);
                            }}
                          >
                            <UserX size={12} />
                          </button>
                        )}
                        <span className={`online-dot ${!isKicked && isOnline ? 'active' : ''}`} />
                      </div>
                    </div>

                    <div className="student-item-bottom">
                      <span className="last-active-text">{formatLastActive(s.lastActiveAt)}</span>
                      {botPool.some((b) => b.creator === s.name) && (
                        <span className="mini-badge-submitted">토너먼트 제출완료</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 우측 메인: 선택된 학생의 실시간 설계 관제 화면 */}
        <div className="monitor-detail-panel glass-card">
          {!currentStudentData ? (
            <div className="monitor-no-selection">
              <Eye size={48} className="text-muted" />
              <h4>모니터링할 학생을 좌측 목록에서 선택해주세요</h4>
            </div>
          ) : (
            <div className="student-monitor-content">
              {/* 학생 AI 개요 헤더 */}
              <div className="student-header-banner">
                <div className="student-summary">
                  <span className="bot-huge-avatar">
                    {currentStudentData.isKicked ? '🚫' : (activeBot?.avatar || '🎓')}
                  </span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 className="student-bot-title">
                        {currentStudentData.isKicked
                          ? `${selectedStudentName} (추방됨)`
                          : (activeBot?.name || `${selectedStudentName} 학생`)}
                      </h3>
                      <span className="student-creator-tag">학생: {selectedStudentName}</span>
                      {currentStudentData.isKicked ? (
                        <span className="badge-status-kicked">🚫 접속 차단(추방)됨</span>
                      ) : isRegisteredToTournament ? (
                        <span className="badge-status-ready">🏆 토너먼트 참가 등록 완료</span>
                      ) : activeBot ? (
                        <span className="badge-status-draft">✏️ 스튜디오에서 실시간 편집 중</span>
                      ) : (
                        <span className="badge-status-draft">🌱 로그인 완료 (AI 작성 대기)</span>
                      )}
                    </div>
                    <p className="student-bot-desc">
                      {activeBot?.description || (currentStudentData.isKicked
                        ? '선생님에 의해 강제 퇴장(추방) 조치된 학생입니다.'
                        : '아직 AI 소개글이 작성되지 않았습니다.')}
                    </p>
                  </div>
                </div>

                <div className="student-activity-status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <Clock size={14} />
                    <span>{formatLastActive(currentStudentData.lastActiveAt)}</span>
                  </div>

                  {/* 교사용 학생 제어 버튼군 */}
                  <div className="student-moderation-actions">
                    {currentStudentData.isKicked ? (
                      <button
                        className="btn btn-sm btn-secondary btn-unban"
                        onClick={() => onUnbanStudent?.(selectedStudentName)}
                        title="추방을 해제하고 학생의 재접속을 허용합니다"
                      >
                        <RotateCcw size={14} /> 추방 해제
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-danger-kick"
                        onClick={() => onKickStudent?.(selectedStudentName)}
                        title="학생을 강제 퇴장(로그아웃)시키고 접속을 차단합니다"
                      >
                        <UserX size={14} /> 학생 추방 (강제 퇴장)
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-outline-danger btn-delete-student"
                      onClick={() => onDeleteStudent?.(selectedStudentName)}
                      title="학생 계정과 작성 데이터를 DB에서 영구 삭제합니다"
                    >
                      <Trash2 size={14} /> 완전 삭제
                    </button>
                  </div>
                </div>
              </div>

              {/* 추방된 상태일 때 알림 배너 */}
              {currentStudentData.isKicked && (
                <div className="kicked-banner-card glass-card">
                  <ShieldAlert size={32} className="text-danger" />
                  <div>
                    <h4>현재 강제 퇴장(추방) 처리된 학생입니다</h4>
                    <p>학생 화면에서 즉시 강제 로그아웃되었으며 접속이 차단된 상태입니다. 다시 게임 참여를 허용하시려면 위의 <strong>[추방 해제]</strong> 버튼을 클릭해주세요.</p>
                  </div>
                </div>
              )}

              {/* AI 작성 전인 경우 안내 */}
              {!currentStudentData.isKicked && !activeBot ? (
                <div className="monitor-no-selection" style={{ padding: '60px 20px', minHeight: '300px' }}>
                  <GraduationCap size={44} className="text-accent" />
                  <h4>[{selectedStudentName}] 학생이 아직 AI를 작성하기 전입니다</h4>
                  <p>학생이 스튜디오에서 작성 및 슬라이더 조정을 시작하면 실시간으로 동기화되어 여기에 표시됩니다.</p>
                </div>
              ) : activeBot && (
                <>
                  {/* 3대 국면 실시간 작성 프롬프트 (핵심 관제 영역) */}
                  <div className="monitor-prompts-section">
                <h4 className="section-title">
                  <Sparkles size={16} className="text-accent" /> 실시간 작성 프롬프트 현황
                </h4>

                <div className="prompts-grid">
                  {/* 오프닝 */}
                  <div className="prompt-monitor-card open-card">
                    <div className="prompt-card-header">
                      <span className="phase-badge phase-open">1단계 오프닝 지침</span>
                      <span className="goal-tag">
                        목표: {activeBot.phases?.opening?.primaryGoal || '중앙 장악'}
                      </span>
                    </div>
                    <div className="prompt-text-display">
                      "{activeBot.phases?.opening?.prompt || '작성된 프롬프트가 없습니다.'}"
                    </div>
                  </div>

                  {/* 미들게임 */}
                  <div className="prompt-monitor-card mid-card">
                    <div className="prompt-card-header">
                      <span className="phase-badge phase-mid">2단계 미들게임 지침</span>
                      <span className="goal-tag">
                        전략: {activeBot.phases?.middlegame?.strategy || '전술 공격'}
                      </span>
                    </div>
                    <div className="prompt-text-display">
                      "{activeBot.phases?.middlegame?.prompt || '작성된 프롬프트가 없습니다.'}"
                    </div>
                  </div>

                  {/* 엔드게임 */}
                  <div className="prompt-monitor-card end-card">
                    <div className="prompt-card-header">
                      <span className="phase-badge phase-end">3단계 엔드게임 지침</span>
                      <span className="goal-tag">
                        목표: {activeBot.phases?.endgame?.victoryPlan || '승급'}
                      </span>
                    </div>
                    <div className="prompt-text-display">
                      "{activeBot.phases?.endgame?.prompt || '작성된 프롬프트가 없습니다.'}"
                    </div>
                  </div>
                </div>
              </div>

              {/* 하단 2분할: 100P 스탯/기물 설정 VS 학생 AI 실시간 시뮬레이션 체스판 */}
              <div className="monitor-sub-grid">
                {/* 좌: 스탯 및 기물 설정치 */}
                <div className="monitor-stats-box">
                  <h4 className="section-title">
                    <Zap size={16} className="text-accent" /> 100P 스탯 & 시그니처 전술
                  </h4>

                  <div className="stats-bars-list">
                    <div className="stat-bar-item">
                      <div className="stat-bar-label">
                        <span>⚔️ 공격력</span>
                        <strong>{activeBot.stats?.attack || 0}P</strong>
                      </div>
                      <div className="stat-bar-track">
                        <div
                          className="stat-bar-fill attack"
                          style={{ width: `${activeBot.stats?.attack || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="stat-bar-item">
                      <div className="stat-bar-label">
                        <span>🛡️ 방어력</span>
                        <strong>{activeBot.stats?.defense || 0}P</strong>
                      </div>
                      <div className="stat-bar-track">
                        <div
                          className="stat-bar-fill defense"
                          style={{ width: `${activeBot.stats?.defense || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="stat-bar-item">
                      <div className="stat-bar-label">
                        <span>🌐 중앙 지배</span>
                        <strong>{activeBot.stats?.control || 0}P</strong>
                      </div>
                      <div className="stat-bar-track">
                        <div
                          className="stat-bar-fill control"
                          style={{ width: `${activeBot.stats?.control || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="stat-bar-item">
                      <div className="stat-bar-label">
                        <span>⚡ 기동성</span>
                        <strong>{activeBot.stats?.mobility || 0}P</strong>
                      </div>
                      <div className="stat-bar-track">
                        <div
                          className="stat-bar-fill mobility"
                          style={{ width: `${activeBot.stats?.mobility || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="signature-info-card">
                    <div className="sig-row">
                      <span className="sig-label">필살기 시그니처:</span>
                      <strong className="sig-val">{activeBot.signatureTactic || '기본'}</strong>
                    </div>
                    <div className="sig-row">
                      <span className="sig-label">희생/갬빗 감수도:</span>
                      <strong className="sig-val">{activeBot.riskTolerance || 40}%</strong>
                    </div>
                    <div className="sig-row">
                      <span className="sig-label">대표 대사:</span>
                      <em className="sig-quote">
                        "{activeBot.persona?.dialogues?.matchStart || '정정당당히 겨뤄보자!'}"
                      </em>
                    </div>
                  </div>
                </div>

                {/* 우: 학생 AI 즉석 테스트 스파링 보드 */}
                <div className="monitor-test-board-box">
                  <div className="test-board-header">
                    <h4 className="section-title">
                      <Swords size={16} className="text-accent" /> 선생님 vs [{selectedStudentName}] AI 스파링
                    </h4>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setTestGame(new Chess())}
                    >
                      <RefreshCw size={12} /> 보드 리셋
                    </button>
                  </div>

                  <div className="mini-board-wrapper">
                    <ChessBoard
                      game={testGame}
                      onSquareClick={handleSquareClick}
                      selectedSquare={selectedSquare}
                      validMoves={validMoves}
                      lastMove={lastMove}
                      orientation="w"
                      isThinking={isAiThinking}
                    />
                  </div>

                  {/* AI 실시간 판단 이유 */}
                  {thinkingLog.length > 0 && (
                    <div className="mini-thinking-log">
                      <span className="log-badge">{thinkingLog[0].tag}</span>
                      <span className="log-text">
                        #{thinkingLog[0].turn}수: {thinkingLog[0].reason}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  </div>
</div>
);
}
