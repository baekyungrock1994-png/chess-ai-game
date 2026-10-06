import React from 'react';
import { sound } from '../utils/soundEffects';
import { Sparkles, Trophy, Volume2, VolumeX, Bot, Users } from 'lucide-react';

export default function Navbar({ activeView, setActiveView, soundEnabled, setSoundEnabled, botPoolCount }) {
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
          <span className="tab-pill">설계 & 자체테스트</span>
        </button>

        <button
          className={`nav-tab-btn ${activeView === 'arena' ? 'active' : ''}`}
          onClick={() => setActiveView('arena')}
        >
          <Trophy size={18} />
          <span>교사 아레나 토너먼트</span>
          <span className="tab-pill live-badge">{botPoolCount}개 봇 대결</span>
        </button>
      </nav>

      <div className="nav-extra-actions">
        <button
          className="btn-icon-sound"
          onClick={toggleSound}
          title={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>
    </header>
  );
}
