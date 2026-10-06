import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StudentStudio from './components/StudentStudio';
import TeacherArena from './components/TeacherArena';
import FirebaseConfigModal from './components/FirebaseConfigModal';
import AuthModal from './components/AuthModal';
import {
  isFirebaseConfigured,
  subscribeToBots,
  registerBotToFirebase,
  saveStudentBot,
  logoutAuth
} from './firebase';
import { DEFAULT_BOT_CONFIG } from './data/presetBots';

export default function App() {
  const [activeView, setActiveView] = useState('studio');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 모달 상태
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isFirebaseReady, setIsFirebaseReady] = useState(isFirebaseConfigured());

  // 로그인 상태
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('chess_ai_current_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return null;
  });

  // 실시간 봇 풀 (Firebase Realtime Database 동기화)
  const [botPool, setBotPool] = useState([]);

  // 현재 편집 중인 봇
  const [currentBot, setCurrentBot] = useState(() => {
    try {
      const saved = localStorage.getItem('chess_ai_current_bot');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return { ...DEFAULT_BOT_CONFIG };
  });

  // Firebase 실시간 봇 구독
  useEffect(() => {
    const unsubscribe = subscribeToBots((bots) => {
      setBotPool(bots);
    });
    return () => unsubscribe();
  }, [isFirebaseReady]);

  // 로그인 사용자 변경 시 로컬스토리지 보관 및 봇 기본값 세팅
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('chess_ai_current_user', JSON.stringify(currentUser));
      if (currentUser.role === 'student') {
        setCurrentBot((prev) => ({
          ...prev,
          creator: currentUser.name,
          ...(currentUser.savedBot || {})
        }));
      }
    } else {
      localStorage.removeItem('chess_ai_current_user');
    }
  }, [currentUser]);

  // 학생 봇 저장 핸들러
  const handleSaveBot = async (updatedBot) => {
    const botToSave = {
      ...updatedBot,
      creator: currentUser?.name || updatedBot.creator || '익명 학생'
    };
    setCurrentBot(botToSave);
    localStorage.setItem('chess_ai_current_bot', JSON.stringify(botToSave));

    if (currentUser?.role === 'student' && isFirebaseReady) {
      try {
        await saveStudentBot(currentUser.name, botToSave);
      } catch (err) {
        console.error('클라우드 저장 실패:', err);
      }
    }
  };

  // 학생 봇을 토너먼트 참가 풀에 등록 (Firebase Realtime DB에 즉시 등록)
  const handleRegisterToTournament = async (newBot) => {
    const botWithCreator = {
      ...newBot,
      creator: currentUser?.name || newBot.creator || '익명 학생',
      isStudent: true,
      registeredAt: Date.now()
    };

    if (isFirebaseReady) {
      try {
        await registerBotToFirebase(botWithCreator);
      } catch (err) {
        console.error('Firebase 봇 등록 실패:', err);
      }
    } else {
      // Firebase 미연결 시 로컬 메모리 상태에 저장
      setBotPool((prev) => {
        const filtered = prev.filter((b) => b.id !== botWithCreator.id);
        return [botWithCreator, ...filtered];
      });
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    await logoutAuth();
    setCurrentUser(null);
  };

  return (
    <div className="app-layout">
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        botPoolCount={botPool.length}
        currentUser={currentUser}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onOpenFirebaseModal={() => setShowFirebaseModal(true)}
        isFirebaseReady={isFirebaseReady}
      />

      <main className="app-main-content">
        {activeView === 'studio' ? (
          <StudentStudio
            currentBot={currentBot}
            currentUser={currentUser}
            onSaveBot={handleSaveBot}
            onRegisterToTournament={handleRegisterToTournament}
            onOpenAuthModal={() => setShowAuthModal(true)}
          />
        ) : (
          <TeacherArena
            botPool={botPool}
            currentUser={currentUser}
            onAddNewBot={handleRegisterToTournament}
            onOpenAuthModal={() => setShowAuthModal(true)}
          />
        )}
      </main>

      {/* Firebase 설정 모달 */}
      <FirebaseConfigModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
        onConnected={() => setIsFirebaseReady(true)}
      />

      {/* 학생/교사 로그인 모달 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}
