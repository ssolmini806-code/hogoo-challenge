import { useMemo, useState } from 'react';
import { parseTypeKey } from '../../src/rewards/result-id';
import { REWARD_TYPE_LABEL } from '../../src/rewards/reward-types';
import { TYPES, plainName } from '../../src/rewards/give-reward-content';
import { buildResultShareUrl } from '../../src/rewards/share-url';

// 마이페이지 "나의 보상 봉투" 렌더러.
// generated_content가 없어도 오류 화면을 만들지 않고 배지만 안전하게 보여준다.

const styles = {
  group: { border: '1px solid var(--line)', borderRadius: 12, padding: 14, marginBottom: 12 },
  groupHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  typeName: { fontSize: 15, fontWeight: 700, color: 'var(--ink)' },
  date: { fontSize: 12, color: 'var(--ink-faint)' },
  badgeRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  badge: {
    padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
    background: 'var(--surface-2)', color: 'var(--ink-sub)',
  },
  actions: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  btn: {
    minHeight: 44, padding: '0 14px', borderRadius: 10,
    border: '1px solid var(--line)', background: 'transparent',
    color: 'var(--ink)', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
  },
  detail: {
    marginTop: 12, padding: 12, borderRadius: 10,
    background: 'var(--surface-2)', fontSize: 14, lineHeight: 1.7, color: 'var(--ink-sub)',
    whiteSpace: 'pre-wrap',
  },
  heading: { margin: '0 0 4px', fontSize: 12, fontWeight: 800, color: 'var(--ink-faint)' },
  empty: { fontSize: 15, color: 'var(--ink-faint)', textAlign: 'center', padding: '20px 0', lineHeight: 1.6 },
};

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** generated_content(JSON)를 마이페이지에서 다시 읽을 수 있는 형태로 편다. */
function RewardContent({ content }) {
  if (!content || typeof content !== 'object') return null;

  if (content.kind === 'boundary_card') {
    return (
      <div style={styles.detail}>
        <p style={styles.heading}>{content.title}</p>
        <p style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--ink)' }}>“{content.sentence}”</p>
        <p style={{ margin: 0 }}>{content.situation}</p>
      </div>
    );
  }

  if (content.kind === 'risk_scenes') {
    return (
      <div style={styles.detail}>
        <p style={styles.heading}>{content.title}</p>
        {(content.scenes ?? []).map((scene, i) => (
          <p key={i} style={{ margin: '0 0 8px' }}>
            <strong style={{ color: 'var(--ink)' }}>{scene.scene}</strong>
            {'\n'}신호 · {scene.signal}
            {'\n'}한 문장 · “{scene.response}”
          </p>
        ))}
      </div>
    );
  }

  if (content.kind === 'goodwill_manual') {
    return (
      <div style={styles.detail}>
        <p style={styles.heading}>{content.title}</p>
        {(content.sections ?? []).map((section) => (
          <p key={section.id} style={{ margin: '0 0 8px' }}>
            <strong style={{ color: 'var(--ink)' }}>{section.heading}</strong>
            {'\n'}
            {Array.isArray(section.body) ? section.body.join('\n') : section.body}
          </p>
        ))}
      </div>
    );
  }

  return null;
}

export default function RewardArchive({ rewards }) {
  const [openId, setOpenId] = useState('');

  const groups = useMemo(() => {
    const unlocked = (rewards ?? []).filter((row) => row.unlocked);
    const byResult = new Map();
    for (const row of unlocked) {
      // result_id가 없는 예전 보상은 지우지 않고 "이전 무료 보상"으로 따로 묶는다.
      const key = row.result_id || '__legacy__';
      if (!byResult.has(key)) byResult.set(key, []);
      byResult.get(key).push(row);
    }
    return [...byResult.entries()].map(([resultId, rows]) => {
      const typeKey = resultId === '__legacy__' ? null : parseTypeKey(resultId);
      return {
        resultId,
        typeKey,
        label: typeKey ? plainName(TYPES[typeKey].name) : '이전 무료 보상',
        rows: rows.slice().sort((a, b) => String(a.reward_type).localeCompare(String(b.reward_type))),
        earnedAt: rows.map((r) => r.created_at).filter(Boolean).sort()[0] ?? null,
      };
    });
  }, [rewards]);

  if (!groups.length) {
    return <p style={styles.empty}>아직 열어본 무료 결과 보상이 없어요</p>;
  }

  return (
    <>
      {groups.map((group) => (
        <div key={group.resultId} style={styles.group}>
          <div style={styles.groupHead}>
            <span style={styles.typeName}>{group.label}</span>
            {group.earnedAt ? <span style={styles.date}>{formatDate(group.earnedAt)}</span> : null}
          </div>

          <div style={styles.badgeRow}>
            {group.rows.map((row) => (
              <span key={row.id} style={styles.badge}>
                {REWARD_TYPE_LABEL[row.reward_type] || row.reward_type}
              </span>
            ))}
          </div>

          {group.typeKey ? (
            <div style={styles.actions}>
              {group.rows.filter((row) => row.generated_content).map((row) => (
                <button
                  key={row.id}
                  type="button"
                  style={styles.btn}
                  aria-expanded={openId === row.id}
                  onClick={() => setOpenId(openId === row.id ? '' : row.id)}
                >
                  {openId === row.id ? '접기' : `${REWARD_TYPE_LABEL[row.reward_type] || row.reward_type} 다시 보기`}
                </button>
              ))}
              <a
                style={{ ...styles.btn, textDecoration: 'none' }}
                href={buildResultShareUrl(window.location.origin, group.typeKey)}
              >
                결과 다시 보기
              </a>
            </div>
          ) : (
            <p style={{ ...styles.date, marginTop: 10 }}>
              결과 유형 정보가 없는 예전 보상이에요. 기록은 그대로 보관됩니다.
            </p>
          )}

          {group.rows
            .filter((row) => row.id === openId)
            .map((row) => <RewardContent key={row.id} content={row.generated_content} />)}
        </div>
      ))}
    </>
  );
}
