import React, { useState } from 'react';
import { loginOrRegisterStudent, loginTeacherWithGoogle } from '../firebase';
import { User, Lock, GraduationCap, School, LogIn, AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [role, setRole] = useState('student'); // 'student' | 'teacher'
  const [studentName, setStudentName] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // 학생 이름 + 비밀번호 간편 로그인
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!studentName.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (!studentPassword.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const user = await loginOrRegisterStudent(studentName, studentPassword);
      onLoginSuccess(user);
      onClose();
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 교사 구글 로그인
  const handleTeacherGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await loginTeacherWithGoogle();
      onLoginSuccess(user);
      onClose();
    } catch (err) {
      setError(err.message || 'Google 로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card glass-card" style={{ width: '420px', padding: '28px' }}>
        <div className="modal-header" style={{ marginBottom: '18px' }}>
          <h4>사용자 로그인</h4>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* 역할 선택 탭 */}
        <div className="auth-role-tabs">
          <button
            className={`auth-role-btn ${role === 'student' ? 'active' : ''}`}
            onClick={() => { setRole('student'); setError(''); }}
          >
            <GraduationCap size={16} /> 학생 로그인
          </button>
          <button
            className={`auth-role-btn ${role === 'teacher' ? 'active' : ''}`}
            onClick={() => { setRole('teacher'); setError(''); }}
          >
            <School size={16} /> 교사 (Google)
          </button>
        </div>

        {/* 1. 학생 로그인 폼 */}
        {role === 'student' && (
          <form onSubmit={handleStudentSubmit} className="student-auth-form">
            <p className="auth-guide-text">
              이름과 비밀번호를 입력하고 접속하세요. (첫 접속 시 자동 등록됩니다)
            </p>

            <div className="auth-input-group">
              <label><User size={14} /> 학생 이름 (닉네임)</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="예: 김철수, 홍길동"
                autoFocus
              />
            </div>

            <div className="auth-input-group">
              <label><Lock size={14} /> 비밀번호 (단순 PIN/비번)</label>
              <input
                type="password"
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                placeholder="비밀번호 입력"
              />
            </div>

            {error && <div className="auth-error-msg"><AlertCircle size={14} /> {error}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
              <LogIn size={16} /> {loading ? '접속 중...' : '학생으로 시작하기'}
            </button>
          </form>
        )}

        {/* 2. 교사 구글 로그인 폼 */}
        {role === 'teacher' && (
          <div className="teacher-auth-box">
            <p className="auth-guide-text">
              토너먼트 관리 및 라이브 중계를 위해 <strong>Google 계정</strong>으로 로그인하세요.
            </p>

            {error && <div className="auth-error-msg"><AlertCircle size={14} /> {error}</div>}

            <button
              type="button"
              className="btn btn-google"
              onClick={handleTeacherGoogleLogin}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? '로그인 중...' : 'Google 계정으로 교사 로그인'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
