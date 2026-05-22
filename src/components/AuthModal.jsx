import React, { useState } from 'react';
import { X, Mail, Lock, Cookie, Sparkles, Loader2 } from 'lucide-react';
import { getSupabaseClient } from '../utils/supabaseClient';

export default function AuthModal({ onClose, onSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!email.trim() || !password.trim()) {
      setErrorMsg('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('비밀번호는 최소 6자리 이상이어야 합니다.');
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setErrorMsg('Supabase 연결 설정에 오류가 있습니다.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password: password.trim()
        });

        if (error) throw error;
        
        // Supabase sends a confirmation email by default unless turned off.
        // We will notify the user.
        if (data?.user && data?.session === null) {
          setSuccessMsg('회원가입 성공! 이메일 인증 링크가 발송되었습니다. 메일함을 확인해주세요.');
        } else if (data?.session) {
          setSuccessMsg('회원가입 성공 및 로그인 완료!');
          setTimeout(() => {
            onSuccess(data.session.user);
          }, 1000);
        } else {
          setSuccessMsg('회원가입이 완료되었습니다. 로그인 해주세요.');
          setIsSignUp(false);
        }
      } else {
        // Sign In
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });

        if (error) throw error;

        if (data?.session) {
          setSuccessMsg('반갑습니다! 오븐 문을 엽니다... 🥐');
          setTimeout(() => {
            onSuccess(data.session.user);
          }, 1000);
        }
      }
    } catch (err) {
      console.error('Authentication Error:', err);
      // Translate common Firebase/Supabase errors to Korean
      let msg = err.message || '인증에 실패했습니다.';
      if (msg.includes('Invalid login credentials')) {
        msg = '이메일 또는 비밀번호가 일치하지 않습니다.';
      } else if (msg.includes('User already registered')) {
        msg = '이미 가입된 이메일 주소입니다.';
      } else if (msg.includes('signup_disabled')) {
        msg = '현재 회원가입이 비활성화되어 있습니다.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} title="닫기">
          <X size={18} />
        </button>

        <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '0.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', width: '100%' }}>
            <Cookie className="logo-accent" size={24} style={{ color: 'var(--accent-orange)' }} />
            <span>{isSignUp ? '프롬프트 빵집 단골 가입' : '오븐 로그인'}</span>
          </h2>
          <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            {isSignUp 
              ? '계정을 만들고 작성한 모든 레시피를 안전하게 클라우드에 백업하세요.' 
              : '로그인하여 어느 기기에서나 나만의 프롬프트 레시피를 요리하세요.'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 1.75rem 1.75rem 1.75rem' }}>
          {errorMsg && (
            <div className="alert-message error" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8125rem', backgroundColor: 'var(--accent-rose-glow)', color: '#b91c1c', border: '1px solid #fca5a5' }}>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="alert-message success" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8125rem', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #6ee7b7' }}>
              {successMsg}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="auth-email" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              이메일 주소
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="auth-email"
                type="email"
                className="input-text"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '38px', borderRadius: '10px' }}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="auth-password" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              비밀번호
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="auth-password"
                type="password"
                className="input-text"
                placeholder="최소 6자리 비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '38px', borderRadius: '10px' }}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>데이터 반죽 굽는 중...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>{isSignUp ? '무료 가입 및 동기화 시작' : '로그인'}</span>
              </>
            )}
          </button>

          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.8125rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {isSignUp ? '이미 단골이신가요?' : '아직 계정이 없으신가요?'}
            </span>{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-orange)',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '0 4px'
              }}
              disabled={loading}
            >
              {isSignUp ? '로그인하기' : '회원가입하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
