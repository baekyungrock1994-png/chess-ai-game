import React, { useState } from 'react';
import { initFirebase } from '../firebase';
import { Database, Key, CheckCircle, X, HelpCircle, ExternalLink } from 'lucide-react';

export default function FirebaseConfigModal({ isOpen, onClose, onConnected }) {
  const [configJson, setConfigJson] = useState(() => {
    const saved = localStorage.getItem('firebase_custom_config');
    return saved ? JSON.stringify(JSON.parse(saved), null, 2) : '';
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setError('');
    try {
      let cfg;
      // JSON 형태인지 파싱
      const trimmed = configJson.trim();
      if (trimmed.startsWith('{')) {
        cfg = JSON.parse(trimmed);
      } else {
        // key: value 형식인 경우 등 처리
        cfg = JSON.parse(`{${trimmed}}`);
      }

      if (!cfg.apiKey || !cfg.databaseURL) {
        setError('apiKey와 databaseURL은 필수 항목입니다. Realtime Database URL을 확인해주세요.');
        return;
      }

      const res = initFirebase(cfg);
      if (res.isReady) {
        setSuccess(true);
        setTimeout(() => {
          if (onConnected) onConnected(cfg);
          onClose();
        }, 1000);
      } else {
        setError('Firebase 초기화에 실패했습니다. 설정을 다시 확인해주세요.');
      }
    } catch (err) {
      setError('올바른 JSON 형식이 아닙니다. Firebase 콘솔의 SDK 설정 객체를 붙여넣어주세요.');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card glass-card" style={{ width: '560px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database className="text-accent" size={20} />
            <h4>Firebase Realtime Database 연결 설정</h4>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="firebase-guide-box">
          <p style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '8px' }}>
            🔥 <strong>Firebase 콘솔 설정 복사 방법:</strong>
          </p>
          <ol style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '18px', lineHeight: '1.6' }}>
            <li><a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-secondary)' }}>Firebase 콘솔</a>에 접속합니다.</li>
            <li><strong>프로젝트 설정(톱니바퀴)</strong> → 하단 <strong>'내 앱'</strong>에서 웹 앱 SDK 구성 코드를 복사합니다.</li>
            <li><strong>Build → Authentication</strong>에서 Google 로그인을 활성화합니다.</li>
            <li><strong>Build → Realtime Database</strong>의 규칙(Rules) 탭에서 읽기/쓰기를 허용(true)으로 설정합니다.</li>
          </ol>
        </div>

        <div style={{ margin: '14px 0' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
            Firebase SDK 구성 객체 붙여넣기 (JSON):
          </label>
          <textarea
            className="modal-json-input"
            rows="7"
            value={configJson}
            onChange={(e) => setConfigJson(e.target.value)}
            placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "my-chess.firebaseapp.com",\n  "databaseURL": "https://my-chess-default-rtdb.firebaseio.com",\n  "projectId": "my-chess",\n  "appId": "1:..."\n}`}
          />
        </div>

        {error && <p className="error-text">{error}</p>}
        {success && (
          <p style={{ color: 'var(--accent-emerald)', fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>
            ✅ Firebase 실시간 데이터베이스가 성공적으로 연결되었습니다!
          </p>
        )}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            닫기
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            연결 및 저장
          </button>
        </div>
      </div>
    </div>
  );
}
