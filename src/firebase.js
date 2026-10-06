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

// 1. 학생 봇 등록 / 수정
export const registerBotToFirebase = async (botData) => {
  if (!database) throw new Error('Firebase Database가 설정되지 않았습니다.');
  const botId = botData.id || `bot-${Date.now()}`;
  const botRef = ref(database, `bots/${botId}`);
  await set(botRef, {
    ...botData,
    id: botId,
    updatedAt: Date.now()
  });
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

// 3. 봇 삭제
export const deleteBotFromFirebase = async (botId) => {
  if (!database) return;
  const botRef = ref(database, `bots/${botId}`);
  await remove(botRef);
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
    return { name: cleanName, role: 'student', savedBot: data.savedBot || null };
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

// 5. 학생 본인의 봇 저장 및 임시 작성(Draft) 실시간 동기화
export const saveStudentBot = async (studentName, botData) => {
  if (!database) return;
  const cleanName = studentName.trim();
  const studentRef = ref(database, `students/${cleanName}/savedBot`);
  await set(studentRef, {
    ...botData,
    lastActiveAt: Date.now()
  });
};

export const updateStudentDraft = async (studentName, botData) => {
  if (!database || !studentName) return;
  const cleanName = studentName.trim();
  const draftRef = ref(database, `students/${cleanName}/draftBot`);
  const activeRef = ref(database, `students/${cleanName}/lastActiveAt`);
  await set(draftRef, botData);
  await set(activeRef, Date.now());
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
