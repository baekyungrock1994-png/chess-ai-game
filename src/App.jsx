import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StudentStudio from './components/StudentStudio';
import TeacherArena from './components/TeacherArena';
import TeacherMonitorDashboard from './components/TeacherMonitorDashboard';
import FirebaseConfigModal from './components/FirebaseConfigModal';
import AuthModal from './components/AuthModal';
import {
  isFirebaseConfigured,
  subscribeToBots,
  subscribeToStudents,
  registerBotToFirebase,
  saveStudentBot,
  deleteBotFromFirebase,
  subscribeAuthState,
  logoutAuth,
  fetchStudentBot
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

  // 실시간 접속/작성 학생 목록 (교사용 관제 모니터링)
  const [studentList, setStudentList] = useState([]);

  // 교사의 스튜디오 모드: 'monitor' (학생 모니터링) | 'solo' (직접 제작)
  const [teacherStudioMode, setTeacherStudioMode] = useState('monitor');

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

  // Firebase 실시간 봇 및 학생 목록 구독
  useEffect(() => {
    const unsubBots = subscribeToBots((bots) => {
      setBotPool(bots);
    });
    const unsubStudents = subscribeToStudents((students) => {
      setStudentList(students);
    });
    return () => {
      unsubBots();
      unsubStudents();
    };
  }, [isFirebaseReady]);

  // 로그인 사용자 변경 시 로컬스토리지 보관 및 봇 클라우드/로컬 데이터 자동 복원
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('chess_ai_current_user', JSON.stringify(currentUser));
      if (currentUser.role === 'student' && currentUser.name) {
        if (currentUser.savedBot) {
          setCurrentBot((prev) => ({
            ...prev,
            creator: currentUser.name,
            ...currentUser.savedBot
          }));
        }
        if (isFirebaseReady) {
          fetchStudentBot(currentUser.name).then((cloudBot) => {
            if (cloudBot) {
              setCurrentBot((prev) => ({
                ...prev,
                creator: currentUser.name,
                ...cloudBot
              }));
            }
          });
        }
      }
    } else {
      localStorage.removeItem('chess_ai_current_user');
    }
  }, [currentUser, isFirebaseReady]);

  // Firebase Auth 세션 자동 구독 (교사 로그인 상태 유지)
  useEffect(() => {
    const unsubscribe = subscribeAuthState((teacherUser) => {
      if (teacherUser) {
        setCurrentUser(teacherUser);
      }
    });
    return () => unsubscribe();
  }, [isFirebaseReady]);

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

  // 교사 관리자의 참가 봇 삭제 핸들러
  const handleDeleteBot = async (botId, botName) => {
    if (!window.confirm(`'${botName}' 선수를 참가자 명단에서 완전히 삭제하시겠습니까?`)) {
      return;
    }

    if (isFirebaseReady) {
      try {
        await deleteBotFromFirebase(botId);
      } catch (err) {
        console.error('봇 삭제 실패:', err);
        alert('삭제 중 오류가 발생했습니다.');
      }
    } else {
      setBotPool((prev) => prev.filter((b) => b.id !== botId));
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
          currentUser?.role === 'teacher' && teacherStudioMode === 'monitor' ? (
            <TeacherMonitorDashboard
              studentList={studentList}
              botPool={botPool}
              onSwitchToSoloStudio={() => setTeacherStudioMode('solo')}
            />
          ) : (
            <div>
              {currentUser?.role === 'teacher' && (
                <div className="teacher-back-bar glass-card">
                  <span>선생님 전용 AI 테스트 모드입니다.</span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setTeacherStudioMode('monitor')}
                  >
                    ◀ 학생 실시간 모니터링 화면으로 돌아가기
                  </button>
                </div>
              )}
              <StudentStudio
                currentBot={currentBot}
                currentUser={currentUser}
                onSaveBot={handleSaveBot}
                onRegisterToTournament={handleRegisterToTournament}
                onOpenAuthModal={() => setShowAuthModal(true)}
              />
            </div>
          )
        ) : (
          <TeacherArena
            botPool={botPool}
            currentUser={currentUser}
            onAddNewBot={handleRegisterToTournament}
            onDeleteBot={handleDeleteBot}
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
