import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, remove, child } from 'firebase/database';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

// 기본 환경변수 또는 로컬스토리지에서 Firebase Config 가져오기
const getStoredConfig = () => {
  try {
    const local = localStorage.getItem('firebase_custom_config');
    if (local) return JSON.parse(local);
  } catch (e) {
    // ignore
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
  };
};

let firebaseApp = null;
let database = null;
let auth = null;
let googleProvider = null;

export const isFirebaseConfigured = () => {
  const cfg = getStoredConfig();
  return Boolean(cfg.apiKey && cfg.databaseURL);
};

export const initFirebase = (customConfig = null) => {
  const config = customConfig || getStoredConfig();

  if (!config.apiKey || !config.databaseURL) {
    return { app: null, db: null, auth: null, isReady: false };
  }

  try {
    firebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
    database = getDatabase(firebaseApp);
    auth = getAuth(firebaseApp);
    googleProvider = new GoogleAuthProvider();

    if (customConfig) {
      localStorage.setItem('firebase_custom_config', JSON.stringify(customConfig));
    }

    return { app: firebaseApp, db: database, auth, googleProvider, isReady: true };
  } catch (error) {
    console.error('Firebase 초기화 실패:', error);
    return { app: null, db: null, auth: null, isReady: false, error };
  }
};

// 초기 실행
const initial = initFirebase();
database = initial.db;
auth = initial.auth;
googleProvider = initial.googleProvider;

export { database, auth, googleProvider };

/* ==========================================================================
   실시간 데이터베이스 헬퍼 함수들 (Bots & Students)
   ========================================================================== */

// 1. 학생 봇 토너먼트 등록 / 수정 (학생이 '토너먼트 참가 등록' 버튼을 직접 눌렀을 때만 호출)
export const registerBotToFirebase = async (botData) => {
  if (!database) throw new Error('Firebase Database가 설정되지 않았습니다.');
  const cleanCreator = (botData.creator || '').trim();
  const botId = cleanCreator
    ? `student_${cleanCreator.replace(/[^a-zA-Z0-9가-힣_-]/g, '_')}`
    : (botData.id || `bot-${Date.now()}`);

  const botPayload = {
    ...botData,
    id: botId,
    creator: cleanCreator || botData.creator || '익명 학생',
    isStudent: true,
    registeredAt: botData.registeredAt || Date.now(),
    updatedAt: Date.now()
  };

  const botRef = ref(database, `bots/${botId}`);
  await set(botRef, botPayload);

  // 학생 개인 DB 정보에도 토너먼트 공식 등록 상태 플래그 기록
  if (cleanCreator) {
    const studentRef = ref(database, `students/${cleanCreator}`);
    await set(child(studentRef, 'isTournamentRegistered'), true);
    await set(child(studentRef, 'tournamentRegisteredAt'), Date.now());
  }

  return botId;
};

// 2. 봇 목록 실시간 구독 (교사용 & 학생용)
export const subscribeToBots = (callback) => {
  if (!database) {
    callback([]);
    return () => {};
  }
  const botsRef = ref(database, 'bots');
  const unsubscribe = onValue(botsRef, (snapshot) => {
    const val = snapshot.val();
    if (!val) {
      callback([]);
    } else {
      const list = Object.values(val);
      callback(list);
    }
  });
  return unsubscribe;
};

// 3. 봇 삭제 (토너먼트 풀에서 삭제)
export const deleteBotFromFirebase = async (botId) => {
  if (!database) return;
  const botRef = ref(database, `bots/${botId}`);
  await remove(botRef);

  if (botId.startsWith('student_')) {
    const studentName = botId.replace('student_', '');
    const studentRef = ref(database, `students/${studentName}`);
    await set(child(studentRef, 'isTournamentRegistered'), false);
  }
};

// 4. 학생 간편 로그인 / 가입 (이름 + 비밀번호)
export const loginOrRegisterStudent = async (name, password) => {
  if (!database) throw new Error('Firebase Realtime Database가 연결되어 있지 않습니다.');
  const cleanName = name.trim();
  if (!cleanName || !password) throw new Error('이름과 비밀번호를 모두 입력해주세요.');

  const studentRef = ref(database, `students/${cleanName}`);
  const snapshot = await get(studentRef);

  if (snapshot.exists()) {
    const data = snapshot.val();
    if (data.password !== password) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }
    const existingBot = data.savedBot || data.draftBot || null;
    return { name: cleanName, role: 'student', savedBot: existingBot };
  } else {
    // 신규 등록
    await set(studentRef, {
      name: cleanName,
      password: password,
      createdAt: Date.now()
    });
    return { name: cleanName, role: 'student', savedBot: null };
  }
};

// 5. 서버에서 학생 AI 데이터 자동 읽어오기 (최신 draft 또는 saved 봇)
export const fetchStudentBot = async (studentName) => {
  if (!database || !studentName) return null;
  try {
    const cleanName = studentName.trim();
    const studentRef = ref(database, `students/${cleanName}`);
    const snapshot = await get(studentRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return data.savedBot || data.draftBot || null;
    }
  } catch (err) {
    console.error('학생 봇 자동 로드 실패:', err);
  }
  return null;
};

