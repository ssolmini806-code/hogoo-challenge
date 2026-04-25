import { useState } from 'react';
import { supabase } from '../supabase';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
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
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: 400, margin: '100px auto', padding: '40px 24px',
      background: '#231f1c', borderRadius: 20, border: '1px solid #3a3530',
      textAlign: 'center'
    }}>
      <h2 style={{ color: '#f5ede3', marginBottom: 8, fontSize: 24, fontWeight: 800 }}>
        {isSignUp ? '챌린지 시작하기' : '다시 오셨군요!'}
      </h2>
      <p style={{ color: '#8a7f75', marginBottom: 32, fontSize: 14 }}>
        {isSignUp ? '계정을 생성하고 진행 상황을 저장하세요.' : '로그인하여 진행 상황을 이어가세요.'}
      </p>
      
      <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: '14px 16px', borderRadius: 10, border: '1px solid #3a3530',
            background: '#1a1614', color: '#f5ede3', outline: 'none'
          }}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            padding: '14px 16px', borderRadius: 10, border: '1px solid #3a3530',
            background: '#1a1614', color: '#f5ede3', outline: 'none'
          }}
        />
        <button
          disabled={loading}
          type="submit"
          style={{
            padding: '14px', borderRadius: 10, border: 'none',
            background: '#00a885', color: '#fff', fontWeight: 800,
            cursor: 'pointer', fontSize: 16
          }}
        >
          {loading ? '처리 중...' : (isSignUp ? '가입하기' : '로그인')}
        </button>
      </form>

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        style={{
          marginTop: 24, background: 'none', border: 'none',
          color: '#8a7f75', cursor: 'pointer', fontSize: 13, textDecoration: 'underline'
        }}
      >
        {isSignUp ? '이미 계정이 있으신가요? 로그인하기' : '계정이 없으신가요? 가입하기'}
      </button>
    </div>
  );
}
