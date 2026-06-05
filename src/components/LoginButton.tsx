import { useState, useEffect, useRef, type FormEvent } from 'react';
import { supabase } from '../supabase';
import { ChevronDown, LogOut, Mail, UserPlus } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import LoginModal from './LoginModal';

export default function LoginButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailChangeSent, setEmailChangeSent] = useState(false);
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
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

  const handleInvite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const { error } = await supabase.functions.invoke('invite-user', {
        body: { email: inviteEmail },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      setInviteSent(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleEmailChange = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailChangeLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setEmailChangeSent(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEmailChangeLoading(false);
    }
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
            border: '1px solid var(--line)',
            borderRadius: 999,
            color: 'var(--green)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 44,
            padding: '8px 12px',
            fontSize: 13,
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
              minWidth: 148,
              border: '1px solid var(--line)',
              borderRadius: 10,
              background: 'var(--surface)',
              boxShadow: '0 14px 30px rgba(0,0,0,.24)',
              padding: 6,
            }}
          >
            <button
              type="button"
              onClick={() => { setMenuOpen(false); setShowInvite(true); setInviteSent(false); setInviteEmail(''); }}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                color: 'var(--ink-sub)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                minHeight: 44,
                padding: '9px 10px',
                fontSize: 14,
                fontWeight: 800,
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
            >
              <UserPlus size={14} aria-hidden="true" />
              친구 초대
            </button>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); setShowEmailChange(true); setEmailChangeSent(false); setNewEmail(''); }}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                color: 'var(--ink-sub)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                minHeight: 44,
                padding: '9px 10px',
                fontSize: 14,
                fontWeight: 800,
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
            >
              <Mail size={14} aria-hidden="true" />
              이메일 변경
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                color: 'var(--ink-sub)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                minHeight: 44,
                padding: '9px 10px',
                fontSize: 14,
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

        {showInvite && (
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => { if (e.target === e.currentTarget) setShowInvite(false); }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.72)', padding: '16px',
            }}
          >
            <div style={{
              width: '100%', maxWidth: 360,
              background: 'var(--surface)', borderRadius: 20, padding: '32px 24px',
              border: '1px solid var(--line)',
            }}>
              {inviteSent ? (
                <>
                  <h2 style={{ color: 'var(--ink)', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>🎉 초대를 보냈어요!</h2>
                  <p style={{ color: 'var(--ink-sub)', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                    <strong style={{ color: 'var(--ink)' }}>{inviteEmail}</strong>로<br />
                    초대 링크를 보냈어요. 친구가 클릭하면 바로 시작할 수 있어요.
                  </p>
                  <button
                    onClick={() => setShowInvite(false)}
                    style={{
                      width: '100%', minHeight: 44, padding: '13px', borderRadius: 10,
                      border: '1px solid var(--line)', background: 'transparent',
                      color: 'var(--ink-sub)', cursor: 'pointer', fontSize: 15, fontWeight: 700,
                    }}
                  >
                    닫기
                  </button>
                </>
              ) : (
                <>
                  <h2 style={{ color: 'var(--ink)', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>친구 초대하기</h2>
                  <p style={{ color: 'var(--ink-sub)', fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>
                    친구 이메일을 입력하면 챌린지 초대 링크를 보내드려요
                  </p>
                  <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input
                      type="email"
                      placeholder="친구 이메일 주소"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      style={{
                        padding: '13px 14px', borderRadius: 10, border: '1px solid var(--line)',
                        background: 'var(--surface)', color: 'var(--ink)', outline: 'none', fontSize: 15,
                      }}
                    />
                    <button
                      type="submit"
                      disabled={inviteLoading}
                      style={{
                        minHeight: 44, padding: '13px', borderRadius: 10, border: 'none',
                        background: 'var(--green)', color: 'var(--surface)', fontWeight: 800,
                        cursor: inviteLoading ? 'not-allowed' : 'pointer', fontSize: 15,
                        opacity: inviteLoading ? 0.7 : 1,
                      }}
                    >
                      {inviteLoading ? '전송 중...' : '초대 링크 보내기'}
                    </button>
                  </form>
                  <button
                    onClick={() => setShowInvite(false)}
                    style={{
                      marginTop: 12, minHeight: 44, background: 'none', border: 'none',
                      color: 'var(--ink-sub)', cursor: 'pointer', fontSize: 15,
                      textDecoration: 'underline', width: '100%',
                    }}
                  >
                    취소
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {showEmailChange && (
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => { if (e.target === e.currentTarget) setShowEmailChange(false); }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.72)', padding: '16px',
            }}
          >
            <div style={{
              width: '100%', maxWidth: 360,
              background: 'var(--surface)', borderRadius: 20, padding: '32px 24px',
              border: '1px solid var(--line)',
            }}>
              {emailChangeSent ? (
                <>
                  <h2 style={{ color: 'var(--ink)', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>📬 확인 메일을 보냈어요</h2>
                  <p style={{ color: 'var(--ink-sub)', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                    <strong style={{ color: 'var(--ink)' }}>{newEmail}</strong>로<br />
                    확인 링크를 보냈어요. 클릭하면 변경이 완료돼요.
                  </p>
                  <button
                    onClick={() => setShowEmailChange(false)}
                    style={{
                      width: '100%', minHeight: 44, padding: '13px', borderRadius: 10,
                      border: '1px solid var(--line)', background: 'transparent',
                      color: 'var(--ink-sub)', cursor: 'pointer', fontSize: 15, fontWeight: 700,
                    }}
                  >
                    닫기
                  </button>
                </>
              ) : (
                <>
                  <h2 style={{ color: 'var(--ink)', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>이메일 변경</h2>
                  <p style={{ color: 'var(--ink-sub)', fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>
                    새 이메일 주소를 입력하면 확인 링크를 보내드려요
                  </p>
                  <form onSubmit={handleEmailChange} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input
                      type="email"
                      placeholder="새 이메일 주소"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                      style={{
                        padding: '13px 14px', borderRadius: 10, border: '1px solid var(--line)',
                        background: 'var(--surface)', color: 'var(--ink)', outline: 'none', fontSize: 15,
                      }}
                    />
                    <button
                      type="submit"
                      disabled={emailChangeLoading}
                      style={{
                        minHeight: 44, padding: '13px', borderRadius: 10, border: 'none',
                        background: 'var(--green)', color: 'var(--surface)', fontWeight: 800,
                        cursor: emailChangeLoading ? 'not-allowed' : 'pointer', fontSize: 15,
                        opacity: emailChangeLoading ? 0.7 : 1,
                      }}
                    >
                      {emailChangeLoading ? '전송 중...' : '확인 링크 받기'}
                    </button>
                  </form>
                  <button
                    onClick={() => setShowEmailChange(false)}
                    style={{
                      marginTop: 12, minHeight: 44, background: 'none', border: 'none',
                      color: 'var(--ink-sub)', cursor: 'pointer', fontSize: 15,
                      textDecoration: 'underline', width: '100%',
                    }}
                  >
                    취소
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        style={{
          background: 'var(--green)', border: 'none', borderRadius: 8,
          minHeight: 44, padding: '8px 14px', color: 'var(--surface)', fontWeight: 800,
          fontSize: 14, cursor: 'pointer',
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
