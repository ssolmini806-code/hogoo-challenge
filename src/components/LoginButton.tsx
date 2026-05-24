import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { ChevronDown, LogOut } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import LoginModal from './LoginModal';

export default function LoginButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return null;

  if (user) {
    const name =
      user.user_metadata?.nickname ||
      user.user_metadata?.name ||
      user.email?.split('@')[0];
    const displayName = String(name || user.email || '사용자');
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          style={{
            background: 'transparent',
            border: '1px solid #3a3530',
            borderRadius: 999,
            color: '#f5ede3',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 30,
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 800,
            fontFamily: 'inherit',
          }}
        >
          <span>{initials}</span>
          <ChevronDown size={13} aria-hidden="true" />
        </button>

        {menuOpen ? (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              zIndex: 20,
              minWidth: 132,
              border: '1px solid #3a3530',
              borderRadius: 10,
              background: '#231f1c',
              boxShadow: '0 14px 30px rgba(0,0,0,.24)',
              padding: 6,
            }}
          >
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                color: '#c5b8ac',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 10px',
                fontSize: 12,
                fontWeight: 800,
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
            >
              <LogOut size={14} aria-hidden="true" />
              로그아웃
            </button>
          </div>
        ) : null}
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
