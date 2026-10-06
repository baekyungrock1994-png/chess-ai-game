import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { submitRpsChoice } from '../firebase';
import { Clock, Shield, Award, Sparkles } from 'lucide-react';

export default function StudentRpsModal({ session, studentName }) {
  if (!session) return null;

  const isP1 = session.p1Creator === studentName;
  const isP2 = session.p2Creator === studentName;
  if (!isP1 && !isP2) return null;

  const myChoice = isP1 ? session.p1Choice : session.p2Choice;
  const opponentName = isP1 ? session.p2Name : session.p1Name;
  const opponentCreator = isP1 ? session.p2Creator : session.p1Creator;
  const opponentChoice = isP1 ? session.p2Choice : session.p1Choice;

  // 10초 타이머 상태
  const [timeLeft, setTimeLeft] = useState(() => {
    return Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 1000));
  });

  useEffect(() => {
    if (session.status !== 'choosing') return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);

      // 10초 종료 시 미선택 상태면 자동 무작위 제출
      if (remaining <= 0 && !myChoice) {
        const choices = ['scissors', 'rock', 'paper'];
        const auto = choices[Math.floor(Math.random() * 3)];
        submitRpsChoice(studentName, auto);
      }
    }, 200);

    return () => clearInterval(timer);
  }, [session.expiresAt, session.status, myChoice, studentName]);

  // 결정 완료 시 승자 폭죽 효과
  useEffect(() => {
    if (session.status === 'decided') {
      const isWinner =
        (session.winner === 'p1' && isP1) || (session.winner === 'p2' && isP2);
      if (isWinner) {
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch (e) {
          // ignore
        }
      }
    }
  }, [session.status, session.winner, isP1, isP2]);

  const handleSelect = (choice) => {
    if (session.status !== 'choosing' || timeLeft <= 0) return;
    submitRpsChoice(studentName, choice);
  };

  const choiceLabels = {
    scissors: '✌️ 가위',
    rock: '✊ 바위',
    paper: '✋ 보'
  };

  const isWinner =
    session.status === 'decided' &&
    ((session.winner === 'p1' && isP1) || (session.winner === 'p2' && isP2));
  const isLoser =
    session.status === 'decided' &&
    session.winner !== 'tie' &&
    !isWinner;
  const isTie = session.status === 'decided' && session.winner === 'tie';

  const timerPercent = Math.min(100, Math.max(0, (timeLeft / (session.timeLimitSeconds || 10)) * 100));

  return (
    <div className="modal-backdrop student-rps-backdrop">
      <div className="modal-dialog glass-card student-rps-dialog animate-pop-in">
        <div className="student-rps-header">
          <span className="rps-badge-alert">🔥 실시간 대결</span>
          <h2>흑/백 진영 결정전 (가위! 바위! 보!)</h2>
          <p className="student-rps-desc">
            상대 선수 <strong>[{opponentName}]</strong> ({opponentCreator} 학생)와의 승부!
            <br />
            가위바위보에서 이기면 선공인 <strong>⚪ 백(White)</strong>을 잡습니다.
          </p>
        </div>

        {/* 10초 카운트다운 타이머 바 */}
        {session.status === 'choosing' && (
          <div className="student-timer-box">
            <div className="timer-label-row">
              <span>
                <Clock size={14} className={timeLeft <= 3 ? 'text-danger' : ''} /> 남은 선택 시간
              </span>
              <span className={`timer-digits ${timeLeft <= 3 ? 'danger-pulse' : ''}`}>
                {timeLeft}초
              </span>
            </div>
            <div className="timer-progress-track">
              <div
                className={`timer-progress-fill ${timeLeft <= 3 ? 'danger' : ''}`}
                style={{ width: `${timerPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* 선택 단계 */}
        {session.status === 'choosing' ? (
          <div className="student-choice-stage">
            <h4 className="stage-title">가위, 바위, 보 중 하나를 선택하세요!</h4>
            <div className="student-cards-grid">
              {[
                { key: 'scissors', label: '가위', icon: '✌️' },
                { key: 'rock', label: '바위', icon: '✊' },
                { key: 'paper', label: '보', icon: '✋' }
              ].map((card) => {
                const isSelected = myChoice === card.key;
                return (
                  <button
                    key={card.key}
                    type="button"
                    className={`student-card-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(card.key)}
                    disabled={timeLeft <= 0}
                  >
                    <span className="card-big-icon">{card.icon}</span>
                    <span className="card-label">{card.label}</span>
                    {isSelected && <span className="selected-check">선택됨 ✓</span>}
                  </button>
                );
              })}
            </div>

            <div className="student-rps-wait-box">
              {myChoice ? (
                <div className="wait-message-card success">
                  <span className="wait-dot green" />
                  <div>
                    <strong>{choiceLabels[myChoice]} 제출 완료!</strong>
                    <p>선생님이 '결정!' 버튼을 누르면 상대방과의 결과가 공개됩니다.</p>
                  </div>
                </div>
              ) : (
                <div className="wait-message-card warning">
                  <span className="wait-dot amber" />
                  <div>
                    <strong>카드를 선택해주세요!</strong>
                    <p>10초가 지나면 무작위 카드로 자동 제출됩니다.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 결정 완료 단계 (결과 공개) */
          <div className="student-result-stage">
            <div className="showdown-versus-box">
              {/* 내 선택 */}
              <div className={`showdown-side ${isWinner ? 'winner-glow' : ''}`}>
                <span className="side-tag">나 ({studentName})</span>
                <span className="showdown-card-icon">
                  {choiceLabels[myChoice]?.split(' ')[0] || '❓'}
                </span>
                <span className="showdown-card-name">{choiceLabels[myChoice]}</span>
              </div>

              <span className="showdown-vs-text">VS</span>

              {/* 상대 선택 */}
              <div className={`showdown-side ${isLoser ? 'winner-glow' : ''}`}>
                <span className="side-tag">상대 ({opponentCreator})</span>
                <span className="showdown-card-icon">
                  {choiceLabels[opponentChoice]?.split(' ')[0] || '❓'}
                </span>
                <span className="showdown-card-name">{choiceLabels[opponentChoice]}</span>
              </div>
            </div>

            {/* 최종 판정 배너 */}
            <div className={`final-outcome-banner ${isWinner ? 'win' : isTie ? 'tie' : 'lose'}`}>
              {isWinner && (
                <>
                  <Award size={28} />
                  <div>
                    <h3>🎉 가위바위보 승리!</h3>
                    <p>당신이 ⚪ 백(White, 선공)으로 확정되었습니다! 멋진 첫 수를 준비하세요!</p>
                  </div>
                </>
              )}
              {isLoser && (
                <>
                  <Shield size={28} />
                  <div>
                    <h3>⚫ 흑(Black, 후공) 배정</h3>
                    <p>아쉽게 졌지만, 흑 진영으로 상대의 허점을 찌르는 반격 전술을 펼쳐보세요!</p>
                  </div>
                </>
              )}
              {isTie && (
                <>
                  <Sparkles size={28} />
                  <div>
                    <h3>🤝 비겼습니다!</h3>
                    <p>선생님이 재대결을 시작할 때까지 잠시 대기해주세요.</p>
                  </div>
                </>
              )}
            </div>

            <p className="student-waiting-close-hint">
              선생님이 대국 시작을 확정하면 본 화면이 자동으로 종료됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
