import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const BADGE_LABEL = { gold: '골드', silver: '실버' };
const CONTEXT_LABEL = { giveid: 'GIVE ID', paid_30day: '30일 플랜' };
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

  useEffect(() => {
    if (!session?.user?.id) { setLoading(false); return; }
    const uid = session.user.id;

    Promise.allSettled([
      supabase.from('profiles').select('nickname, challenge_name').eq('id', uid).single(),
      supabase.from('user_rewards').select('reward_type, reward_context, unlocked').eq('user_id', uid),
      supabase.from('hall_of_fame').select('badge_level, completion_rate, created_at').eq('user_id', uid).single(),
      supabase.from('reviews').select('content, review_context, created_at').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('payment_orders').select('product_key, status, paid_at').eq('user_id', uid).order('paid_at', { ascending: false }),
      supabase.from('user_subscriptions').select('product_key, status').eq('user_id', uid),
    ]).then(([profileRes, rewardsRes, hofRes, reviewsRes, ordersRes, subsRes]) => {
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
      if (rewardsRes.status === 'fulfilled') setRewards(rewardsRes.value.data ?? []);
      if (hofRes.status === 'fulfilled') setHallOfFame(hofRes.value.data);
      if (reviewsRes.status === 'fulfilled') setMyReviews(reviewsRes.value.data ?? []);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data ?? []);
      if (subsRes.status === 'fulfilled') setSubscriptions(subsRes.value.data ?? []);
      setLoading(false);
    });
  }, [session]);

  const rewardsByContext = rewards.filter(r => r.unlocked);
  const giveidRewards = rewardsByContext.filter(r => r.reward_context === 'giveid');
  const paid30Rewards = rewardsByContext.filter(r => r.reward_context === 'paid_30day');

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

        {/* 보상 현황 */}
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
          {rewardsByContext.length === 0 && (
            <p style={styles.emptyText}>아직 해금된 보상이 없어요</p>
          )}
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
                {CONTEXT_LABEL[r.review_context] || r.review_context} · {formatDate(r.created_at)}
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
      </div>
    </div>
  );
}
