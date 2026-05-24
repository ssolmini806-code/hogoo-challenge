import type { CSSProperties } from 'react';
import type { FreeTestAdvice } from '../../lib/advice/freeTestAdvice';

type AdviceCardProps = {
  advice: FreeTestAdvice;
};

const styles = {
  box: {
    marginTop: 12,
    borderRadius: 10,
    background: '#2a241c',
    border: '1px solid #4a3f30',
    padding: 12,
  } as CSSProperties,

  title: {
    fontSize: 13,
    fontWeight: 800,
    color: '#f7c56b',
    margin: '0 0 6px',
  } as CSSProperties,

  text: {
    fontSize: 13,
    color: '#dccdbf',
    lineHeight: 1.65,
    margin: 0,
  } as CSSProperties,

  list: {
    margin: 0,
    paddingLeft: 18,
    color: '#dccdbf',
    fontSize: 13,
    lineHeight: 1.65,
  } as CSSProperties,
};

export default function AdviceCard({ advice }: AdviceCardProps) {
  return (
    <div style={styles.box}>
      <p style={styles.title}>핵심 문제</p>
      <p style={styles.text}>{advice.coreProblem}</p>

      <p style={{ ...styles.title, marginTop: 12 }}>반복 패턴</p>
      <p style={styles.text}>{advice.repeatPattern}</p>

      <p style={{ ...styles.title, marginTop: 12 }}>현실적인 행동 조언</p>
      <ol style={styles.list}>
        {advice.realisticActions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ol>
    </div>
  );
}
