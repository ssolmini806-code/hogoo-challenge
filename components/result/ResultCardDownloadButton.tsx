'use client';

import { useState } from 'react';
import type { RefObject } from 'react';
import { toPng } from 'html-to-image';

type ResultCardDownloadButtonProps = {
  targetRef: RefObject<HTMLElement>;
  fileName: string;
};

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}

export default function ResultCardDownloadButton({
  targetRef,
  fileName,
}: ResultCardDownloadButtonProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleClick = async () => {
    if (!targetRef.current || isSaving) return;

    setIsSaving(true);

    try {
      const dataUrl = await toPng(targetRef.current, {
        cacheBust: true,
        pixelRatio: Math.min(window.devicePixelRatio || 2, 3),
      });
      downloadDataUrl(dataUrl, fileName);
    } catch (error) {
      console.error('Result card download failed:', error);
      alert('결과 카드 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSaving}
      className="result-card-download-button inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-violet-600 bg-white px-4 text-sm font-extrabold text-violet-700 transition hover:bg-violet-50 disabled:cursor-wait disabled:opacity-60"
    >
      {isSaving ? '저장 중...' : '결과 카드 저장하기'}
    </button>
  );
}
