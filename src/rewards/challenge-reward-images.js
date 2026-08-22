const BACKGROUND_URL = '/images/rewards/seven-day-keepsake-bg-v1.webp';
const INK = '#2f2419';
const VERMILION = '#a83b27';
const PAPER = '#f7eedb';

function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Reward artwork could not be loaded: ${src}`));
    image.src = src;
  });
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const characters = [...String(text || '')];
  const lines = [];
  let line = '';
  for (const character of characters) {
    const candidate = line + character;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = character;
      if (lines.length === maxLines - 1) break;
    } else {
      line = candidate;
    }
  }
  const used = lines.join('').length;
  if (line && lines.length < maxLines) {
    const truncated = used + line.length < characters.length;
    lines.push(truncated ? `${line.slice(0, -1)}…` : line);
  }
  lines.forEach((value, index) => context.fillText(value, x, y + index * lineHeight));
  return lines.length;
}

async function prepare(width, height) {
  if (document.fonts) {
    await Promise.all([
      document.fonts.ready,
      document.fonts.load('700 92px "Give Hahmlet"'),
    ]);
  }
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not supported');
  const image = await loadImage(BACKGROUND_URL);
  context.drawImage(image, 0, 0, width, height);
  return { canvas, context };
}

function drawMilestones(context, y, width) {
  const start = 180;
  const end = width - 180;
  context.strokeStyle = 'rgba(47,36,25,.34)';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(start, y);
  context.lineTo(end, y);
  context.stroke();
  for (let index = 0; index < 7; index += 1) {
    const x = start + ((end - start) * index) / 6;
    context.beginPath();
    context.arc(x, y, 24, 0, Math.PI * 2);
    context.fillStyle = index === 6 ? VERMILION : INK;
    context.fill();
    context.fillStyle = PAPER;
    context.font = '800 23px Pretendard, sans-serif';
    context.textAlign = 'center';
    context.fillText('✓', x, y + 8);
  }
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG creation failed'))), 'image/png');
  });
}

export async function createChallengeCertificate({ certificate, completionDays, memoir }) {
  const { canvas, context } = await prepare(1200, 1600);
  context.fillStyle = 'rgba(247,238,219,.84)';
  roundRect(context, 92, 92, 1016, 1140, 22);
  context.fill();
  context.strokeStyle = INK;
  context.lineWidth = 3;
  context.stroke();
  context.strokeStyle = VERMILION;
  context.lineWidth = 1;
  context.strokeRect(108, 108, 984, 1108);

  context.textAlign = 'center';
  context.fillStyle = VERMILION;
  context.font = '800 24px Pretendard, sans-serif';
  context.fillText('GIVE ECOSYSTEM  ·  SEVEN-DAY PRACTICE', 600, 195);

  context.fillStyle = INK;
  context.font = '700 46px "Give Hahmlet", serif';
  context.fillText('내 선의를 지키는 기준을', 600, 310);
  context.font = '700 82px "Give Hahmlet", serif';
  context.fillText('끝까지 연습했습니다', 600, 430);

  context.fillStyle = VERMILION;
  context.font = '700 168px "Give Hahmlet", serif';
  context.fillText('7일', 600, 640);
  context.fillStyle = INK;
  context.font = '800 28px Pretendard, sans-serif';
  context.fillText('경계 연습 완주 인증서', 600, 700);

  drawMilestones(context, 790, 1200);

  context.fillStyle = INK;
  context.font = '700 34px "Give Hahmlet", serif';
  const anchor = memoir?.anchor || '나는 더 이상 자동으로 수락하지 않는다.';
  wrapText(context, `“${anchor}”`, 600, 900, 790, 52, 2);

  const stats = `${completionDays}/7 DAYS   ·   ${certificate.completedMissions}/21 MISSIONS   ·   ${memoir?.noteCount || 0} NOTES`;
  context.fillStyle = 'rgba(47,36,25,.9)';
  roundRect(context, 250, 1035, 700, 72, 36);
  context.fill();
  context.fillStyle = PAPER;
  context.font = '800 23px Pretendard, sans-serif';
  context.fillText(stats, 600, 1080);

  context.fillStyle = 'rgba(247,238,219,.92)';
  roundRect(context, 90, 1320, 1020, 190, 18);
  context.fill();
  context.textAlign = 'left';
  context.fillStyle = INK;
  context.font = '700 23px Pretendard, sans-serif';
  context.fillText('OFFICIALLY COMPLETED', 130, 1382);
  context.font = '500 21px Pretendard, sans-serif';
  context.fillText(new Date(certificate.issuedAt).toLocaleDateString('ko-KR'), 130, 1425);
  context.textAlign = 'right';
  context.font = '500 19px ui-monospace, monospace';
  context.fillText(certificate.code, 1070, 1382);
  context.font = '500 14px ui-monospace, monospace';
  context.fillText(`hogoo-challenge.pages.dev/certificate.html?code=${certificate.code}`, 1070, 1425);
  context.fillStyle = VERMILION;
  context.font = '800 21px Pretendard, sans-serif';
  context.fillText('검증 가능한 디지털 원본', 1070, 1470);

  return canvasToBlob(canvas);
}

export async function createChallengeShareCard({ memoir, completionDays }) {
  const { canvas, context } = await prepare(1080, 1350);
  context.fillStyle = 'rgba(247,238,219,.9)';
  roundRect(context, 64, 64, 952, 820, 30);
  context.fill();

  context.textAlign = 'left';
  context.fillStyle = VERMILION;
  context.font = '800 25px Pretendard, sans-serif';
  context.fillText('7-DAY BOUNDARY PRACTICE  ·  COMPLETED', 112, 145);
  context.fillStyle = INK;
  context.font = '700 72px "Give Hahmlet", serif';
  context.fillText('나는 7일 동안,', 112, 275);
  context.fillText('자동 수락 대신', 112, 375);
  context.fillStyle = VERMILION;
  context.fillText('내 기준을 연습했다.', 112, 475);

  context.fillStyle = INK;
  context.font = '700 31px "Give Hahmlet", serif';
  wrapText(context, `“${memoir?.anchor || '나는 더 이상 자동으로 수락하지 않는다.'}”`, 112, 585, 820, 50, 2);

  const metrics = [
    [`${completionDays}/7`, '완주'],
    [`${memoir?.completedMissions || 0}/21`, '미션'],
    [`${memoir?.noteCount || 0}`, '기록'],
  ];
  metrics.forEach(([value, label], index) => {
    const x = 112 + index * 290;
    context.fillStyle = INK;
    context.font = '800 45px Pretendard, sans-serif';
    context.fillText(value, x, 755);
    context.fillStyle = '#74604b';
    context.font = '700 19px Pretendard, sans-serif';
    context.fillText(label, x, 795);
  });

  drawMilestones(context, 960, 1080);
  context.textAlign = 'left';
  context.fillStyle = 'rgba(47,36,25,.9)';
  roundRect(context, 64, 1110, 952, 176, 24);
  context.fill();
  context.fillStyle = PAPER;
  context.font = '700 27px "Give Hahmlet", serif';
  context.fillText('친절함을 버린 게 아니라, 지키는 법을 배웠다.', 112, 1180);
  context.font = '700 20px Pretendard, sans-serif';
  context.fillText('GIVE ECOSYSTEM  ·  hogoo-challenge.pages.dev', 112, 1232);

  return canvasToBlob(canvas);
}

export function downloadRewardImage(blob, filename) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = href;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
