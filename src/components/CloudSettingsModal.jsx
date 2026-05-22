import React, { useState, useEffect } from 'react';
import { X, Server, Key, AlertCircle, HelpCircle } from 'lucide-react';
import { getSupabaseConfig } from '../utils/supabaseClient';

export default function CloudSettingsModal({ onClose, onSave }) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const { isFromEnv, isConfigured } = getSupabaseConfig();

  useEffect(() => {
    const localUrl = localStorage.getItem('supabase_url') || '';
    const localKey = localStorage.getItem('supabase_anon_key') || '';
    setUrl(localUrl);
    setKey(localKey);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFromEnv) {
      alert('환경 변수(.env)로 연동되어 있어 설정을 직접 수정할 수 없습니다.');
      return;
    }

    if (!url.trim() || !key.trim()) {
      alert('Supabase URL과 Anon Key를 모두 입력해주세요.');
      return;
    }

    localStorage.setItem('supabase_url', url.trim());
    localStorage.setItem('supabase_anon_key', key.trim());
    onSave();
  };

  const handleDisconnect = () => {
    if (window.confirm('서버 연동을 해제하시겠습니까? 데이터는 삭제되지 않으며 다시 로컬 모드로 전환됩니다.')) {
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_anon_key');
      setUrl('');
      setKey('');
      onSave();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel form-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} title="닫기">
          <X size={18} />
        </button>

        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={20} style={{ color: 'var(--accent-orange)' }} />
            <span>나만의 클라우드 서버 연동</span>
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {isFromEnv ? (
              <div className="alert-message success" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8125rem', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #6ee7b7', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <AlertCircle size={16} />
                <span>환경 변수(`VITE_SUPABASE_*`)를 통해 서버에 이미 연동되어 있습니다.</span>
              </div>
            ) : (
              <div style={{ marginBottom: '1.25rem', padding: '0.85rem', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', fontSize: '0.8125rem', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', lineHeight: '1.5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  <HelpCircle size={14} style={{ color: 'var(--accent-orange)' }} />
                  <span>서버 연동이 왜 필요한가요?</span>
                </div>
                Prompt Bakery는 개인 프라이버시를 위해 기본적으로 브라우저 로컬 저장소(IndexedDB)에만 레시피를 보관합니다.<br />
                <strong>다른 기기에서도 동일하게 접속하고 실시간 동기화하려면</strong> Supabase의 무료 클라우드 데이터베이스를 연동해야 합니다. 2분 만에 무료 계정을 개설하여 나만의 데이터를 영구 보관할 수 있습니다.
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="settings-url" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Supabase Project URL
              </label>
              <div style={{ position: 'relative' }}>
                <Server size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="settings-url"
                  type="url"
                  className="input-text"
                  placeholder="https://your-project.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{ paddingLeft: '38px', borderRadius: '10px' }}
                  required
                  disabled={isFromEnv}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="settings-key" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Supabase Anon API Key
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="settings-key"
                  type="text"
                  className="input-text"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  style={{ paddingLeft: '38px', borderRadius: '10px' }}
                  required
                  disabled={isFromEnv}
                />
              </div>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem', lineHeight: '1.4' }}>
                * Supabase 대시보드 &gt; Project Settings &gt; API 메뉴에서 `Project URL`과 `anon (public)` 키를 가져와 붙여넣으세요.<br />
                * 데이터베이스 탭에서 `prompts` 테이블을 개설하고 RLS 정책을 설정해주셔야 정상 작동합니다. (SQL 가이드는 배포 가이드 참고)
              </span>
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <div>
              {isConfigured && !isFromEnv && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDisconnect}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                >
                  연동 해제
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                닫기
              </button>
              {!isFromEnv && (
                <button type="submit" className="btn btn-primary">
                  연동 정보 저장
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
