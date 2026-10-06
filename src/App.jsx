import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StudentStudio from './components/StudentStudio';
import TeacherArena from './components/TeacherArena';
import { PRESET_BOTS, DEFAULT_BOT_CONFIG } from './data/presetBots';

const STORAGE_KEY_BOT_POOL = 'chess_ai_bot_pool';
const STORAGE_KEY_CURRENT_BOT = 'chess_ai_current_bot';

export default function App() {
  // 현재 뷰: 'studio' (학생 AI 제작) or 'arena' (교사 토너먼트)
  const [activeView, setActiveView] = useState('studio');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 로컬 저장소에서 봇 풀 로드
  const [botPool, setBotPool] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOT_POOL);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return PRESET_BOTS;
  });

  // 현재 편집 중인 봇 로드
  const [currentBot, setCurrentBot] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_BOT);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return DEFAULT_BOT_CONFIG;
  });

  // 봇 풀 변경 시 로컬스토리지 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BOT_POOL, JSON.stringify(botPool));
    } catch (e) {
      // ignore
    }
  }, [botPool]);

  // 봇 저장 핸들러
  const handleSaveBot = (updatedBot) => {
    setCurrentBot(updatedBot);
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_BOT, JSON.stringify(updatedBot));
    } catch (e) {
      // ignore
    }
  };

  // 학생 봇을 토너먼트 참가 풀에 등록
  const handleRegisterToTournament = (newBot) => {
    setBotPool((prev) => {
      const filtered = prev.filter((b) => b.id !== newBot.id);
      return [newBot, ...filtered];
    });
  };

  return (
    <div className="app-layout">
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        botPoolCount={botPool.length}
      />

      <main className="app-main-content">
        {activeView === 'studio' ? (
          <StudentStudio
            currentBot={currentBot}
            onSaveBot={handleSaveBot}
            onRegisterToTournament={handleRegisterToTournament}
          />
        ) : (
          <TeacherArena
            botPool={botPool}
            onAddNewBot={handleRegisterToTournament}
          />
        )}
      </main>
    </div>
  );
}
