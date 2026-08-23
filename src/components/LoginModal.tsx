import { useState, useEffect, useRef, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabase';
import { X } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type Feedback = { kind: 'error' | 'success'; text: string } | null;

function authErrorMessage(error: any, fallback: string) {
  const raw = String(error?.error_description || error?.message || '').toLowerCase();
  if (raw.includes('invalid login credentials')) return '이메일 또는 비밀번호가 맞지 않아요. 다시 확인해주세요.';
  if (raw.includes('email not confirmed')) return '가입 확인 메일의 링크를 먼저 눌러주세요.';
  if (raw.includes('already registered') || raw.includes('user already exists')) return '이미 가입된 이메일이에요. 로그인해주세요.';
  if (raw.includes('rate limit') || raw.includes('too many requests')) return '요청이 많아요. 잠시 후 다시 시도해주세요.';
  if (raw.includes('network') || raw.includes('fetch')) return '네트워크 연결을 확인하고 다시 시도해주세요.';
  return fallback;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsForgotPassword(false);
      setForgotSent(false);
      setFeedback(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
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
    setFeedback(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://hogoo-challenge.pages.dev/hogoo-test.html',
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (err: any) {
      setFeedback({ kind: 'error', text: authErrorMessage(err, '재설정 메일을 보내지 못했어요. 잠시 후 다시 시도해주세요.') });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    if (isSignUp && password.length < 6) {
      setPasswordTouched(true);
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setFeedback({ kind: 'success', text: '가입 확인 메일을 보냈어요. 메일의 링크를 누르면 가입이 완료됩니다.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setFeedback({ kind: 'error', text: authErrorMessage(err, '로그인하지 못했어요. 입력한 내용을 확인하고 다시 시도해주세요.') });
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="login-modal-backdrop"
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
      <div ref={dialogRef} className="login-modal-sheet" style={{
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
                onClick={() => { setIsForgotPassword(false); setForgotSent(false); setFeedback(null); }}
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
              {feedback ? (
                <p className={`login-modal-feedback is-${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'}>
                  {feedback.text}
                </p>
              ) : null}
              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  aria-label="비밀번호 재설정 이메일"
                  type="email"
                  placeholder="이메일"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFeedback(null); }}
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
                onClick={() => { setIsForgotPassword(false); setFeedback(null); }}
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

            {feedback ? (
              <p className={`login-modal-feedback is-${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'}>
                {feedback.text}
              </p>
            ) : null}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                aria-label="이메일"
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFeedback(null); }}
                required
                style={{
                  padding: '13px 14px', borderRadius: 10, border: '1px solid var(--line)',
                  background: 'var(--surface)', color: 'var(--ink)', outline: 'none', fontSize: 15,
                }}
              />
              <input
                aria-label="비밀번호"
                aria-describedby={isSignUp && passwordTouched && password.length < 6 ? 'password-requirement' : undefined}
                aria-invalid={isSignUp && passwordTouched && password.length < 6}
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordTouched(true);
                  setFeedback(null);
                }}
                minLength={isSignUp ? 6 : undefined}
                required
                style={{
                  padding: '13px 14px', borderRadius: 10, border: '1px solid var(--line)',
                  background: 'var(--surface)', color: 'var(--ink)', outline: 'none', fontSize: 15,
                }}
              />
              {isSignUp && passwordTouched && password.length < 6 && (
                <p
                  id="password-requirement"
                  role="alert"
                  style={{ margin: '-4px 2px 0', color: '#C2413B', fontSize: 13, lineHeight: 1.4 }}
                >
                  비밀번호는 6자 이상 입력해주세요.
                </p>
              )}
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
                onClick={() => { setIsForgotPassword(true); setFeedback(null); }}
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
              onClick={() => {
                setIsSignUp((v) => !v);
                setPasswordTouched(false);
                setFeedback(null);
              }}
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
    </div>,
    document.body,
  );
}
