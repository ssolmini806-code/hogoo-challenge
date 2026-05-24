import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { LogOut, UserCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import LoginModal from './LoginModal';

export default function LoginButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  if (user) {
    const name =
      user.user_metadata?.nickname ||
      user.user_metadata?.name ||
      user.email?.split('@')[0];
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#8a7f75', fontSize: 11 }}>
          <UserCircle size={14} />
          <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </span>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            background: 'none', border: 'none', color: '#5a5048',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
          }}
        >
          <LogOut size={12} /> 로그아웃
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        style={{
          background: '#00a885', border: 'none', borderRadius: 8,
          padding: '6px 14px', color: '#fff', fontWeight: 800,
          fontSize: 12, cursor: 'pointer',
        }}
      >
        로그인
      </button>
      <LoginModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => setModalOpen(false)}
      />
    </>
  );
}
