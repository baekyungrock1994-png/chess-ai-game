import React from 'react';
import { sound } from '../utils/soundEffects';
import {
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Bot,
  Users,
  Database,
  LogIn,
  LogOut,
  User,
  GraduationCap,
  School
} from 'lucide-react';

export default function Navbar({
  activeView,
  setActiveView,
  soundEnabled,
  setSoundEnabled,
  botPoolCount,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onOpenFirebaseModal,
  isFirebaseReady
}) {
  const toggleSound = () => {
    const isNowOn = sound.toggle();
    setSoundEnabled(isNowOn);
  };

  return (
    <header className="app-navbar glass-card">
      <div className="nav-brand">
        <span className="brand-logo">♟️</span>
        <div className="brand-text">
          <h2>Checkmate AI Lab</h2>
          <span className="brand-subtitle">프롬프트 체스 AI 제작 & 토너먼트 플랫폼</span>
        </div>
      </div>

      <nav className="nav-tabs-group">
        <button
          className={`nav-tab-btn ${activeView === 'studio' ? 'active' : ''}`}
          onClick={() => setActiveView('studio')}
        >
          <Bot size={18} />
          <span>학생 AI 스튜디오</span>
        </button>

        <button
          className={`nav-tab-btn ${activeView === 'arena' ? 'active' : ''}`}
          onClick={() => setActiveView('arena')}
        >
          <Trophy size={18} />
          <span>교사 아레나 토너먼트</span>
          <span className="tab-pill live-badge">{botPoolCount}명 참가</span>
        </button>
      </nav>

      <div className="nav-extra-actions">
        {/* Firebase DB 연결 상태 버튼 */}
        <button
          className={`btn-db-status ${isFirebaseReady ? 'db-connected' : 'db-disconnected'}`}
          onClick={onOpenFirebaseModal}
          title="Firebase Realtime Database 연결 설정"
        >
          <Database size={14} />
          <span>{isFirebaseReady ? 'Firebase 연결됨' : 'DB 설정 필요'}</span>
        </button>

        {/* 사용자 로그인 상태 영역 */}
        {currentUser ? (
          <div className="user-profile-chip">
            {currentUser.role === 'teacher' ? (
              <School size={16} className="text-accent" />
            ) : (
              <GraduationCap size={16} className="text-accent" />
            )}
            <span className="user-chip-name">{currentUser.name}</span>
            <span className="user-chip-role">
              {currentUser.role === 'teacher' ? '선생님' : '학생'}
            </span>
            <button className="btn-logout-mini" onClick={onLogout} title="로그아웃">
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={onOpenAuthModal}>
            <LogIn size={14} /> 로그인
          </button>
        )}

        {/* 사운드 토글 */}
        <button
          className="btn-icon-sound"
          onClick={toggleSound}
          title={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>
    </header>
  );
}