// 5-1. 학생 AI 변경사항 실시간 자동 저장 및 교사 관제 화면 즉시 동기화 (토너먼트 자동 등록 X)
export const autoSyncStudentBot = async (studentName, botData) => {
  if (!database || !studentName) return;
  try {
    const cleanName = studentName.trim();
    const now = Date.now();
    const safeId = `student_${cleanName.replace(/[^a-zA-Z0-9가-힣_-]/g, '_')}`;

    const botPayload = {
      ...botData,
      id: safeId,
      creator: cleanName,
      isStudent: true,
      lastActiveAt: now,
      updatedAt: now
    };

    // 1) 학생 개인 공간에 draftBot과 savedBot 모두 동기화 -> 교사 관제 대시보드(TeacherMonitorDashboard)에서 실시간으로 프롬프트 확인 가능
    const studentRef = ref(database, `students/${cleanName}`);
    await set(child(studentRef, 'draftBot'), botPayload);
    await set(child(studentRef, 'savedBot'), botPayload);
    await set(child(studentRef, 'lastActiveAt'), now);

    // [중요]: 토너먼트 봇 풀(bots/)에는 자동으로 등록하지 않습니다!
    // 학생이 준비를 마치고 '토너먼트 참가 등록' 버튼을 직접 눌렀을 때만 registerBotToFirebase를 통해 bots/에 등록됩니다.
  } catch (err) {
    console.error('실시간 자동 동기화 에러:', err);
    throw err;
  }
};

export const saveStudentBot = async (studentName, botData) => {
  return autoSyncStudentBot(studentName, botData);
};

export const updateStudentDraft = async (studentName, botData) => {
  return autoSyncStudentBot(studentName, botData);
};

// 5-1. 교사용 전체 학생 실시간 상태 구독
export const subscribeToStudents = (callback) => {
  if (!database) {
    callback([]);
    return () => {};
  }
  const studentsRef = ref(database, 'students');
  return onValue(studentsRef, (snapshot) => {
    const val = snapshot.val();
    if (!val) {
      callback([]);
    } else {
      const list = Object.entries(val).map(([name, data]) => ({
        name,
        ...data
      }));
      callback(list);
    }
  });
};

// 6. 교사 구글 로그인
export const loginTeacherWithGoogle = async () => {
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth가 설정되어 있지 않습니다.');
  }
  const result = await signInWithPopup(auth, googleProvider);
  return {
    uid: result.user.uid,
    name: result.user.displayName || '선생님',
    email: result.user.email,
    photoURL: result.user.photoURL,
    role: 'teacher',
    isAdmin: true
  };
};

// 7. Firebase Auth 상태 변화 구독
export const subscribeAuthState = (callback) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        name: user.displayName || '선생님',
        email: user.email,
        photoURL: user.photoURL,
        role: 'teacher',
        isAdmin: true
      });
    } else {
      callback(null);
    }
  });
};

// 8. 로그아웃
export const logoutAuth = async () => {
  if (auth) {
    await signOut(auth);
  }
};

// 9. 실시간 가위바위보 (RPS) 흑/백 결정전 세션 관리
export const startRpsSession = async (sessionData) => {
  if (!database) return;
  const rpsRef = ref(database, 'activeRpsSession');
  const now = Date.now();
  const timeLimit = sessionData.timeLimitSeconds || 10;
  await set(rpsRef, {
    ...sessionData,
    timeLimitSeconds: timeLimit,
    startedAt: now,
    expiresAt: now + timeLimit * 1000,
    status: 'choosing', // 'choosing' | 'decided'
    p1Choice: sessionData.p1Choice || null,
    p2Choice: sessionData.p2Choice || null,
    winner: null,
    decidedAt: null
  });
};

export const submitRpsChoice = async (studentName, choice) => {
  if (!database || !studentName) return;
  const cleanName = studentName.trim();
  const rpsRef = ref(database, 'activeRpsSession');
  const snapshot = await get(rpsRef);
  if (snapshot.exists()) {
    const session = snapshot.val();
    if (session.status !== 'choosing') return;
    if (session.p1Creator === cleanName) {
      await set(child(rpsRef, 'p1Choice'), choice);
    } else if (session.p2Creator === cleanName) {
      await set(child(rpsRef, 'p2Choice'), choice);
    }
  }
};

export const decideRpsSession = async (resolutionData) => {
  if (!database) return;
  const rpsRef = ref(database, 'activeRpsSession');
  await set(rpsRef, {
    ...resolutionData,
    status: 'decided',
    decidedAt: Date.now()
  });
};

export const closeRpsSession = async () => {
  if (!database) return;
  const rpsRef = ref(database, 'activeRpsSession');
  await remove(rpsRef);
};

export const subscribeToActiveRpsSession = (callback) => {
  if (!database) {
    callback(null);
    return () => {};
  }
  const rpsRef = ref(database, 'activeRpsSession');
  return onValue(rpsRef, (snapshot) => {
    const val = snapshot.val();
    callback(val || null);
  });
};
