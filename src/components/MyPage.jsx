import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import RewardArchive from '../../components/reward/RewardArchive';
import {
  mergeMyReviews,
  reviewContextLabel,
  CHALLENGE_REVIEW_COLUMNS,
  LEGACY_REVIEW_COLUMNS,
} from '../rewards/my-reviews';

const BADGE_LABEL = { gold: '골드', silver: '실버' };
const REWARD_LABEL = { sns: 'SNS 공유', review: '후기 작성', both: 'SNS + 후기' };
const ORDER_STATUS_LABEL = { paid: '결제 완료', refunded: '환불됨', pending: '처리 중' };
const SUB_STATUS_LABEL = { active: '구독 중', cancelled: '취소됨', expired: '만료됨' };

const styles = {
  page: {
    fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    background: 'var(--bg)',
    minHeight: '100vh',
    letterSpacing: '-0.01em',
    color: 'var(--ink)',
  },
  header: {
    background: 'var(--surface)',
    borderBottom: '1px solid var(--line)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--ink-sub)',
    cursor: 'pointer',
    fontSize: 15,
    minHeight: 44,
    padding: '10px 12px',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  container: { maxWidth: 600, margin: '0 auto', padding: '20px 16px 60px' },
  section: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 16,
    padding: '20px',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--green)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' },
  label: { fontSize: 15, color: 'var(--ink-sub)' },
  value: { fontSize: 15, fontWeight: 600, color: 'var(--ink)' },
  badge: (color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background: color === 'green' ? 'var(--green-soft)' : color === 'blue' ? 'var(--mint-soft)' : 'var(--surface-2)',
    color: color === 'green' ? 'var(--green)' : color === 'blue' ? 'var(--mint-ink)' : 'var(--ink-sub)',
    marginRight: 6,
    marginBottom: 6,
  }),
  emptyText: { fontSize: 15, color: 'var(--ink-faint)', textAlign: 'center', padding: '20px 0', lineHeight: 1.6 },
  reviewCard: {
    background: 'var(--surface-2)',
    border: '1px solid var(--line)',
    borderRadius: 10,
    padding: '12px 14px',
    marginBottom: 10,
  },
  orderCard: {
    background: 'var(--surface-2)',
    border: '1px solid var(--line)',
    borderRadius: 10,
    padding: '12px 14px',
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dangerSection: {
    background: 'rgba(159,50,35,.035)', border: '1px solid rgba(159,50,35,.22)',
    borderRadius: 16, padding: 20, marginBottom: 16,
  },
  dangerButton: {
    minHeight: 44, padding: '10px 14px', borderRadius: 10,
    border: '1px solid #9f3223', background: 'transparent', color: '#9f3223',
    fontFamily: 'inherit', fontSize: 14, fontWeight: 800, cursor: 'pointer',
  },
};

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function MyPage({ session, onBack }) {
  const [profile, setProfile] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [hallOfFame, setHallOfFame] = useState(null);
  const [myReviews, setMyReviews] = useState([]);
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (typeof window?.trackEvent === 'function') {
      window.trackEvent('reward_archive_view', { placement: 'mypage_reward_archive', logged_in: true });
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.id) { setLoading(false); return; }
    const uid = session.user.id;

    Promise.allSettled([
      supabase.from('profiles').select('nickname, challenge_name').eq('id', uid).single(),
      supabase.from('user_rewards')
        .select('id, result_id, reward_type, reward_context, unlocked, generated_content, created_at')
        .eq('user_id', uid),
      supabase.from('hall_of_fame').select('badge_level, completion_rate, created_at').eq('user_id', uid).single(),
      // 현재 후기는 challenge_reviews에 저장된다 (7일 챌린지 + 무료 GIVE ID 후기).
      // RLS가 허용하는 컬럼만 고르고, 항상 본인 user_id로 걸러 남의 후기가 섞이지 않게 한다.
      supabase.from('challenge_reviews').select(CHALLENGE_REVIEW_COLUMNS)
        .eq('user_id', uid).order('created_at', { ascending: false }),
      // 레거시 reviews 테이블. 없을 수도 있어서 실패해도 화면이 깨지지 않아야 한다.
      supabase.from('reviews').select(LEGACY_REVIEW_COLUMNS)
        .eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('payment_orders').select('product_key, status, paid_at').eq('user_id', uid).order('paid_at', { ascending: false }),
      supabase.from('user_subscriptions').select('product_key, status').eq('user_id', uid),
    ]).then(([profileRes, rewardsRes, hofRes, reviewsRes, legacyReviewsRes, ordersRes, subsRes]) => {
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
      if (rewardsRes.status === 'fulfilled') setRewards(rewardsRes.value.data ?? []);
      if (hofRes.status === 'fulfilled') setHallOfFame(hofRes.value.data);
      const challengeRows = reviewsRes.status === 'fulfilled' ? reviewsRes.value.data : null;
      const legacyRows = legacyReviewsRes.status === 'fulfilled' ? legacyReviewsRes.value.data : null;
      setMyReviews(mergeMyReviews(challengeRows, legacyRows));
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data ?? []);
      if (subsRes.status === 'fulfilled') setSubscriptions(subsRes.value.data ?? []);
      setLoading(false);
    });
  }, [session]);

  const rewardsByContext = rewards.filter(r => r.unlocked);
  // free_test = 무료 GIVE ID 결과 보상 (실제 저장 컨텍스트). 아래 "나의 보상 봉투"에서 따로 보여준다.
  const freeTestRewards = rewards.filter(r => r.reward_context === 'free_test');
  const giveidRewards = rewardsByContext.filter(r => r.reward_context === 'giveid');
  const paid30Rewards = rewardsByContext.filter(r => r.reward_context === 'paid_30day');
  const otherRewards = giveidRewards.length + paid30Rewards.length;

  const deleteAccount = async () => {
    if (deleteText !== '계정 삭제' || deleteLoading) return;
    setDeleteLoading(true);
    setDeleteError('');
    window.trackEvent?.('account_delete_started', { placement: 'mypage' });
    try {
      const { error } = await supabase.functions.invoke('delete-account', {
        body: { confirmation: deleteText },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      window.trackEvent?.('account_delete_completed', { placement: 'mypage' });
      await supabase.auth.signOut();
      ['give_reward_pending_intent_v1', 'free_test_reviewed'].forEach((key) => {
        try { window.localStorage.removeItem(key); window.sessionStorage.removeItem(key); } catch { /* noop */ }
      });
      window.location.replace('/?account=deleted');
    } catch (error) {
      console.error('Account deletion failed:', error);
      window.trackEvent?.('account_delete_failed', { placement: 'mypage' });
      let message = '삭제를 완료하지 못했어요. 로그인 상태를 확인한 뒤 다시 시도해주세요.';
      try {
        const body = await error?.context?.json?.();
        if (body?.code === 'SHARED_ACCOUNT') {
          message = '연결된 GIVE 서비스 기록이 있어 여기서는 계정 전체를 삭제할 수 없어요. 개인정보 문의를 이용해주세요.';
        }
      } catch { /* 응답 본문을 읽지 못하면 일반 안내를 유지한다 */ }
      setDeleteError(message);
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--ink-faint)', fontSize: 15 }}>불러오는 중...</span>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← 뒤로</button>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>마이페이지</span>
      </div>

      <div style={styles.container}>
        {/* 내 정보 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>내 정보</div>
          <div style={styles.row}>
            <span style={styles.label}>이메일</span>
            <span style={styles.value}>{session?.user?.email || '-'}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>닉네임</span>
            <span style={styles.value}>{profile?.nickname || '-'}</span>
          </div>
          <div style={{ ...styles.row, borderBottom: 'none' }}>
            <span style={styles.label}>챌린지명</span>
            <span style={styles.value}>{profile?.challenge_name || '-'}</span>
          </div>
        </div>

        {/* 보상 현황 — 챌린지·유료 보상. 무료 결과 보상은 아래 '나의 보상 봉투'에서 따로 보여준다. */}
        {otherRewards > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>보상 현황</div>
          {giveidRewards.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 8 }}>GIVE ID</div>
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {giveidRewards.map((r, i) => (
                  <span key={i} style={styles.badge('blue')}>{REWARD_LABEL[r.reward_type] || r.reward_type}</span>
                ))}
              </div>
            </div>
          )}
          {paid30Rewards.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 8 }}>30일 플랜</div>
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {paid30Rewards.map((r, i) => (
                  <span key={i} style={styles.badge('green')}>{REWARD_LABEL[r.reward_type] || r.reward_type}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        )}

        {/* 나의 보상 봉투 (무료 GIVE ID 결과 보상) */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>나의 보상 봉투</div>
          <RewardArchive rewards={freeTestRewards} />
        </div>

        {/* 명예의 전당 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>명예의 전당</div>
          {hallOfFame ? (
            <>
              <div style={styles.row}>
                <span style={styles.label}>배지</span>
                <span style={styles.badge(hallOfFame.badge_level === 'gold' ? 'yellow' : 'default')}>
                  {hallOfFame.badge_level === 'gold' ? '🥇' : '🥈'} {BADGE_LABEL[hallOfFame.badge_level] || hallOfFame.badge_level}
                </span>
              </div>
              <div style={styles.row}>
                <span style={styles.label}>완주율</span>
                <span style={styles.value}>{hallOfFame.completion_rate ?? 0}%</span>
              </div>
              <div style={{ ...styles.row, borderBottom: 'none' }}>
                <span style={styles.label}>등록일</span>
                <span style={styles.value}>{formatDate(hallOfFame.created_at)}</span>
              </div>
            </>
          ) : (
            <p style={styles.emptyText}>아직 명예의 전당에 등록되지 않았어요</p>
          )}
        </div>

        {/* 내 후기 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>내 후기</div>
          {myReviews.length > 0 ? myReviews.map((r, i) => (
            <div key={i} style={styles.reviewCard}>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 6 }}>
                {reviewContextLabel(r.context)} · {formatDate(r.createdAt)}
                {r.rating ? ` · ${'★'.repeat(Math.max(1, Math.min(5, r.rating)))}` : ''}
                {r.isLegacy ? ' · 이전 기록' : ''}
              </div>
              <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-sub)', lineHeight: 1.6 }}>{r.content}</p>
            </div>
          )) : (
            <p style={styles.emptyText}>아직 작성한 후기가 없어요</p>
          )}
        </div>

        {/* 구매 및 구독 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>구매 및 구독</div>
          {subscriptions.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 8 }}>구독</div>
              {subscriptions.map((s, i) => (
                <div key={i} style={styles.orderCard}>
                  <span style={styles.value}>{s.product_key}</span>
                  <span style={styles.badge(s.status === 'active' ? 'green' : 'default')}>
                    {SUB_STATUS_LABEL[s.status] || s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
          {orders.length > 0 ? (
            <>
              <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 8 }}>결제 내역</div>
              {orders.map((o, i) => (
                <div key={i} style={styles.orderCard}>
                  <div>
                    <div style={styles.value}>{o.product_key}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>{formatDate(o.paid_at)}</div>
                  </div>
                  <span style={styles.badge(o.status === 'paid' ? 'green' : 'default')}>
                    {ORDER_STATUS_LABEL[o.status] || o.status}
                  </span>
                </div>
              ))}
            </>
          ) : subscriptions.length === 0 ? (
            <p style={styles.emptyText}>구매 내역이 없어요</p>
          ) : null}
        </div>

        <div style={styles.dangerSection}>
          <div style={{ ...styles.sectionTitle, color: '#9f3223' }}>계정 관리</div>
          {!deleteOpen ? (
            <>
              <p style={{ margin: '0 0 14px', color: 'var(--ink-sub)', fontSize: 14, lineHeight: 1.65 }}>
                계정과 저장된 검사·보상·후기 기록을 삭제할 수 있어요. 삭제 후에는 복구할 수 없습니다.
              </p>
              <button type="button" style={styles.dangerButton} onClick={() => setDeleteOpen(true)}>계정 삭제하기</button>
            </>
          ) : (
            <div role="group" aria-labelledby="delete-account-title">
              <p id="delete-account-title" style={{ margin: '0 0 10px', color: 'var(--ink)', fontSize: 14, fontWeight: 700, lineHeight: 1.6 }}>
                계속하려면 아래에 <strong>계정 삭제</strong>를 입력하세요.
              </p>
              <input
                value={deleteText}
                onChange={(event) => setDeleteText(event.target.value)}
                aria-label="계정 삭제 확인 문구"
                autoComplete="off"
                style={{ boxSizing: 'border-box', width: '100%', minHeight: 44, padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)', color: 'var(--ink)', font: 'inherit' }}
              />
              {deleteError ? <p role="alert" style={{ margin: '10px 0 0', color: '#9f3223', fontSize: 13 }}>{deleteError}</p> : null}
              {deleteError.includes('개인정보 문의') ? (
                <a href="/affiliate.html" style={{ display: 'inline-block', marginTop: 8, color: '#9f3223', fontSize: 13, fontWeight: 800 }}>개인정보 문의하기</a>
              ) : null}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                <button type="button" style={{ ...styles.dangerButton, opacity: deleteText === '계정 삭제' && !deleteLoading ? 1 : .45 }} disabled={deleteText !== '계정 삭제' || deleteLoading} onClick={deleteAccount}>
                  {deleteLoading ? '삭제 중…' : '영구 삭제'}
                </button>
                <button type="button" style={{ ...styles.dangerButton, borderColor: 'var(--line)', color: 'var(--ink-sub)' }} disabled={deleteLoading} onClick={() => { setDeleteOpen(false); setDeleteText(''); setDeleteError(''); }}>
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
