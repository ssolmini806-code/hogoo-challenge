import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// 해금된 보상의 상세 내용을 보여주는 풀스크린 서브패널.
// 슬라이드 위에 종이 한 장이 올라온 것처럼 보이게 하고,
// 열면 포커스가 들어오고 Escape/닫기/배경 클릭으로 원래 버튼에 포커스를 돌려준다.
//
// document.body에 포털로 렌더링한다. 슬라이드에 걸린 transform이
// position:fixed의 기준(containing block)을 슬라이드로 바꿔버려서,
// 슬라이드 안에 두면 오버레이가 화면 전체를 덮지 못하고
// 헤더 클릭이 슬라이드 엔진으로 새어 나간다.

const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

// 포털 전용 컨테이너. 슬라이드 엔진은 document에서 클릭·키를 듣고 페이지를 넘기므로
// 여기서 전파를 끊는다. React는 이 컨테이너에 이벤트를 위임하고,
// stopPropagation은 같은 노드의 다른 리스너를 막지 않으므로 패널 내부 버튼은 정상 동작한다.
let portalHost = null;

function getPortalHost() {
  if (portalHost) return portalHost;
  portalHost = document.createElement('div');
  portalHost.className = 'reward-panel-host';
  ['click', 'pointerdown', 'keydown', 'touchstart', 'touchend'].forEach((name) => {
    portalHost.addEventListener(name, (event) => event.stopPropagation());
  });
  document.body.appendChild(portalHost);
  return portalHost;
}

export default function RewardDetailPanel({ title, eyebrow, onClose, children, footer }) {
  const panelRef = useRef(null);
  const headingRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    headingRef.current?.focus();

    const handleKey = (event) => {
      // 모달이 열려 있는 동안 키는 슬라이드 엔진으로 넘기지 않는다.
      // (본문을 클릭하면 포커스가 body로 가서, 이 처리가 없으면
      //  방향키·스페이스로 뒤 슬라이드가 넘어간다.)
      event.stopPropagation();
      if (event.key === 'Escape') {
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

    // 패널 노드에만 걸면 본문을 클릭해 포커스가 body로 옮겨간 뒤 Escape가 먹지 않는다.
    // 캡처 단계로 듣는다 — 포털 호스트가 버블 단계를 끊기 때문이다.
    document.addEventListener('keydown', handleKey, true);

    // aria-modal만으로는 배경이 탐색에서 빠지지 않는다. 열려 있는 동안만 비활성화한다.
    const background = document.getElementById('slideReward');
    background?.setAttribute('aria-hidden', 'true');
    if (background) background.inert = true;

    return () => {
      document.removeEventListener('keydown', handleKey, true);
      background?.removeAttribute('aria-hidden');
      if (background) background.inert = false;
      previous?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div
      className="reward-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rewardPanelTitle"
      ref={panelRef}
      onClick={(event) => { if (event.target === panelRef.current) onClose(); }}
    >
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
    </div>,
    getPortalHost(),
  );
}
