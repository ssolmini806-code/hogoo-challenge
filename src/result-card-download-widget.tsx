import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import ResultCardDownloadButton from '../components/result/ResultCardDownloadButton';

type ResultCardDownloadWidgetProps = {
  targetId: string;
  fileName: string;
};

function ResultCardDownloadWidget({ targetId, fileName }: ResultCardDownloadWidgetProps) {
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    targetRef.current = document.getElementById(targetId);
  }, [targetId]);

  return <ResultCardDownloadButton targetRef={targetRef} fileName={fileName} />;
}

document.querySelectorAll<HTMLElement>('[data-result-card-download-root]').forEach((element) => {
  const targetId = element.dataset.targetId || 'shareCard';
  const fileName = element.dataset.fileName || 'give-id-card.png';

  createRoot(element).render(
    <ResultCardDownloadWidget targetId={targetId} fileName={fileName} />,
  );
});
