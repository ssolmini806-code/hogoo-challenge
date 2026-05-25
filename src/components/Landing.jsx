import { useState } from 'react';
import { detectLocale } from '../lib/i18n';

const copy = {
  ko: {
    membershipTitle: '내 패턴을 아는 것에서 끝내지 마세요.',
    membershipBody: 'GIVE ID로 확인하고, 30일 동안 매일 하나씩 바꿉니다. 진단만으로 끝내지 않고 기록과 행동까지 이어가는 것이 핵심입니다.',
    challengeHeadline: '30일 동안 매일 하나씩 바꾸기',
    challengeCta: '30일 변화 시작하기',
  },
  en: {
    membershipTitle: 'Do not stop at knowing your pattern.',
    membershipBody: 'Use GIVE ID to see it, then change one action each day for 30 days. The core experience is not just diagnosis, but action and records.',
    challengeHeadline: 'Change one action each day for 30 days',
    challengeCta: 'Start 30-day change',
  },
};

export default function Landing({ locale: localeProp, onCtaClick }) {
  const [locale] = useState(() => localeProp || detectLocale());
  const t = copy[locale] || copy.ko;

  return (
    <div style={{
      fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      letterSpacing: '-0.01em',
    }}>
      {/* Membership pitch */}
      <section style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 20,
        padding: '36px 28px',
        marginBottom: 16,
      }}>
        <h2 style={{
          margin: '0 0 14px',
          fontSize: 22,
          fontWeight: 800,
          color: '#0f172a',
          lineHeight: 1.3,
          letterSpacing: '-0.03em',
          wordBreak: 'keep-all',
        }}>
          {t.membershipTitle}
        </h2>
        <p style={{
          margin: '0 0 28px',
          fontSize: 15,
          color: '#475569',
          lineHeight: 1.7,
          wordBreak: 'keep-all',
        }}>
          {t.membershipBody}
        </p>

        {/* Challenge CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '1px solid #bbf7d0',
          borderRadius: 14,
          padding: '20px 20px 22px',
        }}>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#16a34a',
            letterSpacing: '0.04em',
            marginBottom: 8,
          }}>
            30 DAY CHALLENGE
          </div>
          <h3 style={{
            margin: '0 0 16px',
            fontSize: 18,
            fontWeight: 800,
            color: '#14532d',
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
            wordBreak: 'keep-all',
          }}>
            {t.challengeHeadline}
          </h3>
          <button
            onClick={onCtaClick}
            style={{
              display: 'block',
              width: '100%',
              padding: '14px',
              background: '#00a885',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '-0.01em',
            }}
          >
            {t.challengeCta}
          </button>
        </div>
      </section>
    </div>
  );
}
