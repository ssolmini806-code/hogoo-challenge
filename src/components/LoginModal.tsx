import { useState, useEffect, type FormEvent } from 'react';
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

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
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
      <div style={{
        width: '100%', maxWidth: 380,
        background: '#231f1c', borderRadius: 20, padding: '32px 24px',
        border: '1px solid #3a3530', position: 'relative',
      }}>
        <button
          onClick={onClose}
          aria-label="닫기"
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'none', border: 'none', color: '#5a5048',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', width: 32, height: 32, borderRadius: '50%',
          }}
        >
          <X size={18} />
        </button>

        <h2 id="login-modal-title" style={{ color: '#f5ede3', fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
          {isSignUp ? '챌린지 시작하기' : '보상을 받으려면 로그인이 필요해요'}
        </h2>
        <p style={{ color: '#8a7f75', fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
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
              padding: '13px 14px', borderRadius: 10, border: '1px solid #3a3530',
              background: '#1a1614', color: '#f5ede3', outline: 'none', fontSize: 14,
            }}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: '13px 14px', borderRadius: 10, border: '1px solid #3a3530',
              background: '#1a1614', color: '#f5ede3', outline: 'none', fontSize: 14,
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '13px', borderRadius: 10, border: 'none',
              background: '#00a885', color: '#fff', fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '처리 중...' : (isSignUp ? '가입하기' : '로그인')}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp((v) => !v)}
          style={{
            marginTop: 16, background: 'none', border: 'none',
            color: '#6a5f55', cursor: 'pointer', fontSize: 12,
            textDecoration: 'underline', width: '100%',
          }}
        >
          {isSignUp ? '이미 계정이 있으신가요? 로그인하기' : '계정이 없으신가요? 가입하기'}
        </button>
      </div>
    </div>
  );
}
