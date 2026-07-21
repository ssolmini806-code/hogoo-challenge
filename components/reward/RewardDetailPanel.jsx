import { useEffect, useRef } from 'react';

// 해금된 보상의 상세 내용을 보여주는 풀스크린 서브패널.
// 슬라이드 위에 종이 한 장이 올라온 것처럼 보이게 하고,
// 열면 포커스가 들어오고 Escape/닫기로 원래 버튼에 포커스를 돌려준다.

const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

export default function RewardDetailPanel({ title, eyebrow, onClose, children, footer }) {
  const panelRef = useRef(null);
  const headingRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    headingRef.current?.focus();

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = Array.from(panelRef.current?.querySelectorAll(FOCUSABLE) ?? []);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      // 포커스 트랩: 패널 밖으로 탭이 새어 나가지 않게 한다
      if (event.shiftKey && (active === first || active === headingRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const node = panelRef.current;
    node?.addEventListener('keydown', handleKey);
    return () => {
      node?.removeEventListener('keydown', handleKey);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="reward-panel" role="dialog" aria-modal="true" aria-labelledby="rewardPanelTitle" ref={panelRef}>
      <div className="reward-panel-sheet">
        <div className="reward-panel-head">
          <div>
            {eyebrow ? <p className="reward-panel-eyebrow">{eyebrow}</p> : null}
            <h3 className="reward-panel-title" id="rewardPanelTitle" tabIndex={-1} ref={headingRef}>
              {title}
            </h3>
          </div>
          <button type="button" className="reward-panel-close" onClick={onClose} aria-label="보상 닫고 결과로 돌아가기">
            닫기
          </button>
        </div>
        <div className="reward-panel-body">{children}</div>
        {footer ? <div className="reward-panel-foot">{footer}</div> : null}
      </div>
    </div>
  );
}
