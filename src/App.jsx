import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StudentStudio from './components/StudentStudio';
import TeacherArena from './components/TeacherArena';
import TeacherMonitorDashboard from './components/TeacherMonitorDashboard';
import FirebaseConfigModal from './components/FirebaseConfigModal';
import AuthModal from './components/AuthModal';
import StudentRpsModal from './components/StudentRpsModal';
import {
  isFirebaseConfigured,
  subscribeToBots,
  subscribeToStudents,
  registerBotToFirebase,
  saveStudentBot,
  deleteBotFromFirebase,
  kickStudentFromFirebase,
  unbanStudentInFirebase,
  deleteStudentFromFirebase,
  subscribeToStudentKickedStatus,
  subscribeAuthState,
  logoutAuth,
  fetchStudentBot,
  subscribeToActiveRpsSession
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

  // 실시간 흑/백 결정 가위바위보 세션
  const [activeRpsSession, setActiveRpsSession] = useState(null);

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
    const unsubRps = subscribeToActiveRpsSession((session) => {
      setActiveRpsSession(session);
    });
    return () => {
      unsubBots();
      unsubStudents();
      unsubRps();
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

  // 접속 중인 학생의 추방 여부 실시간 감지 (교사가 추방 시 즉시 알림 및 강제 로그아웃 처리)
  useEffect(() => {
    if (!isFirebaseReady || currentUser?.role !== 'student' || !currentUser?.name) return;
    const unsub = subscribeToStudentKickedStatus(
      currentUser.name,
      () => {
        alert('⚠️ 선생님에 의해 접속이 종료(추방)되었습니다. 메인 화면으로 돌아갑니다.');
        handleLogout();
      },
      () => {
        alert('⚠️ 학생 계정 정보가 삭제되어 로그아웃되었습니다.');
        handleLogout();
      }
    );
    return () => unsub();
  }, [currentUser?.role, currentUser?.name, isFirebaseReady]);

  // 교사의 학생 강제 추방 핸들러
  const handleKickStudent = async (studentName) => {
    if (!studentName) return;
    if (!window.confirm(`정말로 '${studentName}' 학생을 강제 퇴장(추방)시키겠습니까?\n\n추방 시 해당 학생의 화면에서 즉시 강제 로그아웃되며, 접속 및 로그인이 차단됩니다.`)) {
      return;
    }
    if (isFirebaseReady) {
      try {
        await kickStudentFromFirebase(studentName);
      } catch (err) {
        console.error('학생 추방 실패:', err);
        alert('학생 추방 처리 중 오류가 발생했습니다.');
      }
    } else {
      setStudentList((prev) => prev.map((s) => s.name === studentName ? { ...s, isKicked: true } : s));
    }
  };

  // 교사의 학생 추방 해제 핸들러
  const handleUnbanStudent = async (studentName) => {
    if (!studentName) return;
    if (!window.confirm(`'${studentName}' 학생의 추방을 해제하고 다시 접속할 수 있도록 허용하시겠습니까?`)) {
      return;
    }
    if (isFirebaseReady) {
      try {
        await unbanStudentInFirebase(studentName);
      } catch (err) {
        console.error('추방 해제 실패:', err);
        alert('추방 해제 중 오류가 발생했습니다.');
      }
    } else {
      setStudentList((prev) => prev.map((s) => s.name === studentName ? { ...s, isKicked: false } : s));
    }
  };

  // 교사의 학생 완전 삭제 핸들러
  const handleDeleteStudent = async (studentName) => {
    if (!studentName) return;
    if (!window.confirm(`'${studentName}' 학생의 모든 정보와 계정을 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }
    if (isFirebaseReady) {
      try {
        await deleteStudentFromFirebase(studentName);
      } catch (err) {
        console.error('학생 삭제 실패:', err);
        alert('학생 삭제 중 오류가 발생했습니다.');
      }
    } else {
      setStudentList((prev) => prev.filter((s) => s.name !== studentName));
      setBotPool((prev) => prev.filter((b) => b.creator !== studentName));
    }
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
              onKickStudent={handleKickStudent}
              onUnbanStudent={handleUnbanStudent}
              onDeleteStudent={handleDeleteStudent}
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
                isTournamentRegistered={botPool.some((b) => b.creator === currentUser?.name)}
              />
            </div>
          )
        ) : (
          <TeacherArena
            botPool={botPool}
            currentUser={currentUser}
            onAddNewBot={handleRegisterToTournament}
            onDeleteBot={handleDeleteBot}
            onKickStudent={handleKickStudent}
            onOpenAuthModal={() => setShowAuthModal(true)}
            activeRpsSession={activeRpsSession}
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

      {/* 학생 화면 전용 실시간 흑/백 가위바위보 대결 모달 */}
      {currentUser?.role === 'student' && activeRpsSession && (
        <StudentRpsModal session={activeRpsSession} studentName={currentUser.name} />
      )}
    </div>
  );
}
