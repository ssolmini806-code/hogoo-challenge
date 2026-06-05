import { useState, useEffect, useRef, type FormEvent } from 'react';
import { supabase } from '../supabase';
import { X } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function LoginModal({ isOpen, onClose, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsForgotPassword(false);
      setForgotSent(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const getFocusable = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])
      .filter((element) => element.offsetParent !== null || element === document.activeElement);
    window.setTimeout(() => getFocusable()[0]?.focus(), 0);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        onSuccess();
        onClose();
      }
    });
    return () => subscription.unsubscribe();
  }, [isOpen, onClose, onSuccess]);

  if (!isOpen) return null;

  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://hogoo-challenge.pages.dev/hogoo-test.html',
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('회원가입 확인 메일을 확인해주세요!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      alert(err.error_description || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.72)', padding: '16px',
      }}
    >
      <div ref={dialogRef} style={{
        width: '100%', maxWidth: 380,
        background: 'var(--surface)', borderRadius: 20, padding: '32px 24px',
        border: '1px solid var(--line)', position: 'relative',
      }}>
        <button
          onClick={onClose}
          aria-label="닫기"
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'none', border: 'none', color: 'var(--ink-sub)',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', width: 44, height: 44, borderRadius: '50%',
          }}
        >
          <X size={18} />
        </button>

        {isForgotPassword ? (
          forgotSent ? (
            <>
              <h2 id="login-modal-title" style={{ color: 'var(--ink)', fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
                📬 메일을 확인해주세요
              </h2>
              <p style={{ color: 'var(--ink-sub)', fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--ink)' }}>{email}</strong>로<br />
                재설정 링크를 보냈어요. 메일함을 확인해주세요.
              </p>
              <button
                onClick={() => { setIsForgotPassword(false); setForgotSent(false); }}
                style={{
                  minHeight: 44, padding: '13px', borderRadius: 10, border: '1px solid var(--line)',
                  background: 'transparent', color: 'var(--ink-sub)', cursor: 'pointer', fontSize: 15, fontWeight: 700,
                }}
              >
                ← 로그인으로 돌아가기
              </button>
            </>
          ) : (
            <>
              <h2 id="login-modal-title" style={{ color: 'var(--ink)', fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
                비밀번호 재설정
              </h2>
              <p style={{ color: 'var(--ink-sub)', fontSize: 15, marginBottom: 24, lineHeight: 1.5 }}>
                가입한 이메일을 입력하면 재설정 링크를 보내드려요
              </p>
              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="email"
                  placeholder="이메일"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    padding: '13px 14px', borderRadius: 10, border: '1px solid var(--line)',
                    background: 'var(--surface)', color: 'var(--ink)', outline: 'none', fontSize: 15,
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    minHeight: 44, padding: '13px', borderRadius: 10, border: 'none',
                    background: 'var(--green)', color: 'var(--surface)', fontWeight: 800,
                    cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15,
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? '전송 중...' : '재설정 링크 받기'}
                </button>
              </form>
              <button
                onClick={() => setIsForgotPassword(false)}
                style={{
                  marginTop: 16, minHeight: 44, background: 'none', border: 'none',
                  color: 'var(--ink-sub)', cursor: 'pointer', fontSize: 15,
                  textDecoration: 'underline', width: '100%',
                }}
              >
                ← 로그인으로 돌아가기
              </button>
            </>
          )
        ) : (
          <>
            <h2 id="login-modal-title" style={{ color: 'var(--ink)', fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
              {isSignUp ? '챌린지 시작하기' : '보상을 받으려면 로그인이 필요해요'}
            </h2>
            <p style={{ color: 'var(--ink-sub)', fontSize: 15, marginBottom: 24, lineHeight: 1.5 }}>
              {isSignUp
                ? '계정을 만들고 진행 상황을 저장하세요'
                : '로그인하면 내 보상이 저장되고 다음에도 확인할 수 있어요'}
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  padding: '13px 14px', borderRadius: 10, border: '1px solid var(--line)',
                  background: 'var(--surface)', color: 'var(--ink)', outline: 'none', fontSize: 15,
                }}
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  padding: '13px 14px', borderRadius: 10, border: '1px solid var(--line)',
                  background: 'var(--surface)', color: 'var(--ink)', outline: 'none', fontSize: 15,
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  minHeight: 44, padding: '13px', borderRadius: 10, border: 'none',
                  background: 'var(--green)', color: 'var(--surface)', fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? '처리 중...' : (isSignUp ? '가입하기' : '로그인')}
              </button>
            </form>

            {!isSignUp && (
              <button
                onClick={() => setIsForgotPassword(true)}
                style={{
                  marginTop: 12, minHeight: 44, background: 'none', border: 'none',
                  color: 'var(--ink-sub)', cursor: 'pointer', fontSize: 15,
                  textDecoration: 'underline', width: '100%',
                }}
              >
                비밀번호를 잊으셨나요?
              </button>
            )}

            <button
              onClick={() => setIsSignUp((v) => !v)}
              style={{
                marginTop: 8, minHeight: 44, background: 'none', border: 'none',
                color: 'var(--ink-sub)', cursor: 'pointer', fontSize: 15,
                textDecoration: 'underline', width: '100%',
              }}
            >
              {isSignUp ? '이미 계정이 있으신가요? 로그인하기' : '계정이 없으신가요? 가입하기'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
