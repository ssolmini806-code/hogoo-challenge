import { useState } from 'react';
import { toPng } from 'html-to-image';
import { trackReward } from '../../src/rewards/reward-analytics';

let brushFontCssPromise;
const SOCIAL_CARD_WIDTH = 1080;
const SOCIAL_CARD_HEIGHT = 1350;

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function getBrushFontCss() {
  if (!brushFontCssPromise) {
    brushFontCssPromise = fetch('/fonts/jeongmeokbawi.woff')
      .then((response) => {
        if (!response.ok) throw new Error(`Brush font request failed: ${response.status}`);
        return response.blob();
      })
      .then(blobToDataUrl)
      .then((dataUrl) => `@font-face{font-family:'Give Brush';src:url('${dataUrl}') format('woff');font-style:normal;font-weight:400;}`);
  }
  return brushFontCssPromise;
}

function download(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export default function RewardExportActions({ targetId, filename, shareText, copyText, rewardType, typeKey }) {
  const [status, setStatus] = useState('');

  const saveOrShare = async () => {
    const target = document.getElementById(targetId);
    if (!target) return;
    setStatus('카드를 만들고 있어요…');
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const fontEmbedCSS = await getBrushFontCss();
      const dataUrl = await toPng(target, {
        cacheBust: true,
        // DOM preview width and device DPR must not decide the quality of a keepsake.
        // Always render the 4:5 card at the standard social-image resolution.
        canvasWidth: SOCIAL_CARD_WIDTH,
        canvasHeight: SOCIAL_CARD_HEIGHT,
        pixelRatio: 1,
        skipAutoScale: true,
        backgroundColor: '#f7eedb',
        // Embed only the self-hosted display face. This keeps the exported image
        // faithful without asking html-to-image to read cross-origin font CSS.
        fontEmbedCSS,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '나의 GIVE ID 보상', text: shareText });
        setStatus('보상 카드를 공유했어요.');
        trackReward('reward_export', { result_type: typeKey, reward_type: rewardType, method: 'native_share', logged_in: true });
      } else {
        download(dataUrl, filename);
        setStatus('보상 카드 이미지를 저장했어요.');
        trackReward('reward_export', { result_type: typeKey, reward_type: rewardType, method: 'download', logged_in: true });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setStatus('공유를 취소했어요.');
        return;
      }
      console.error('Reward export failed:', error);
      setStatus('카드를 만들지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setStatus('실전 문장을 복사했어요.');
      trackReward('reward_copy', { result_type: typeKey, reward_type: rewardType, logged_in: true });
    } catch {
      setStatus('복사하지 못했어요. 문장을 길게 눌러 복사해주세요.');
    }
  };

  return (
    <div className="reward-export-actions">
      <button type="button" className="reward-btn is-primary" onClick={saveOrShare}>이미지 저장·공유</button>
      {copyText ? <button type="button" className="reward-btn" onClick={copy}>실전 문장 복사</button> : null}
      {status ? <p role="status">{status}</p> : null}
    </div>
  );
}
